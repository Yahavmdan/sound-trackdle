import { Component, input, InputSignal } from '@angular/core';
import { NgClass, NgIf, NgSwitch, NgSwitchCase } from "@angular/common";

@Component({
  selector: 'app-track-info',
  standalone: true,
  imports: [
    NgSwitch,
    NgSwitchCase,
    NgClass,
    NgIf
  ],
  templateUrl: './track-info.component.html',
  styleUrl: '../home/home.component.scss',
})
export class TrackInfoComponent {
  public step: InputSignal<number> = input(0);
  public isDarkMode: InputSignal<boolean> = input(false);
  public isLost: InputSignal<boolean> = input(false);

}
