import { Component, OnInit } from '@angular/core';
import { MovieService } from "../../shared/services/movie.service";
import { AsyncPipe, NgClass, NgForOf, NgIf } from "@angular/common";
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

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    imports: [
        NgIf, NgForOf, MatFormField, MatAutocomplete, MatAutocompleteTrigger, MatInput, MatOption, AsyncPipe,
        ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, NgClass
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
    filteredOptions: Observable<{ name: string }[]> | undefined;
    isGuide: boolean = false;
    hints: string[] = [];
    isLost: boolean = false;
    isSuccess: boolean = false;
    isError: boolean = false;
    isDarkMode: boolean | undefined;
    step: number = 1;
    file: File | undefined;


    constructor(private movieService: MovieService,
                public themeService: ThemeService) {
    }

    ngOnInit(): void {
        this.getMovies();
        this.listenToInput();
        this.listenToTheme();
    }

    public getFile(): void {
        this.audioBlobUrl = null;
        this.movieService.getFile().subscribe({
            next: (data: File) => {
                this.movieService.streamFile(data.file_path).subscribe({
                    next: (res: Blob) => {
                        console.log(res)
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

    private listenToTheme(): void {
        this.themeService.isDarkMode$.subscribe((isDarkMode) => {
            this.isDarkMode = isDarkMode;
        });
    }

    private getMovies(): void {
        this.movieService.index().subscribe(res => {
            this.movies = res.movies;
            this.getFile();
        });
    }

    public toggleMode(): void {
        this.themeService.toggleMode();
    }

    private listenToInput(): void {
        this.filteredOptions = this.myControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filter(value || '')),
        );
    }

    private _filter(value: string): { name: string }[] {
        const filterValue = value.toLowerCase();
        return this.movies.filter(movie => movie.name.toLowerCase().includes(filterValue));
    }

    public submit(input: HTMLInputElement): void {
        if (!input || !input.value) return;
        if (this.isLost) return;
        // if (!this.level) {
        //   this.alterElements(false, input);
        //   return;
        // }
        this.step++;
        this.failSteps(input);
    }

    private alterElements(success: boolean, input: HTMLInputElement): void {
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

    private failSteps(input?: HTMLInputElement): void {
        if (input) {
            if (this.checkAnswer(input)) return;

            this.alterElements(false, input);
        }
        switch (this.step) {
            case 1:
                this.hints.push(`The word contains letters.`);
                break;
            case 2:
                this.hints.push(`The first letter is`);
                break;
            case 3:
                this.hints.push(`The word has} syllables`);
                break;
            case 4:
                this.hints.push(`The word is a type of: `);
                break;
            case 5:
                this.hints.push(`The word can be used in a sentence like this: `);
                break;
            case 6:
                this.revelFile();
                break;
        }
    }

    private checkAnswer(input: HTMLInputElement): boolean {
        if (input.value.toLowerCase() === 'right answer') {
            input.value = '';
            this.handleSuccess(input);
            return true;
        }
        input.value = '';
        return false;
    }

    private reset(moveLevel: boolean, input?: HTMLInputElement): void {
        if (input && moveLevel) {
            input.value = '';
        }
        this.isLost = false;
        this.step = 0;
        this.hints = [];
        this.isSuccess = false;
        this.isError = false;
    }

    private handleSuccess(input: HTMLInputElement): void {
        this.reset(false);
        this.alterElements(true, input);
        this.isSuccess = true;
    }

    private revelFile(): void {
        this.reset(false);
        this.isLost = true;
    }
}

