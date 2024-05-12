import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class BaseService {

  private readonly baseUrl: string = 'http://localhost:80/api/';

  constructor(private http: HttpClient) { }

    public upload(formData: FormData): Observable<any> {
        return this.http.post(this.baseUrl + 'upload', formData);
    }

    public getTrack(fileName: string): Observable<any> {
        return this.http.get(this.baseUrl + `stream?fileName=${fileName}`, { responseType: 'blob' });
    }

}
