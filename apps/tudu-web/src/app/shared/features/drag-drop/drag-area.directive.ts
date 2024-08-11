import { Directive, ElementRef, contentChildren, effect } from "@angular/core";
import { Subscription } from "rxjs";

import { DraggableDirective } from "./draggable.directive";

type Boundaries = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

@Directive({
  selector: "[tuduDragArea]",
  standalone: true,
})
export class DragAreaDirective {
  private draggables = contentChildren(DraggableDirective, { descendants: true });
  private subscriptions: Subscription[] = [];
  private boundaries: Boundaries = {
    minX: NaN,
    maxX: NaN,
    minY: NaN,
    maxY: NaN,
  };

  constructor(private host: ElementRef<HTMLElement>) {
    effect((onCleanup) => {
      this.subscriptions = this.draggables().reduce((subs, draggable) => {
        return subs;
      }, [] as Subscription[]);

      onCleanup(() => this.subscriptions.forEach((subscription) => subscription.unsubscribe()));
    });
  }

  /* private calculateBoundaries(draggable: DraggableDirective) {
    const hostRect: DOMRect = this.host.nativeElement.getBoundingClientRect();
    const draggableRect: DOMRect = draggable.getRootElement().getBoundingClientRect();

    this.boundaries = {
      minX: hostRect.left - draggableRect.left + draggable.movePosition.x,
      maxX: hostRect.right - draggableRect.right + draggable.movePosition.x,
      minY: hostRect.top - draggableRect.top + draggable.movePosition.y,
      maxY: hostRect.bottom - draggableRect.bottom + draggable.movePosition.y,
    };
  }

  private restrictDraggableMovement(draggable: DraggableDirective) {
    draggable.setPosition(
      Math.min(this.boundaries.maxX, Math.max(this.boundaries.minX, draggable.movePosition.x)),
      Math.min(this.boundaries.maxY, Math.max(this.boundaries.minY, draggable.movePosition.y)),
    );
  } */
}
