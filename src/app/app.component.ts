import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass } from "@angular/common";
import { ThemeService } from "./shared/services/theme.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  public isDarkMode: boolean | undefined;

  constructor(private _themeService: ThemeService) {
  }

  ngOnInit(): void {
    this._themeService.isDarkMode$.subscribe((isDarkMode) => {
      this.isDarkMode = isDarkMode;
    });
  }

}
