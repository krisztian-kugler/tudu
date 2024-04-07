import { DOCUMENT } from "@angular/common";
import { Directive, ElementRef, EventEmitter, HostListener, Inject, Output, Renderer2 } from "@angular/core";

import { DragAndDropService } from "src/app/services/drag-and-drop/drag-and-drop.service";

type Position = {
  x: number;
  y: number;
};

@Directive({
  selector: "[tuduDraggable]",
  standalone: true,
})
export class DraggableDirective {
  @Output() dragStart = new EventEmitter<PointerEvent>();
  @Output() dragMove = new EventEmitter<PointerEvent>();
  @Output() dragEnd = new EventEmitter<PointerEvent>();

  private startPosition: Position = { x: 0, y: 0 };

  private _movePosition: Position = { x: 0, y: 0 };

  get movePosition(): Position {
    return this._movePosition;
  }

  set movePosition(value: Position) {
    this._movePosition = value;

    if (this.movePosition.x === 0 && this.movePosition.y === 0) {
      this.renderer.removeStyle(this.host.nativeElement, "transform");
    } else {
      this.renderer.setStyle(
        this.host.nativeElement,
        "transform",
        `translate(${this.movePosition.x}px, ${this.movePosition.y}px)`
      );
    }
  }

  private listeners: (() => void)[] = [];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    public host: ElementRef<HTMLElement>,
    private dragAndDropService: DragAndDropService
  ) {}

  @HostListener("pointerdown", ["$event"]) onDragStart(event: PointerEvent) {
    this.startPosition = {
      x: event.clientX - this.movePosition.x,
      y: event.clientY - this.movePosition.y,
    };

    this.renderer.setStyle(this.host.nativeElement, "pointer-events", "none");
    this.renderer.setStyle(this.host.nativeElement, "touch-action", "none");
    this.renderer.setStyle(this.host.nativeElement, "user-select", "none");
    this.renderer.setAttribute(this.document.body, "dragging", "");

    this.listeners.push(
      this.renderer.listen(this.document, "pointermove", this.onDragMove.bind(this)),
      this.renderer.listen(this.document, "pointerup", this.onDragEnd.bind(this))
    );

    this.dragAndDropService.isDragging$.next(true);
    this.dragStart.emit(event);
  }

  private onDragMove(event: PointerEvent) {
    this.movePosition = {
      x: event.clientX - this.startPosition.x,
      y: event.clientY - this.startPosition.y,
    };

    this.dragMove.emit(event);
  }

  private onDragEnd(event: PointerEvent) {
    this.renderer.removeStyle(this.host.nativeElement, "pointer-events");
    this.renderer.removeStyle(this.host.nativeElement, "touch-action");
    this.renderer.removeStyle(this.host.nativeElement, "user-select");
    this.renderer.removeAttribute(this.document.body, "dragging");

    this.listeners.forEach((unlisten) => unlisten());
    this.listeners = [];

    this.dragAndDropService.isDragging$.next(false);
    this.dragEnd.emit(event);
  }

  resetPosition() {
    this.movePosition = { x: 0, y: 0 };
  }
}
