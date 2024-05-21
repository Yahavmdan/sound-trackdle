import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class BaseService {

    public baseUrl: string = environment.apiUrl;
    public token: string | null = localStorage.getItem('token') ?? null;

    constructor(public http: HttpClient) {
    }

  public getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: this?.token ? `Bearer ${this.token}` : ''
    });
  }

}
