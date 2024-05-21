import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { AuthenticationResponse } from "../types/response/response.type";
import { LoginUser } from "../types/auth/auth.type";

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {

  constructor(public override http: HttpClient) {
    super(http);
  }

  public login(data: LoginUser): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(this.baseUrl + 'user/login', data);
  }

}
