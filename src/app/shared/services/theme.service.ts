import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private _isDarkMode = new BehaviorSubject<boolean>(this.getDefaultValue());
  public isDarkMode$ = this._isDarkMode.asObservable();

  private getDefaultValue(): boolean {
    const storedVal = localStorage.getItem('theme');
    return storedVal
      ? JSON.parse(storedVal).darkMode
      : this.initializeLocalStorage();
  }

  private initializeLocalStorage(): boolean {
    localStorage.setItem('theme', JSON.stringify({ darkMode: false }));
    return false;
  }

  public toggleMode(): void {
    const val = !this._isDarkMode.value;
    localStorage.setItem('theme', JSON.stringify({ darkMode: val }));
    this._isDarkMode.next(val);
  }
}
