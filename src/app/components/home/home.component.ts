import { Component, OnInit } from '@angular/core';
import { FileService } from "../../shared/services/file.service";
import { AsyncPipe, NgClass, NgForOf, NgIf, TitleCasePipe } from "@angular/common";
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteTrigger, MatOption } from "@angular/material/autocomplete";
import { MatInput, MatInputModule } from "@angular/material/input";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { map, Observable, startWith } from "rxjs";
import { fade, glideY } from "../../shared/utilities/animations";
import { File } from "../../shared/types/file.type";
import { ThemeService } from "../../shared/services/theme.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [
    NgIf, NgForOf, MatFormField, MatAutocomplete, MatAutocompleteTrigger, MatInput, MatOption, AsyncPipe,
    ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, NgClass, TitleCasePipe
  ],
  standalone: true,
  animations: [
    fade('fade', 500),
    glideY('glide', -50, 200)
  ]
})

export class HomeComponent implements OnInit {
  audioBlob: Blob | null = null;
  audioBlobUrl: string | null = null;
  errorMessage: string = '';
  movies: File[] = [];
  myControl = new FormControl('');
  filteredOptions!: Observable<{ name: string, id: number }[]>;
  isGuide: boolean = false;
  hints: string[] = [];
  isLost: boolean = false;
  isSuccess: boolean = false;
  isError: boolean = false;
  isDarkMode!: boolean;
  step: number = 0;
  file!: File;

  constructor(private _movieService: FileService,
              public themeService: ThemeService) {
  }

  ngOnInit(): void {
    this._getMovies();
    this._listenToInput();
    this._listenToTheme();
  }

  public getFile(): void {
    this.audioBlobUrl = null;
    this._movieService.getFile().subscribe({
      next: (file: File) => {
        this.file = file;
        this._movieService.streamFile(this.file.id).subscribe({
          next: (res: Blob) => {
            this.audioBlob = res;
            this.audioBlobUrl = URL.createObjectURL(this.audioBlob);
            this.errorMessage = '';
          },
          error: () => {
            this.errorMessage = 'File not found';
            this.audioBlob = null;
            this.audioBlobUrl = null;
          }
        });
      },
      error: () => {
        this.errorMessage = 'File not found';
        this.audioBlob = null;
        this.audioBlobUrl = null;
      }
    });
  }

  private _listenToTheme(): void {
    this.themeService.isDarkMode$.subscribe((isDarkMode) => {
      this.isDarkMode = isDarkMode;
    });
  }

  private _getMovies(): void {
    this._movieService.index().subscribe(res => {
      this.movies = res;
      this.getFile();
    });
  }

  public toggleMode(): void {
    this.themeService.toggleMode();
  }

  private _listenToInput(): void {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(' '),
      map((value: any) => typeof value === 'string' ? value : value.name),
      map(name => name ? this._filter(name) : this.movies.slice())
    );
  }

  private _filter(name: string): File[] {
    const filterValue = name.toLowerCase();
    return this.movies.filter(movie => movie.name.toLowerCase().includes(filterValue));
  }

  public onMovieSelected(selectedMovieId: number, input: HTMLInputElement) {
    const selectedMovie = this.movies.find(movie => movie.id === selectedMovieId);
    if (selectedMovie) this._submit(input);
  }

  private _submit(input: HTMLInputElement): void {
    if (this.isLost) return;
    if (this._checkAnswer(input)) return;
    this.step++;
    this._failSteps();
  }


  private _alterElements(success: boolean, input: HTMLInputElement): void {
    // @ts-ignore
    input.nextElementSibling.classList.remove('d-none');
    // @ts-ignore
    input.nextElementSibling.classList.add(success ? 'bi-check-lg' : 'bi-exclamation-lg');
    input.classList.add(success ? 'success' : 'error');
    setTimeout(() => {
      // @ts-ignore
      input.nextElementSibling.classList.add('d-none');
      // @ts-ignore
      input.nextElementSibling.classList.remove(success ? 'bi-check-lg' : 'bi-exclamation-lg');
      input.classList.remove(success ? 'success' : 'error');
      this.isSuccess = false;
    }, success ? 10000 : 500)
  }

  private _failSteps(): void {
    switch (this.step) {
      case 1: this.hints.push(`The main actor of this movie is - ${this.file?.main_actor}`);
        break;
      case 2: this.hints.push(`The movie was released at - ${this.file?.year}`);
        break;
      case 3: this.hints.push(`Here's a short plot for this movie: ${this.file?.plot}`);
        break;
      case 4: this._revelFile();
        break;
    }
  }

  private _checkAnswer(input: HTMLInputElement): boolean {
    if (input.value === this.file?.id?.toString()) {
      input.value = '';
      this._handleSuccess(input);
      return true;
    }
    input.value = '';
    return false;
  }

  private _handleSuccess(input: HTMLInputElement): void {
    this._reset();
    this._alterElements(true, input);
    this.isSuccess = true;
  }

  private _revelFile(): void {
    this._reset();
    this._movieService.getFileById(this.file.id)
      .subscribe((res: File) => this.file.name = res.name);
    this.isLost = true;
  }

  private _reset(input?: HTMLInputElement): void {
    if (input) {
      input.value = '';
    }
    this.isLost = false;
    this.step = 0;
    this.hints = [];
    this.isSuccess = false;
    this.isError = false;
  }
}
