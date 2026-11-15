import { Component, input, InputSignal, OnDestroy, OnInit, output, } from '@angular/core';
import { DecimalPipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase } from "@angular/common";

@Component({
  selector: 'app-player',
  imports: [NgIf, NgForOf, NgSwitch, NgClass, NgSwitchCase, DecimalPipe],
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
  standalone: true
})

export class PlayerComponent implements OnInit, OnDestroy {

  public audioUrl: InputSignal<string | null> = input<string | null>(null);
  public step: InputSignal<number> = input(0);
  public isAudioPlaying: InputSignal<boolean> = input(false);
  public audio: HTMLAudioElement = new Audio('');
  public setIsAudioIsPlaying = output<boolean>();
  public disableInput = output<boolean>();
  private _intervalId: number | undefined;
  /** The full clip is 15 s; each step unlocks more of it. */
  public readonly maxSeconds: number = 15;
  public readonly marks: number[] = [5, 9, 12];
  public elapsed: number = 0;

  public limitSeconds(): number {
    return this._setTimeOfTrackByStep();
  }

  public unlockedPercent(): number {
    return this._setTimeOfTrackByStep() / this.maxSeconds * 100;
  }

  ngOnInit(): void {
    this._reset();
  }

  private _reset(): void {
    this.audio = new Audio(this.audioUrl() ?? '');
    this.audio.preload = 'auto';
    this.audio.load();
    this._loadIntoMemory();
    this.audio.currentTime = 0;
    // a position chosen before the audio was ready is applied once it is
    this.audio.addEventListener('loadedmetadata', () => this._applyStartAt());

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio.currentTime >= this._setTimeOfTrackByStep()) {
        this.audio.pause();
        this._emitValues(false, false);
        this.audio.currentTime = 0;
        this.elapsed = 0;
      }
    });
  }

  public play(progress: HTMLDivElement): void {
    this._applyStartAt();
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

  /** Jump to any point of the part of the clip unlocked so far. */
  public seek(event: Event, progress: HTMLDivElement): void {
    const limit = this._setTimeOfTrackByStep();
    const value = Math.max(Math.min(Number((event.target as HTMLInputElement).value), limit - 0.1), 0);
    this.elapsed = value;
    this._startAt = value;
    this._applyStartAt();
    progress.style.width = this._calculateProgress(value, this.maxSeconds) + '%';
  }

  private _startAt: number | null = null;
  private _blobUrl: string | null = null;

  /**
   * Seeking needs the server to support partial downloads; a clip is small, so load
   * it fully and play it from memory - then dragging the timeline works everywhere.
   */
  private _loadIntoMemory(): void {
    const url = this.audioUrl();
    if (!url) return;
    fetch(url)
      .then(res => res.ok ? res.blob() : Promise.reject(res.status))
      .then(blob => {
        if (this.audio.src !== url || !this.audio.paused) return; // track changed or already playing
        this._blobUrl = URL.createObjectURL(blob);
        this.audio.src = this._blobUrl;
        this.audio.load();
      })
      .catch(() => { /* keep streaming from the URL */ });
  }

  ngOnDestroy(): void {
    this.audio.pause();
    if (this._blobUrl) URL.revokeObjectURL(this._blobUrl);
  }

  /** Move the audio to the chosen position; kept pending while the audio is not loaded yet. */
  private _applyStartAt(): void {
    if (this._startAt === null || this.audio.readyState < HTMLMediaElement.HAVE_METADATA) return;
    this.audio.currentTime = this._startAt;
    this._startAt = null;
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
    this.audio.muted = false;
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
      if (this.audio.currentTime > this._setTimeOfTrackByStep() || this.audio.ended) {
        progress.style.width = '0%';
        this.elapsed = 0;
        this._clearInterval();
        return;
      }

      if (paused) {
        this._clearInterval();
        return;
      }
      this.elapsed = Math.min(this.audio.currentTime, this._setTimeOfTrackByStep());
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
    return this._calculateProgress(Math.min(this.audio.currentTime, this._setTimeOfTrackByStep()), this.maxSeconds).toString() + '%';
  }

  private _calculateProgress(currentTime: number, totalTime: number): number {
    if (totalTime === 0) return 0;
    return (currentTime / totalTime) * 100;
  }

}
