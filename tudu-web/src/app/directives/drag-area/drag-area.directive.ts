import { AfterContentInit, ContentChildren, Directive, ElementRef, QueryList } from "@angular/core";
import { Subscription } from "rxjs";

import { DraggableDirective } from "../draggable/draggable.directive";

type Boundaries = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const defaultBoundaries: Boundaries = {
  minX: NaN,
  maxX: NaN,
  minY: NaN,
  maxY: NaN,
};

@Directive({
  selector: "[tuduDragArea]",
  standalone: true,
})
export class DragAreaDirective implements AfterContentInit {
  @ContentChildren(DraggableDirective, { descendants: true }) private draggables?: QueryList<DraggableDirective>;

  private boundaries: Boundaries = defaultBoundaries;
  private subscriptions: Subscription[] = [];

  constructor(private host: ElementRef<HTMLElement>) {}

  private calculateBoundaries(draggable: DraggableDirective) {
    const hostRect: DOMRect = this.host.nativeElement.getBoundingClientRect();
    const draggableRect: DOMRect = draggable.host.nativeElement.getBoundingClientRect();

    this.boundaries = {
      minX: hostRect.left - draggableRect.left + draggable.movePosition.x,
      maxX: hostRect.right - draggableRect.right + draggable.movePosition.x,
      minY: hostRect.top - draggableRect.top + draggable.movePosition.y,
      maxY: hostRect.bottom - draggableRect.bottom + draggable.movePosition.y,
    };
  }

  private restrictDraggableMovement(draggable: DraggableDirective) {
    draggable.movePosition = {
      x: Math.min(this.boundaries.maxX, Math.max(this.boundaries.minX, draggable.movePosition.x)),
      y: Math.min(this.boundaries.maxY, Math.max(this.boundaries.minY, draggable.movePosition.y)),
    };
  }

  ngAfterContentInit() {
    this.draggables?.changes.subscribe(() => {
      this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      this.subscriptions = [];

      this.draggables?.forEach((draggable) => {
        this.subscriptions.push(
          draggable.dragStart.subscribe(() => this.calculateBoundaries(draggable)),
          draggable.dragMove.subscribe(() => this.restrictDraggableMovement(draggable))
        );
      });
    });

    this.draggables?.notifyOnChanges();
  }
}
