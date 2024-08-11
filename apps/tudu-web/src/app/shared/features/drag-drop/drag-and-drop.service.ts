import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject, Subject, fromEvent, takeWhile, tap } from "rxjs";

import type { DraggableDirective } from "src/app/shared/features/drag-drop/draggable.directive";

@Injectable({
  providedIn: "root",
})
export class DragAndDropService {
  activeDraggable: DraggableDirective | null = null;
  pointerMove$ = new Subject<PointerEvent>();
  pointerUp$ = new Subject<PointerEvent>();
  scroll$ = new Subject<UIEvent>();

  private lastPointerMoveEvent: PointerEvent | null = null;
  private isDragging$ = new BehaviorSubject<boolean>(false);

  constructor(@Inject(DOCUMENT) private document: Document) {}

  getLastPointerMoveEvent(): PointerEvent | null {
    return this.lastPointerMoveEvent;
  }

  private setLastPointerMoveEvent(event: PointerEvent) {
    this.lastPointerMoveEvent = event;
  }

  isDragging(): boolean {
    return this.isDragging$.value;
  }

  dragStart(draggable: DraggableDirective) {
    this.isDragging$.next(true);
    this.activeDraggable = draggable;

    fromEvent<PointerEvent>(this.document, "pointermove")
      .pipe(
        takeWhile(() => this.isDragging$.value),
        tap(this.setLastPointerMoveEvent)
      )
      .subscribe((event) => this.pointerMove$.next(event));

    fromEvent<PointerEvent>(this.document, "pointerup")
      .pipe(takeWhile(() => this.isDragging$.value))
      .subscribe((event) => this.pointerUp$.next(event));

    fromEvent<UIEvent>(this.document, "scroll", { capture: true, passive: true })
      .pipe(takeWhile(() => this.isDragging$.value))
      .subscribe((event) => this.scroll$.next(event));
  }

  dragEnd() {
    this.isDragging$.next(false);
    this.activeDraggable = null;
    this.lastPointerMoveEvent = null;
  }
}
