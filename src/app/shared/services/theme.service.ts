import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { readJson, writeJson } from '../utilities/storage-recovery';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private _isDarkMode = new BehaviorSubject<boolean>(this.getDefaultValue());
  public isDarkMode$ = this._isDarkMode.asObservable();

  private getDefaultValue(): boolean {
    const stored = readJson<{ darkMode?: unknown }>('theme');
    return typeof stored?.darkMode === 'boolean'
      ? stored.darkMode
      : this.initializeLocalStorage();
  }

  private initializeLocalStorage(): boolean {
    writeJson('theme', {darkMode: false});
    return false;
  }

  public toggleMode(): void {
    const val = !this._isDarkMode.value;
    writeJson('theme', {darkMode: val});
    this._isDarkMode.next(val);
  }
}
