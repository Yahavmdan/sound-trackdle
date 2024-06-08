import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import { BaseService } from "./base.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthenticationResponse } from "../types/response/response.type";
import { LoginUser } from "../types/auth/auth.type";

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {

  tokenSub = new Subscription();
  isAdmin: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.isLoggedIn());

  constructor(public override http: HttpClient) {
    super(http);
  }

  public getHeaders(): HttpHeaders {
    const user = JSON.parse(localStorage.getItem('user') ?? '')
    return new HttpHeaders({
      Authorization: user.token ? `Bearer ${user.token}` : ''
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
  }

  private isLoggedIn(): boolean {
    const storedVal = localStorage.getItem('user');
    return storedVal
      ? JSON.parse(storedVal).token
      : false;
  }

}
