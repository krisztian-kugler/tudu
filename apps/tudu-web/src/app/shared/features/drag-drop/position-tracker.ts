import { addItemToArrayImmutable, moveItemInArrayImmutable, removeItemFromArrayImmutable } from "src/utils/array";

import type { DraggableDirective } from "./draggable.directive";
import type { MutableDOMRect } from "./types";

type DraggableItem = {
  draggable: DraggableDirective;
  rect: MutableDOMRect;
  offset: number;
};

export class DraggablePositionTracker {
  private items: DraggableItem[] = [];

  addItem(item: DraggableItem, index: number) {
    this.items = addItemToArrayImmutable<DraggableItem>(this.items, item, index);
  }

  removeItem(index: number) {
    this.items = removeItemFromArrayImmutable<DraggableItem>(this.items, index);
  }

  moveItem(sourceIndex: number, targetIndex: number) {
    this.items = moveItemInArrayImmutable<DraggableItem>(this.items, sourceIndex, targetIndex);
  }
}
