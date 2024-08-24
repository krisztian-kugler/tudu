import { DOCUMENT } from "@angular/common";
import { inject, Injectable } from "@angular/core";
import { BehaviorSubject, Subject, fromEvent, takeWhile, tap } from "rxjs";

import type { Position } from "./types";

@Injectable({
  providedIn: "root",
})
export class DragAndDropService {
  pointerMove$ = new Subject<PointerEvent>();
  pointerUp$ = new Subject<PointerEvent>();
  scroll$ = new Subject<UIEvent>();

  private isDragging$ = new BehaviorSubject<boolean>(false);
  private lastPointerPosition: Position = { x: 0, y: 0 };

  private document = inject(DOCUMENT);

  startDragging() {
    this.isDragging$.next(true);
    this.addGlobalListeners();
  }

  stopDragging() {
    this.isDragging$.next(false);
  }

  isDragging(): boolean {
    return this.isDragging$.value;
  }

  getLastPointerPosition(): Position {
    return this.lastPointerPosition;
  }

  private addGlobalListeners() {
    fromEvent<PointerEvent>(this.document, "pointermove")
      .pipe(
        takeWhile(() => this.isDragging$.value),
        tap(({ clientX, clientY }) => (this.lastPointerPosition = { x: clientX, y: clientY }))
      )
      .subscribe((event) => this.pointerMove$.next(event));

    fromEvent<PointerEvent>(this.document, "pointerup")
      .pipe(takeWhile(() => this.isDragging$.value))
      .subscribe((event) => this.pointerUp$.next(event));

    fromEvent<UIEvent>(this.document, "scroll", { capture: true, passive: true })
      .pipe(takeWhile(() => this.isDragging$.value))
      .subscribe((event) => this.scroll$.next(event));
  }
}
