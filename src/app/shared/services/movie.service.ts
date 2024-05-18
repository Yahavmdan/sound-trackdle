import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { File } from "../types/file.type";

@Injectable({
    providedIn: 'root'
})
export class MovieService {

    private readonly baseUrl: string = 'http://localhost:80/api/';

    constructor(private http: HttpClient) {
    }

    public index(): Observable<{ movies: File[] }> {
        return this.http.get<{ movies: File[] }>(this.baseUrl + 'movie');
    }

    public upload(formData: FormData): Observable<any> {
        return this.http.post(this.baseUrl + 'upload', formData);
    }

    public getFile(): Observable<File> {
        return this.http.get<File>(this.baseUrl + 'file');
    }

    public streamFile(path?: string): Observable<Blob> {
        return this.http.post(this.baseUrl + 'stream', { path }, { responseType: 'blob' });
    }

}
