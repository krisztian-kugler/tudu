import { Renderer2 } from "@angular/core";

import { addItemToArrayImmutable, moveItemInArrayImmutable, removeItemFromArrayImmutable } from "src/utils/array";
import { getMutableClientRect } from "./utils";

import type { DraggableDirective } from "./draggable.directive";
import type { DropListOrientation, MutableDOMRect } from "./types";

type DraggablePosition = {
  draggable: DraggableDirective;
  clientRect: MutableDOMRect;
  offset: number;
};

const DEFAULT_TARGET_INDEX: number = -1;

export class DraggablePositionTracker {
  orientation: DropListOrientation = "vertical";

  private draggablePositions: DraggablePosition[] = [];

  /** Keeps track of the index at which the actively dragged element would be dropped. */
  private targetIndex: number = DEFAULT_TARGET_INDEX;

  constructor(private renderer: Renderer2) {}

  cache(draggables: readonly DraggableDirective[]) {
    this.draggablePositions = draggables.map((draggable) => ({
      draggable,
      clientRect: getMutableClientRect(draggable.getRootElement()),
      offset: 0,
    }));
  }

  reset() {
    this.draggablePositions = [];
    this.targetIndex = DEFAULT_TARGET_INDEX;
  }

  move(sourceIndex: number, targetIndex: number) {
    this.draggablePositions = moveItemInArrayImmutable<DraggablePosition>(
      this.draggablePositions,
      sourceIndex,
      targetIndex
    );
  }

  sort(): { sourceIndex: number; targetIndex: number } {
    return {
      sourceIndex: 0,
      targetIndex: this.targetIndex,
    };
  }

  private add(item: DraggablePosition, index: number) {
    this.draggablePositions = addItemToArrayImmutable<DraggablePosition>(this.draggablePositions, item, index);
  }

  private remove(index: number) {
    this.draggablePositions = removeItemFromArrayImmutable<DraggablePosition>(this.draggablePositions, index);
  }
}
