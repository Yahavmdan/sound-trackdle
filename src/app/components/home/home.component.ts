import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { FileService } from "../../shared/services/file.service";
import { AsyncPipe, NgClass, NgForOf, NgIf, TitleCasePipe } from "@angular/common";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { map, Observable, startWith } from "rxjs";
import { fade, glideY } from "../../shared/utilities/animations";
import { File } from "../../shared/types/file.type";
import { ThemeService } from "../../shared/services/theme.service";
import { environment } from "../../../environments/environment";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from "../../../environments/environment.prod";
import { LoginComponent } from "../login/login.component";
import { ConfettiComponent } from "../../shared/components/confetti/confetti.component";
import { MatTooltip } from "@angular/material/tooltip";
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { PlayerComponent } from "../player/player.component";
import { TrackInfoComponent } from "../track-info/track-info.component";
import { readJson, writeJson } from "../../shared/utilities/storage-recovery";

export type Difficulty = 'easy' | 'medium' | 'hard';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [NgIf, NgForOf, NgClass, AsyncPipe, MatAutocompleteModule, TitleCasePipe, ReactiveFormsModule,
    LoginComponent, ConfettiComponent, MatTooltip, PlayerComponent, TrackInfoComponent],
  standalone: true,
  animations: [
    fade('fade', 500),
    glideY('glide', -50, 200)
  ]
})

export class HomeComponent implements OnInit {
  public audioUrl: WritableSignal<string | null> = signal('');
  public movieInput: FormControl = new FormControl('');
  public filteredOptions!: Observable<File[]>;
  public hints: string[] = [];
  public file!: File;
  public files!: File[];
  public isLost: boolean = false;
  public isWin: WritableSignal<boolean> = signal(false);
  public isDarkMode!: boolean;
  public isLoading: boolean = false;
  public isRecentLoading: boolean = false;
  public isMobile: boolean = false;
  public isAudioPlaying: boolean = false;
  public isRandom: boolean = false;
  /** Date of the past challenge being replayed, or null for today's / a random song. */
  public archiveDate: string | null = null;
  public showRecent: boolean = false;
  public readonly difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  /** Level used for random songs; null = any level. Remembered between visits. */
  public difficultyFilter: Difficulty | null = this._storedDifficulty();
  public notice: string | null = null;
  /** Random songs heard in this visit, so they are not repeated until all were heard. */
  private _heard: string[] = [];
  private _holdTimeout!: ReturnType<typeof setTimeout>;
  private _holdDuration: number = 1000;
  public isHolding: boolean = false;
  public step: number = 0;
  private _movies: File[] = [];


  constructor(private _fileService: FileService,
              public themeService: ThemeService,
              private _localStorageService: LocalStorageService) {
  }

  ngOnInit(): void {
    this._startupVersionCheck();
    this._listenToInput();
    this._listenToTheme();
    this._initializeAnalytics();
    this.isMobile = window.innerWidth < 768;
    this.isLoading = true;
  }

  private _initializeAnalytics(): void {
    environment.production
      ? getAnalytics(initializeApp(firebaseConfig))
      : null;
  }

  public toggleRecent(): void {
    this.showRecent = !this.showRecent;
    if (this.showRecent) this.getRecentFiles();
  }

  public getRecentFiles(): void {
    if (this.files?.length) return;
    this.isRecentLoading = true;
    this.files = [];
    this._fileService.getRecentFiles().subscribe(res => {
      this.isRecentLoading = false;
      this.files = res;
      this._assignIfClicked();
    })
  }

  private _assignIfClicked(): void {
    this.files.forEach(file => {
      file.clicked = this._isClicked(file.token!);
    });
  }

  private _isClicked(id: string): boolean {
    try {
      return localStorage.getItem(id) === 'clicked';
    } catch {
      return false;
    }
  }

  private _markAsClicked(token: string): void {
    try {
      localStorage.setItem(token, 'clicked');
    } catch {
      // storage full or blocked - only the "played" mark is lost
    }
  }

  public getFile(token?: string, input?: HTMLInputElement): void {
    if (this.isAudioPlaying) return;
    this.isLoading = true;
    if (token) {
      this.audioUrl.set(null)
      this._markAsClicked(token);
      this._assignIfClicked();
    }
    if (input) {
      input.disabled = false;
    }

    this.audioUrl.set(null);
    this.movieInput.enable();
    this.movieInput.setValue('');
    this._reset();
    this.isRandom = false;
    this.archiveDate = token ? (this.files?.find(f => f.token === token)?.played_at ?? null) : null;
    this._fileService.getFile().subscribe({
      next: (file: File) => this._handleFileRetrieval(file, token),
      error: () => this._handleError()
    });
  }

  private _storedDifficulty(): Difficulty | null {
    const value = readJson<string>('difficulty_filter');
    return value === 'easy' || value === 'medium' || value === 'hard' ? value : null;
  }

  /** Choose the level for random songs and play one right away. */
  public setDifficultyFilter(level: Difficulty | null): void {
    if (this.isAudioPlaying) return;
    this.difficultyFilter = level;
    writeJson('difficulty_filter', level);
    this.getRandomFile();
  }

  /** Plays a random track that is not tied to any day. */
  public getRandomFile(input?: HTMLInputElement): void {
    if (this.isAudioPlaying) return;
    this.isLoading = true;
    this.audioUrl.set(null);
    if (input) input.disabled = false;
    this.movieInput.enable();
    this.movieInput.setValue('');
    const current = this.file?.token;
    this._reset();
    this.isRandom = true;
    this.archiveDate = null;
    this.notice = null;
    if (current && !this._heard.includes(current)) this._heard.push(current);
    this._heard = this._heard.slice(-100);
    this._fileService.getRandomFile(this._heard.join(','), this.difficultyFilter).subscribe({
      next: (file: File) => {
        // the server repeats a song only once all were heard: start a new round
        if (this._heard.includes(file.token!)) {
          this._heard = [current!].filter(Boolean);
          this.notice = `You've heard all ${this.difficultyFilter ?? ''} songs - starting a new round.`.replace('  ', ' ');
        }
        this._heard.push(file.token!);
        this.file = {...file, name: '', poster_url: null, imdb_url: null};
        this._stream(this.file.token!);
      },
      error: () => {
        this._handleError();
        this.notice = this.difficultyFilter
          ? `No ${this.difficultyFilter} songs available right now.`
          : 'Could not load a song, please try again.';
      }
    });
  }

  public onSelectOpen(input: HTMLInputElement, event?: 'open'): void {
    if (event) {
      input.classList.add('merge-with-select');
      return;
    }
    input.classList.remove('merge-with-select');
  }

  private _handleFileRetrieval(file: File, token?: string): void {
    const archived = token ? this.files?.find(f => f.token === token) : undefined;
    this.file = archived ? {...archived, name: '', poster_url: null, imdb_url: null} : file;
    this._stream(this.file.token!);
  }

  private _stream(token: string): void {
    this._fileService.streamFile(token).subscribe({
      next: (res: { path: string }) => this._handleStreamSuccess(res),
      error: () => this._handleError()
    });
  }

  public setIsAudioIsPlaying(event: boolean): void {
    this.isAudioPlaying = event;
  }

  public disableInput(event: boolean): void {
    if (event) {
      this.movieInput.disable();
      return;
    }
    this.movieInput.enable();
  }

  private _handleStreamSuccess(res: { path: string }): void {
    this.audioUrl.set(res.path);
    this.isLoading = false;
  }

  private _handleError(): void {
    this.isLoading = false;
    this.audioUrl.set(null);
  }

  private _listenToTheme(): void {
    this.themeService.isDarkMode$.subscribe((isDarkMode) => {
      this.isDarkMode = isDarkMode;
    });
  }

  /**
   * The movie list changes whenever tracks are added, so always fetch it fresh;
   * the copy in localStorage is only a fallback when the request fails.
   */
  private _startupVersionCheck(): void {
    this._getMovies();
  }

  private _getMovies(): void {
    this._fileService.index().subscribe({
      next: res => {
        this._movies = this._withLabels(res);
        this._storeMovies(this._movies);
        this.getFile();
      },
      error: () => {
        const cached = this._localStorageService.getItem('movies');
        this._movies = Array.isArray(cached) ? cached as File[] : [];
        this.getFile();
      }
    });
  }

  private _storeMovies(movies: File[]): void {
    this._localStorageService.setItem('movies', movies);
  }

  public toggleMode(): void {
    this.themeService.toggleMode();
  }

  public focusInput(): void {
    this._listenToInput();
  }

  private _listenToInput(): void {
    this.filteredOptions = this.movieInput.valueChanges.pipe(
      startWith(''),
      map((value: any) => typeof value === 'string' ? value : value.name),
      map(name => name ? this._filter(name) : this._movies.slice())
    );
  }

  private _filter(name: string): File[] {
    const filterValue = name.toLowerCase();
    return this._movies.filter(movie => movie.name.toLowerCase().includes(filterValue));
  }

  /** Show "Name (year)" only when several movies share a name. */
  private _withLabels(movies: File[]): File[] {
    const counts = new Map<string, number>();
    movies.forEach(m => counts.set(m.name.toLowerCase(), (counts.get(m.name.toLowerCase()) ?? 0) + 1));
    return movies.map(m => ({...m, label: counts.get(m.name.toLowerCase())! > 1 ? `${m.name} (${m.year})` : m.name}));
  }

  /** Autocomplete shows the movie name, while the control's value stays the movie id. */
  public displayMovie = (value: number | string | null): string => {
    if (typeof value !== 'number') return value ?? '';
    const movie = this._movies.find(m => m.id === value);
    return movie ? (movie.label ?? movie.name) : '';
  };

  public onMovieSelected(selectedMovieId: number, input: HTMLInputElement) {
    if (this.isAudioPlaying) return;
    if (this._movies.some(movie => movie.id === selectedMovieId)) this.submit(input);
  }

  public submit(input: HTMLInputElement): void {
    const value = this.movieInput.value;
    if (value === null || value === '') {
      this._alterElements(false, input);
      return;
    }
    if (this.isLost) return;
    this.movieInput.setValue('');
    this._guess(this._resolveMovieId(value), input);
  }

  /** Selected option -> its id; typed text -> id of the movie with exactly that name, else null. */
  private _resolveMovieId(value: number | string): number | null {
    if (typeof value === 'number') return value;
    const typed = value.trim().toLowerCase();
    const movie = this._movies.find(m => m.name.toLowerCase() === typed || m.label?.toLowerCase() === typed);
    return movie?.id ?? null;
  }

  /** Sends a guess (or a skip when movieId is null) and advances the game on a miss. */
  private _guess(movieId: number | null, input: HTMLInputElement): void {
    if (this.isLost || this.isWin()) return;
    input.disabled = true;
    this._fileService.guess(this.file.token!, movieId, this.step).subscribe({
      next: res => {
        if (res.name) this.file = {
          ...this.file, name: res.name, year: res.year ?? this.file.year,
          poster_url: res.poster_url, imdb_url: res.imdb_url
        };
        if (res.correct) {
          this._handleSuccess(input);
          return;
        }
        if (movieId !== null) this._alterElements(false, input);
        this.step++;
        if (this.step >= 4) {
          this.isLost = true;
          return;
        }
        input.disabled = false;
        this._failSteps();
        // a wrong answer invites another try; a skip does not
        if (movieId !== null) setTimeout(() => input.focus());
      },
      error: () => input.disabled = false
    });
  }


  private _alterElements(success: boolean, input: HTMLInputElement): void {
    input.nextElementSibling?.classList.remove('d-none');
    input.nextElementSibling?.classList.add(success ? 'bi-check-lg' : 'bi-exclamation-lg');
    input.classList.add(success ? 'success' : 'error');
    setTimeout(() => {
      input.nextElementSibling?.classList.add('d-none');
      input.nextElementSibling?.classList.remove(success ? 'bi-check-lg' : 'bi-exclamation-lg');
      input.classList.remove(success ? 'success' : 'error');
    }, success ? 5000 : 500)
  }

  private _failSteps(): void {
    switch (this.step) {
      case 1:
        this.hints.push(`The main actor of this movie is - ${this.file?.main_actor}`);
        break;
      case 2:
        this.hints.push(`The movie was released at - ${this.file?.year}`);
        break;
      case 3:
        this.hints.push(`The genre of this movie: ${this.file?.genre}`);
        break;
    }
  }

  private _handleSuccess(input: HTMLInputElement): void {
    this._alterElements(true, input);
    this.isWin.set(true);
  }

  private _reset(): void {
    this.isWin.set(false);
    this.isLost = false;
    this.step = 0;
    this.hints = [];
  }

  public startHold(input: HTMLInputElement): void {
    if (this.isAudioPlaying) return;
    this.isHolding = true;
    this._holdTimeout = setTimeout(() => {
      this._performAction(input);
      this.isHolding = false;
    }, this._holdDuration);
  }

  public endHold(): void {
    setTimeout(() => {
      clearTimeout(this._holdTimeout);
      this.isHolding = false;
    }, 100)
  }

  public cancelHold(): void {
    clearTimeout(this._holdTimeout);
    this.isHolding = false;
  }

  private _performAction(input: HTMLInputElement): void {
    this._guess(null, input);
  }
}
