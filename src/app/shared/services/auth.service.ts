import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from "rxjs";
import { BaseService } from "./base.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthenticationResponse } from "../types/response/response.type";
import { LoginUser } from "../types/auth/auth.type";

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {

  tokenSub = new Subscription();
  isAdmin = new Subject<boolean>();
  private userData: any;

  constructor(public override http: HttpClient) {
    super(http);
  }

  public getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: this.getUserSData()?.token ? `Bearer ${this.getUserSData().token}` : ''
    });
  }

  public login(data: LoginUser): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(this.baseUrl + 'user/login', data);
  }

  public storeUserData(authUser: AuthenticationResponse): void {
    localStorage.setItem('user', JSON.stringify(authUser));
    this.isAdmin.next(true);
  }

  public logout(): void {
    this.tokenSub.unsubscribe();
    this.isAdmin.next(false);
    localStorage.removeItem('user');
    this.userData = null;
  }

  public setUserData(): void {
    this.userData = JSON.parse(localStorage.getItem('user') || '{}');
  }

  public getUserSData(): any {
    return this.userData;
  }

  public autoLogin(): void {
    this.setUserData();
    if (!this.userData.hasOwnProperty('token')) {
      this.isAdmin.next(false);
      return;
    }

    this.isAdmin.next(true);

  }

}
