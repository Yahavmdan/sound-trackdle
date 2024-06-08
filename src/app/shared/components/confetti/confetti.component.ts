import { Component, input, InputSignal } from '@angular/core';
import { NgClass, NgIf } from "@angular/common";

@Component({
  selector: 'app-confetti',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './confetti.component.html',
  styleUrl: './confetti.component.scss'
})
export class ConfettiComponent {
  public isWin: InputSignal<boolean> = input(false);
}
