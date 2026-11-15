import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import { BaseService } from "./base.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthenticationResponse } from "../types/response/response.type";
import { LoginUser } from "../types/auth/auth.type";
import { readJson } from "../utilities/storage-recovery";

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
    const user = readJson<{ token?: string }>('user');
    return new HttpHeaders({
      Authorization: user?.token ? `Bearer ${user.token}` : ''
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
    return !!readJson<{ token?: string }>('user')?.token;
  }

}
