import { trigger, transition, state, style, animate } from '@angular/animations';

export let fade = (name: string, milliseconds: number, delay?: number) => {
  if (!delay) delay = 0;
  return trigger(name, [
    state('void', style({opacity: 0})),
    transition(':enter, :leave', [animate(`${milliseconds}ms ${delay}ms`)])
  ])
}
export let glideY = (name: string, pixels: number, milliseconds: number, delay?: number) => {
  if (!delay) delay = 0;
  return trigger(name, [
    state('void', style({transform: `translateY(${pixels}px)`})),
    transition(':enter, :leave', [animate(`${milliseconds}ms ${delay}ms`)])
  ])
}
