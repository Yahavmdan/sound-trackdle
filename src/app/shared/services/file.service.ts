import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { File } from "../types/file.type";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "./auth.service";

export type GuessResult = {
  correct: boolean;
  name?: string;
  year?: number;
  poster_url?: string | null;
  imdb_url?: string | null;
};

@Injectable({
  providedIn: 'root'
})
export class FileService extends BaseService {

  constructor(public override http: HttpClient, private _authService: AuthService) {
    super(http);
  }

  public index(): Observable<File[]> {
    return this.http.get<File[]>(this.baseUrl + 'movie');
  }

  public upload(file: FormData): Observable<any> {
    return this.http.post(this.baseUrl + 'upload', file, {headers: this._authService.getHeaders()});
  }

  public massDelete(): Observable<any> {
    return this.http.delete(this.baseUrl + 'delete/all', {headers: this._authService.getHeaders()});
  }

  public fileIndex(): Observable<any> {
    return this.http.get(this.baseUrl + 'file/index', {headers: this._authService.getHeaders()});
  }

  public getFile(): Observable<File> {
    return this.http.get<File>(this.baseUrl + 'file');
  }

  /** Any track, independent of the daily challenge; `exclude` avoids repeating the current one. */
  public getRandomFile(exclude?: string): Observable<File> {
    return this.http.get<File>(this.baseUrl + 'random', {params: exclude ? {exclude} : {}});
  }

  public getRecentFiles(): Observable<File[]> {
    return this.http.get<File[]>(this.baseUrl + 'files');
  }

  public streamFile(token: string): Observable<{ path: string }> {
    return this.http.post<{ path: string }>(this.baseUrl + 'stream', {token});
  }

  public guess(token: string, movieId: number | null, step: number): Observable<GuessResult> {
    return this.http.post<GuessResult>(this.baseUrl + 'guess', {token, movie_id: movieId, step});
  }

}
