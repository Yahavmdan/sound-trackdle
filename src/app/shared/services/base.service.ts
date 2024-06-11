import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { map, Observable } from "rxjs";
import { OkResponse } from "../types/response/response.type";
import { version } from "../../../environments/version";

@Injectable({
    providedIn: 'root'
})
export class BaseService {

    public baseUrl: string = environment.apiUrl;

    constructor(public http: HttpClient) {
    }

    public getVersion(): Observable<boolean> {
      return this.http.get<OkResponse>(this.baseUrl + 'version').pipe(map(res => {
        return res.message === version;
      }));
    }


}
