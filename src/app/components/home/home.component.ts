import { Component, OnInit } from '@angular/core';
import { FileService } from "../../shared/services/file.service";
import { AsyncPipe, NgClass, NgForOf, NgIf, TitleCasePipe } from "@angular/common";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { map, Observable, startWith, Subscription } from "rxjs";
import { fade, glideY } from "../../shared/utilities/animations";
import { File } from "../../shared/types/file.type";
import { ThemeService } from "../../shared/services/theme.service";
import { AuthService } from "../../shared/services/auth.service";
import { environment } from "../../../environments/environment";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from "../../../environments/environment.prod";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [NgIf, NgForOf,NgClass, AsyncPipe, MatAutocompleteModule, TitleCasePipe, ReactiveFormsModule],
  standalone: true,
  animations: [
    fade('fade', 500),
    glideY('glide', -50, 200)
  ]
})

export class HomeComponent implements OnInit {
  public audioBlobUrl!: string | null;
  public myControl = new FormControl('');
  public filteredOptions!: Observable<{ name: string, id: number }[]>;
  public hints: string[] = [];
  public file!: File;
  public files!: File[];
  public isAdminSub!: Subscription;
  public isAdmin!: boolean;
  public isGuide: boolean = false;
  public isLost: boolean = false;
  public isWin: boolean = false;
  public isDarkMode!: boolean;
  public isForm: boolean = false;
  public isLoading: boolean = false;
  public isRecentLoading: boolean = false;
  public isMobile: boolean = false;
  private _holdTimeout!: ReturnType<typeof setTimeout>;
  private _holdDuration = 1000;
  public isHolding = false;
  public step: number = 0;
  private _selectedFile = null;
  private _movies: File[] = [];


  constructor(private _movieService: FileService,
              public themeService: ThemeService,
              private _authService: AuthService) {
  }

  ngOnInit(): void {
    this._getMovies();
    this._listenToInput();
    this._listenToTheme();
    this._initializeAnalytics();
    this._isAdmin();
    this._authService.autoLogin();
    this.isMobile = window.innerWidth < 768;
    this.isLoading = true;
  }

  private _initializeAnalytics(): void {
    environment.production
      ? getAnalytics(initializeApp(firebaseConfig))
      : null;
  }

    private _isAdmin(): void {
        this.isAdminSub = this._authService.isAdmin.subscribe((isAdminAuthenticated: boolean): void => {
            this.isAdmin = isAdminAuthenticated;
        });
    }

  public getRecentFiles(): void {
    this.isRecentLoading = true;
    if (this.files?.length) return;
    this.files = [];
    this._movieService.getRecentFiles().subscribe(res => {
      this.isRecentLoading = false;
      this.files = res;
      this._assignIfClicked();
    })
  }

  private _assignIfClicked(): void {
    this.files.forEach(file => {
      file.clicked = this._isClicked(file.id.toString());
    });
  }

  private _isClicked(id: string): boolean {
    return localStorage.getItem(id) === 'clicked';
  }

  private _markAsClicked(id: number): void {
    localStorage.setItem(id.toString(), 'clicked');
  }

  public getFile(id?: number, input?: HTMLInputElement): void {
    if (id) {
      this.audioBlobUrl = null
      this._markAsClicked(id);
      this._assignIfClicked();
    }
    if (input) {
      input.disabled = false;
    }

    this._reset();
    this._movieService.getFile().subscribe({
      next: (file: File) => this._handleFileRetrieval(file, id),
      error: () => this._handleError()
    });
  }

  private _handleFileRetrieval(file: File, id?: number): void {
    if (id) {
      this._getFileById(false, id);
      this._stream(id);
      return;
    }
    this.file = file;
    this._stream(this.file.id);
  }

  private _stream(id: number): void {
    this._movieService.streamFile(id).subscribe({
      next: (res: { path: string }) => this._handleStreamSuccess(res),
      error: () => this._handleError()
    });
  }

  private _handleStreamSuccess(res: { path: string }): void {
    this.isLoading = false;
    this.audioBlobUrl = res.path;
  }

  private _handleError(): void {
    this.isLoading = false;
    this.audioBlobUrl = null;
  }

  private _listenToTheme(): void {
    this.themeService.isDarkMode$.subscribe((isDarkMode) => {
      this.isDarkMode = isDarkMode;
    });
  }

  private _getMovies(): void {
    this._movieService.index().subscribe(res => {
      this._movies = res;
      this.getFile();
    });
  }

  public toggleMode(): void {
    this.themeService.toggleMode();
  }

  public focusInput(): void {
    this._listenToInput();
  }

  private _listenToInput(): void {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map((value: any) => typeof value === 'string' ? value : value.name),
      map(name => name ? this._filter(name) : this._movies.slice())
    );
  }

  private _filter(name: string): File[] {
    const filterValue = name.toLowerCase();
    return this._movies.filter(movie => movie.name.toLowerCase().includes(filterValue));
  }

  public onMovieSelected(selectedMovieId: number, input: HTMLInputElement) {
    const selectedMovie = this._movies.find(movie => movie.id === selectedMovieId);
    if (selectedMovie) this.submit(input);
  }

  public submit(input: HTMLInputElement): void {
    if (!input.value) {
      this._alterElements(false, input);
      return;
    }
    if (this.isLost) return;
    if (this._checkAnswer(input)) return;

    input.disabled = true;
    setTimeout(() => {
      input.disabled = false;
    }, 1)

    this.step++;
    if (this.step === 4) {
      this.isLost = true;
      setTimeout(() => {
        input.disabled = true;
      }, 500)
    }
    this._failSteps();
  }


  private _alterElements(success: boolean, input: HTMLInputElement): void {
    input.nextElementSibling?.classList.remove('d-none');
    input.nextElementSibling?.classList.add(success ? 'bi-check-lg' : 'bi-exclamation-lg');
    input.classList.add(success ? 'success' : 'error');
    input.blur();
    setTimeout(() => {
      input.nextElementSibling?.classList.add('d-none');
      input.nextElementSibling?.classList.remove(success ? 'bi-check-lg' : 'bi-exclamation-lg');
      input.classList.remove(success ? 'success' : 'error');
      input.blur();
    }, success ? 5000 : 500)
  }

  private _failSteps(input?: HTMLInputElement): void {
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
      case 4:
        this._getFileById(true, undefined, input);
        break;
    }
  }

  private _checkAnswer(input: HTMLInputElement): boolean {
    if (input.value === this.file?.id?.toString()) {
      input.value = '';
      input.disabled = true;
      this._handleSuccess(input);
      return true;
    }
    this._alterElements(false, input);
    input.value = '';
    return false;
  }

  private _handleSuccess(input: HTMLInputElement): void {
    this._alterElements(true, input);
    this.isWin = true;
  }

  private _getFileById(lost?: boolean, id?: number, input?: HTMLInputElement): void {
    this._reset();
    this._movieService.getFileById(id ?? this.file.id)
      .subscribe((res: File) => this.file = res);
    if (lost) this.isLost = true;
    if (input) input.disabled = true;
  }

  private _reset(): void {
    this.isWin = false;
    this.isLost = false;
    this.step = 0;
    this.hints = [];
  }

  public onSubmit() {
    if (!this._selectedFile) {
      console.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', this._selectedFile);

    this._movieService.upload(formData)
      .subscribe({
        next: (response) => {
          console.log(response);
          console.log('File uploaded successfully');
        },
        error: (error) => {
          console.error('Error uploading file:', error);
        }
      });
  }

  public onFileSelected(event: any) {
    this._selectedFile = event.target.files[0];
  }

  public login(username: string, password: string): void {
    if (!username || !password) return;
    this._authService.login({username, password}).subscribe(res => {
      this._authService.storeUserData(res);
    })
  }

    public logout(): void {
        this._authService.logout();
    }

  public startHold(input: HTMLInputElement): void {
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
    }, 300)
  }

  public cancelHold(): void {
    clearTimeout(this._holdTimeout);
    this.isHolding = false;
  }

  private _performAction(input: HTMLInputElement): void {
    if (this.isLost) input.disabled = true;
    this.step++;
    this._failSteps(input);
  }
}
