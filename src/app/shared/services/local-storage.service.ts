import { Injectable } from '@angular/core';
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService extends BaseService {


  constructor(public override http: HttpClient) {
    super(http);
  }

  public jsonParse(val: string): {[key: string]: any} {
    return JSON.parse(val);
  }

  public jsonStringify(val:  {[key: string]: any}): string {
    return JSON.stringify(val);
  }

  public setItem(key: string, val:  {[key: string]: any}): void {
    localStorage.setItem(key, this.jsonStringify(val));
  }

  public getItem(key: string): {[key: string]: any} {
    return this.jsonParse(localStorage.getItem(key) ?? '');
  }

  public isItemExist(key: string): boolean{
    return !!localStorage.getItem(key);
  }

  public removeItem(key: string): void {
    localStorage.removeItem(key);
  }

}
