import { Component, OnInit } from '@angular/core';
import { FileService } from "../../shared/services/file.service";
import { AsyncPipe, NgClass, NgForOf, NgIf, TitleCasePipe } from "@angular/common";
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import {
  MatAutocomplete,
  MatAutocompleteModule,
  MatAutocompleteTrigger,
  MatOption
} from "@angular/material/autocomplete";
import { MatInput, MatInputModule } from "@angular/material/input";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { map, Observable, startWith } from "rxjs";
import { fade, glideY } from "../../shared/utilities/animations";
import { File } from "../../shared/types/file.type";
import { ThemeService } from "../../shared/services/theme.service";
import { AuthService } from "../../shared/services/auth.service";

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
  audioBlobUrl!: string | null;
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
  isForm: boolean = false;
  isLoading: boolean = false;
  step: number = 0;
  file!: File;
  files!: File[];
  selectedFile = null;
  token!: string | null;


  constructor(private _movieService: FileService,
              public themeService: ThemeService,
              private _authService: AuthService) {
  }

  ngOnInit(): void {
    this._getMovies();
    this._listenToInput();
    this._listenToTheme();
  }

  public getRecentFiles(): void {
    if (this.files?.length) return;
    this._movieService.getRecentFiles().subscribe(res => {
      this.files = res;
    })
  }

  public getFile(id?: number): void {
    if (id) {
      this.audioBlob = null;
      this.audioBlobUrl = null;
    }
    this._reset();
    this._movieService.getFile().subscribe({
      next: (file: File) => this._handleFileRetrieval(file, id),
      error: () => this._handleError('File not found')
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
    this.isLoading = true;
    this._movieService.streamFile(id).subscribe({
      next: (res: { path: string }) => this._handleStreamSuccess(res),
      error: () => this._handleError('File not found')
    });
  }

  private _handleStreamSuccess(res: { path: string }): void {
    this.isLoading = false;
    this.audioBlobUrl = res.path;
    this.errorMessage = '';
  }

  private _handleError(message: string): void {
    this.isLoading = false;
    this.errorMessage = message;
    this.audioBlob = null;
    this.audioBlobUrl = null;
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

  public focusInput(): void {
    this._listenToInput();
  }

  private _listenToInput(): void {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
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
    input.blur();
    setTimeout(() => {
      // @ts-ignore
      input.nextElementSibling.classList.add('d-none');
      // @ts-ignore
      input.nextElementSibling.classList.remove(success ? 'bi-check-lg' : 'bi-exclamation-lg');
      // @ts-ignore
      input.classList.remove(success ? 'success' : 'error');
      this.isSuccess = false;
      input.blur();
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
        this.hints.push(`Here's a short plot for this movie: ${this.file?.plot}`);
        break;
      case 4:
        this._getFileById(true);
        break;
    }
  }

  private _checkAnswer(input: HTMLInputElement): boolean {
    if (input.value === this.file?.id?.toString()) {
      input.value = '';
      this._handleSuccess(input);
      return true;
    }
    this._alterElements(false, input);
    input.value = '';
    return false;
  }

  private _handleSuccess(input: HTMLInputElement): void {
    this._reset(input);
    this._alterElements(true, input);
    this.isSuccess = true;
  }

  private _getFileById(lost?: boolean, id?: number): void {
    this._reset();
    this._movieService.getFileById(id ?? this.file.id)
      .subscribe((res: File) => this.file = res);
    lost ? this.isLost = true : null;
  }

  private _reset(input?: HTMLInputElement): void {
    if (input) {
      input.disabled = true;
      setTimeout(() => {
        input.disabled = false;
      }, 5000)
    }
    this.isLost = false;
    this.step = 0;
    this.hints = [];
    this.isSuccess = false;
    this.isError = false;
  }

  public onSubmit() {
    if (!this.selectedFile) {
      console.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

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
    this.selectedFile = event.target.files[0];
  }

  public login(username: string, password: string): void {
    if (!username || !password) return;
    this._authService.login({username, password}).subscribe(res => {
      this.token = res.token;
      localStorage.setItem('token', this.token);
    })
  }
}
