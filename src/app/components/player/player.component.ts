import { Component, input, InputSignal, output, } from '@angular/core';
import { NgClass, NgIf, NgSwitch, NgSwitchCase } from "@angular/common";

@Component({
  selector: 'app-player',
  imports: [NgIf, NgSwitch, NgClass, NgSwitchCase],
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
  standalone: true
})

export class PlayerComponent {

  public audioUrl: InputSignal<string | null> = input<string | null>(null);
  public step: InputSignal<number> = input(0);
  public isDarkMode: InputSignal<boolean> = input(false);
  public isLost: InputSignal<boolean> = input(false);
  public isAudioPlaying: InputSignal<boolean> = input(false);
  public setIsAudioIsPlaying = output<boolean>()
  public disableInput = output<boolean>()

  public playerActions(progress: HTMLDivElement): void {
    const audio = new Audio(this.audioUrl() ?? undefined);
    if (audio.paused) {
      this._play(audio, progress);
      setTimeout(() => {
        this._pause(audio);
      }, this._determineTimeOfTrackByStep());
    }
  }

  private _play(audio: HTMLAudioElement, progress: HTMLDivElement): void {
    console.log('played')
    audio.currentTime = 0;
    audio.load();
    void audio.play();
    this.setIsAudioIsPlaying.emit(true);
    this.disableInput.emit(true)
    this._startAnimation(progress);
  }

  private _pause(audio: HTMLAudioElement): void {
    console.log('paused')
    audio.pause();
    this.setIsAudioIsPlaying.emit(false);
    console.log(this.isAudioPlaying());
    this.disableInput.emit(false);
  }

  private _determineTimeOfTrackByStep(): number {
    switch (this.step()) {
      case 0: return 5000;
      case 1: return 9000;
      case 2: return 12000;
      case 3: return 15000;
      default: return 0;
    }
  }

  private _startAnimation(progress: HTMLDivElement): void {
    progress.classList.add(`ani${this._determineTimeOfTrackByStep()}`)
    setTimeout(() => {
      progress.classList.remove(`ani${this._determineTimeOfTrackByStep()}`)
    }, this._determineTimeOfTrackByStep())
  }

}
