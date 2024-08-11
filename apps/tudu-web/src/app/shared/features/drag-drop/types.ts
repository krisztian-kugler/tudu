import type { DraggableDirective } from "./draggable.directive";
import type { DropListDirective } from "./drop-list.directive";

export type Position = {
  x: number;
  y: number;
};

export type BoundingRectDistance = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type DropListOrientation = "vertical" | "horizontal";

export type DropListEnterEvent = {
  draggable: DraggableDirective;
  dropList: DropListDirective;
  index: number;
};

export type DropListExitEvent = {
  draggable: DraggableDirective;
  dropList: DropListDirective;
};

export type DropListDropEvent = {
  sourceDropList: DropListDirective;
  sourceIndex: number;
  targetDropList: DropListDirective;
  targetIndex: number;
};
