import { Component, input, InputSignal, OnInit, output, } from '@angular/core';
import { DecimalPipe, NgClass, NgIf, NgSwitch, NgSwitchCase } from "@angular/common";

@Component({
  selector: 'app-player',
  imports: [NgIf, NgSwitch, NgClass, NgSwitchCase, DecimalPipe],
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
  standalone: true
})

export class PlayerComponent implements OnInit {

  public audioUrl: InputSignal<string | null> = input<string | null>(null);
  public step: InputSignal<number> = input(0);
  public isAudioPlaying: InputSignal<boolean> = input(false);
  public audio: HTMLAudioElement = new Audio('');
  public setIsAudioIsPlaying = output<boolean>();
  public disableInput = output<boolean>();
  private _intervalId: number | undefined;

  ngOnInit(): void {
    this._reset();
  }

  private _reset(): void {
    this.audio = new Audio(this.audioUrl() ?? '');
    this.audio.load();
    this.audio.currentTime = 0;

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio.currentTime >= this._setTimeOfTrackByStep()) {
        this.audio.pause();
        this._emitValues(false, false);
        this.audio.currentTime = 0;
      }
    });
  }

  public play(progress: HTMLDivElement): void {
    void this.audio.play();
    this._emitValues(true, true);
    this._setProgressBarWidth(progress);
    this._startAnimation(progress, false);
  }

  public pause(progress: HTMLDivElement): void {
    this.audio.pause();
    this._emitValues(false, false);
    this._startAnimation(progress, true);
  }

  public mute(): void {
    if (this.audio.muted) {
      this.audio.volume = 0.50;
      this.audio.muted = false;
      return;
    }
    this.audio.volume = 0;
    this.audio.muted = true;

  }

  private _emitValues(isAudioIsPlaying: boolean, disableInput: boolean): void {
    this.setIsAudioIsPlaying.emit(isAudioIsPlaying);
    this.disableInput.emit(disableInput);
  }

  public changeVolume(event: any) {
    this.audio.volume = event.target.value;
  }

  private _setTimeOfTrackByStep(millisecond?: boolean): number {
    switch (this.step()) {
      case 0: return millisecond ? 5000 : 5;
      case 1: return millisecond ? 9000 : 9;
      case 2: return millisecond ? 12000 : 12;
      case 3: return millisecond ? 15000 : 15;
      default: return 0;
    }
  }

  private _startAnimation(progress: HTMLDivElement, paused: boolean): void {
    if (paused) {
      this._setProgressBarWidth(progress);
      this._clearInterval();
      return;
    }

    this._clearInterval();
    this._intervalId = setInterval(() => {
      if ((this.audio.currentTime > this._setTimeOfTrackByStep()) || this.audio.currentTime === 0) {
        progress.style.width = '0%';
        this._clearInterval();
      }

      if (paused) {
        this._clearInterval();
        return;
      }
      progress.style.width = this._getCurrentTimeAndTotalTrackTime();
    }, 100);
  }

  private _clearInterval(): void {
    if (this._intervalId !== undefined) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
  }

  private _setProgressBarWidth(progress: HTMLDivElement): void {
    progress.style.width = this._getCurrentTimeAndTotalTrackTime();
  }

  private _getCurrentTimeAndTotalTrackTime(): string {
    return this._calculateProgress(this.audio.currentTime, this._setTimeOfTrackByStep(false)).toString() + '%';
  }

  private _calculateProgress(currentTime: number, totalTime: number): number {
    if (totalTime === 0) return 0;
    return (currentTime / totalTime) * 100;
  }

}
