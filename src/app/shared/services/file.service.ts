import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { File } from "../types/file.type";
import { BaseService } from "./base.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class FileService extends BaseService {

  constructor(public override http: HttpClient) {
    super(http);
  }

  public index(): Observable<File[]> {
    return this.http.get<File[]>(this.baseUrl + 'movie');
  }

  public upload(formData: FormData): Observable<any> {
    return this.http.post(this.baseUrl + 'upload', formData, {headers: this.getHeaders()});
  }

  public getFile(): Observable<File> {
    return this.http.get<File>(this.baseUrl + 'file');
  }

  public getFileById(id: number): Observable<File> {
    return this.http.post<File>(this.baseUrl + 'file/id', {id});
  }

  public streamFile(id: number): Observable<{ path: string }> {
    return this.http.post<{ path: string }>(this.baseUrl + 'stream', {id});
  }

}
