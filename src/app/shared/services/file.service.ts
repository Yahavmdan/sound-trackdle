import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { File } from "../types/file.type";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "./auth.service";

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

  public getFile(): Observable<File> {
    return this.http.get<File>(this.baseUrl + 'file');
  }

  public getRecentFiles(): Observable<File[]> {
    return this.http.get<File[]>(this.baseUrl + 'files');
  }

  public getFileById(id: number): Observable<File> {
    return this.http.post<File>(this.baseUrl + 'file/id', {id});
  }

  public streamFile(id: number): Observable<{ path: string }> {
    return this.http.post<{ path: string }>(this.baseUrl + 'stream', {id});
  }

}
