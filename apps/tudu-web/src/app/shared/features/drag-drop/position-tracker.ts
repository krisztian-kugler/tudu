import { moveItemInArray } from "src/utils/array";

import type { DraggableDirective } from "../../shared/features/drag-drop/draggable.directive";

type DraggableItem = {
  draggable: DraggableDirective;
  clientRect: DOMRect;
  offset: number;
};

export class DraggablePositionTracker {
  private positions: DraggableItem[] = [];

  constructor() {}

  addItemAtIndex(item: DraggableItem, index: number) {
    if (index < 0 || index > this.positions.length) throw new Error("Index out of bounds");
    this.positions = [...this.positions.slice(0, index), item, ...this.positions.slice(index)];
  }

  removeItemAtIndex(index: number) {
    if (index < 0 || index >= this.positions.length) throw new Error("Index out of bounds");
    this.positions = this.positions.filter((_, i) => i !== index);
  }

  moveItem(fromIndex: number, toIndex: number) {
    moveItemInArray<DraggableItem>(this.positions, fromIndex, toIndex);
  }
}
