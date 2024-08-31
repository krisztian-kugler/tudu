import { Directive, ElementRef, HostBinding, inject, input, NgZone, OnDestroy, output, Renderer2 } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { animationFrameScheduler, interval, map, Subject, Subscription, takeUntil } from "rxjs";

import { DragAndDropService } from "./drag-and-drop.service";
import { DropListGroupDirective } from "./drop-list-group.directive";
import { moveItemInArray, removeItemFromArray } from "src/utils/array";
import {
  ANIMATION_DURATION,
  canScroll,
  getElementScrollDirection,
  getElementSizeWithMargins,
  getMutableClientRect,
  getScrollToOptions,
  ScrollDirection,
} from "./utils";

import type { DraggableDirective } from "./draggable.directive";
import type {
  DropListDropEvent,
  DropListEnterEvent,
  DropListExitEvent,
  DropListOrientation,
  MutableDOMRect,
  Position,
  ScrollPosition,
} from "./types";

@Directive({
  selector: "[tuduDropList]",
  standalone: true,
})
export class DropListDirective implements OnDestroy {
  orientation = input<DropListOrientation>("vertical", { alias: "tuduDropListOrientation" });

  @HostBinding("style.gridAutoFlow") get gridFlow() {
    return this.orientation() === "vertical" ? "row" : "column";
  }

  entered = output<DropListEnterEvent>({ alias: "tuduDropListEnter" });
  exited = output<DropListExitEvent>({ alias: "tuduDropListExit" });
  dropped = output<DropListDropEvent>({ alias: "tuduDropListDrop" });

  private readonly unsortedDraggables = new Set<DraggableDirective>();
  private placeholder: HTMLElement | null = null;
  private sourceIndex: number = NaN;
  private targetIndex: number = NaN;
  private isPointerOverList: boolean = false;
  private isScrolling: boolean = false;
  private pointerMoveSubscription?: Subscription;
  private scrollSubscription?: Subscription;
  private scrollableAncestors = new Map<HTMLElement, ScrollPosition>();
  private scrollElement?: HTMLElement;
  private scrollDirection = ScrollDirection.NONE;
  private autoScrollStep: number = 2;
  private stopScrollInterval = new Subject<void>();
  private draggablePositions: {
    draggable: DraggableDirective;
    clientRect: MutableDOMRect;
    offset: number;
  }[] = [];

  private document = inject(DOCUMENT);
  private renderer = inject(Renderer2);
  private element = inject<ElementRef<HTMLElement>>(ElementRef);
  private dragAndDropService = inject(DragAndDropService);
  private dropListGroup = inject(DropListGroupDirective, { optional: true, skipSelf: true });
  private ngZone = inject(NgZone);

  constructor() {
    this.dropListGroup?.addDropList(this);
  }

  addDraggable(draggable: DraggableDirective) {
    this.unsortedDraggables.add(draggable);
  }

  removeDraggable(draggable: DraggableDirective) {
    this.unsortedDraggables.delete(draggable);
  }

  getRootElement(): HTMLElement {
    return this.element.nativeElement;
  }

  getPlaceholderRect(): DOMRect | null {
    return this.placeholder?.getBoundingClientRect() ?? null;
  }

  getSiblingDropListFromPoint(x: number, y: number): DropListDirective | undefined {
    const elementFromPoint = this.document.elementFromPoint(x, y);

    return this.getSiblingDropLists().find((dropList) => {
      const rootElement = dropList.getRootElement();
      return rootElement === elementFromPoint || rootElement.contains(elementFromPoint);
    });
  }

  private getSiblingDropLists(): DropListDirective[] {
    return this.dropListGroup ? Array.from(this.dropListGroup.items).filter((dropList) => dropList !== this) : [];
  }

  private getSortedDraggables(): DraggableDirective[] {
    return Array.from(this.unsortedDraggables).sort((a, b) =>
      a.getRootElement().compareDocumentPosition(b.getRootElement()) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    );
  }

  /** Calculate the position on the viewport where the active draggable has to be moved after drop */
  getDropPosition(): Position | undefined {
    const placeholderRect = this.placeholder?.getBoundingClientRect();
    return placeholderRect && { y: placeholderRect.top - this.getHeightDiff(), x: placeholderRect.left };
  }

  private cacheScrollableAncestors() {
    this.scrollableAncestors.clear();
    let element: HTMLElement | null = this.getRootElement();

    while (element) {
      if (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight) {
        const { scrollTop, scrollLeft } = element;
        this.scrollableAncestors.set(element, { scrollTop, scrollLeft });
      }
      element = element.parentElement;
    }
  }

  private createPlaceholder(draggable: DraggableDirective): HTMLElement {
    const placeholder = this.renderer.createElement("div") as HTMLElement;
    const { width, height } = getElementSizeWithMargins(draggable.getVisibleElement());

    this.renderer.setStyle(placeholder, "width", `${width}px`);
    this.renderer.setStyle(placeholder, "height", `${height}px`);
    this.renderer.setStyle(placeholder, "background-color", "darkgreen");
    this.renderer.setStyle(placeholder, "opacity", 0.25);
    this.renderer.setStyle(placeholder, "will-change", "height");

    return placeholder;
  }

  private destroyPlaceholder() {
    this.placeholder?.remove();
    this.placeholder = null;
  }

  private cacheDraggablePositions() {
    this.draggablePositions = this.getSortedDraggables().map((draggable) => ({
      draggable,
      clientRect: getMutableClientRect(draggable.getRootElement()),
      offset: 0,
    }));
  }

  private getDropIndexFromPoint(draggable: DraggableDirective, pointerX: number, pointerY: number): number {
    const top = pointerY - draggable.getPointerDistanceFromBoundingRect().top;
    const bottom = pointerY + draggable.getPointerDistanceFromBoundingRect().bottom;

    const itemAtTop = this.draggablePositions.find(({ draggable: test, clientRect, offset }) => {
      if (draggable === test) return false;
      return top > clientRect.top + offset && top < clientRect.bottom + offset;
    });

    if (isNaN(this.targetIndex) && itemAtTop) {
      return top < itemAtTop.clientRect.top + itemAtTop.offset + itemAtTop.clientRect.height / 2
        ? this.draggablePositions.indexOf(itemAtTop)
        : this.draggablePositions.indexOf(itemAtTop) + 1;
    }

    const itemAtBottom = this.draggablePositions.find(({ draggable: test, clientRect, offset }) => {
      if (draggable === test) return false;
      return bottom > clientRect.top + offset && bottom < clientRect.bottom + offset;
    });

    if (itemAtTop && top < itemAtTop.clientRect.top + itemAtTop.offset + itemAtTop.clientRect.height / 2)
      return this.draggablePositions.indexOf(itemAtTop);

    if (itemAtBottom && bottom > itemAtBottom.clientRect.top + itemAtBottom.offset + itemAtBottom.clientRect.height / 2)
      return this.draggablePositions.indexOf(itemAtBottom);

    return this.targetIndex;
  }

  startScrollingIfNeeded(pointerX: number, pointerY: number) {
    this.scrollElement = Array.from(this.scrollableAncestors.keys()).find((ancestor) => {
      const elementScrollDirection = getElementScrollDirection(
        ancestor.getBoundingClientRect(),
        0.1,
        pointerX,
        pointerY
      );

      const scrollable = canScroll(ancestor, elementScrollDirection);

      if (elementScrollDirection && scrollable) this.scrollDirection = elementScrollDirection;

      return scrollable;
    });

    this.scrollElement ? this.ngZone.runOutsideAngular(this.startScrolling.bind(this)) : this.stopScrolling();
  }

  private startScrolling() {
    if (this.isScrolling) return;

    this.isScrolling = true;
    console.log("scrolling started!");

    interval(0, animationFrameScheduler)
      .pipe(takeUntil(this.stopScrollInterval))
      .subscribe(() => this.scrollElement?.scrollBy(getScrollToOptions(this.scrollDirection, this.autoScrollStep)));
  }

  private stopScrolling() {
    if (!this.isScrolling) return;

    this.isScrolling = false;
    console.log("scrolling stopped!");

    this.stopScrollInterval.next();
  }

  startDraggingSequence(draggable: DraggableDirective) {
    this.isPointerOverList = true;

    this.listenToScrollEvents(draggable);
    this.getSiblingDropLists().forEach((sibling) => {
      sibling.cacheDraggablePositions();
      sibling.listenToScrollEvents(draggable);
    });

    this.cacheScrollableAncestors();
    this.cacheDraggablePositions();

    console.log(
      this.draggablePositions.map((item) => {
        return {
          item: item.draggable.getRootElement().textContent,
          top: item.clientRect.top,
        };
      })
    );

    this.placeholder = this.createPlaceholder(draggable);
    this.renderer.appendChild(this.element.nativeElement, this.placeholder);

    this.sourceIndex = this.targetIndex = this.getSortedDraggables().indexOf(draggable);

    this.draggablePositions.forEach((item, index) => {
      if (index > this.targetIndex) {
        item.offset = getElementSizeWithMargins(draggable.getVisibleElement()).height;
        item.draggable.setPosition(0, item.offset);
      }

      requestAnimationFrame(() => {
        this.renderer.setStyle(item.draggable.getRootElement(), "transition", `transform ${ANIMATION_DURATION}ms`);
      });
    });
  }

  private initializePlaceholder(draggable: DraggableDirective) {
    if (this.placeholder) {
      const { width, height } = getElementSizeWithMargins(draggable.getVisibleElement());
      this.renderer.setStyle(this.placeholder, "width", `${width}px`);
      this.renderer.setStyle(this.placeholder, "height", `${height}px`);
      return;
    }

    this.placeholder = this.createPlaceholder(draggable);
    this.renderer.setStyle(this.placeholder, "height", "0px");
    this.renderer.setStyle(this.placeholder, "transition", `height ${ANIMATION_DURATION}ms`);
    this.renderer.appendChild(this.getRootElement(), this.placeholder);

    requestAnimationFrame(() => {
      const { height } = getElementSizeWithMargins(draggable.getVisibleElement());
      this.renderer.setStyle(this.placeholder, "height", `${height}px`);
    });
  }

  /** Called when a draggable enters the drop list at the given coordinates */
  enter(draggable: DraggableDirective, pointerX: number, pointerY: number) {
    console.log("drop list entered");

    this.cacheScrollableAncestors();
    this.isPointerOverList = true;

    // if (this.draggablePositions.length === 0) this.cacheDraggablePositions();
    // this.cacheDraggablePositions();

    this.initializePlaceholder(draggable);

    this.sourceIndex = this.targetIndex = this.getDropIndexFromPoint(draggable, pointerX, pointerY);

    this.draggablePositions.splice(this.targetIndex, 0, {
      draggable,
      clientRect: getMutableClientRect(draggable.getRootElement()),
      offset: 0,
    });

    if (this.sourceIndex > -1) {
      this.draggablePositions.forEach((item, index) => {
        if (draggable === item.draggable) return;

        this.renderer.setStyle(item.draggable.getRootElement(), "transition", `transform ${ANIMATION_DURATION}ms`);

        if (index >= this.targetIndex) {
          item.offset = getElementSizeWithMargins(draggable.getVisibleElement()).height;
          item.draggable.setPosition(0, item.offset);
        }
      });

      this.createDOMRectHelpers(draggable);
    }

    // this.listenToScrollEvents(draggable);
    this.startScrollingIfNeeded(pointerX, pointerY);

    this.entered.emit({ draggable, dropList: this, index: this.sourceIndex });
  }

  exit(draggable: DraggableDirective) {
    this.isPointerOverList = false;
    removeItemFromArray(this.draggablePositions, this.targetIndex);
    this.draggablePositions.forEach((item) => {
      item.offset = 0;
    });

    this.sourceIndex = this.targetIndex = NaN;
    this.stopScrolling();

    this.clearDOMRectHelpers();

    if (this.placeholder) {
      this.renderer.setStyle(this.placeholder, "transition", `height ${ANIMATION_DURATION}ms`);
      this.renderer.setStyle(this.placeholder, "height", "0px");

      const unlisten = this.renderer.listen(this.placeholder, "transitionend", () => {
        unlisten();
        if (!this.isPointerOverList) this.destroyPlaceholder();
      });
    }

    this.getSortedDraggables()
      .filter((item) => item !== draggable)
      .forEach((item, i) => {
        //this.renderer.removeStyle(item.element.nativeElement, "transition");
        item.resetPosition();

        requestAnimationFrame(() => {
          this.renderer.setStyle(item.getRootElement(), "transition", `transform ${ANIMATION_DURATION}ms`);
        });
      });

    this.pointerMoveSubscription?.unsubscribe();
    // this.scrollSubscription?.unsubscribe();
    console.log("drop list exited");

    this.exited.emit({ draggable, dropList: this });
  }

  reset() {
    this.resetDraggables();
    this.getSiblingDropLists().forEach((dropList) => {
      dropList.resetDraggables();
      dropList.scrollSubscription?.unsubscribe();
    });
  }

  private resetDraggables() {
    this.draggablePositions = [];
    this.getSortedDraggables().forEach((draggable) => {
      draggable.resetPosition();
      draggable.resetStyles();
    });
  }

  private listenToScrollEvents(draggable: DraggableDirective) {
    this.scrollSubscription = this.dragAndDropService.scroll$
      .pipe(
        map(({ target }): Position => {
          const scrolledElement = target as HTMLElement;
          const oldScrollPosition = this.scrollableAncestors.get(scrolledElement);

          if (!oldScrollPosition) return { x: 0, y: 0 };

          this.scrollableAncestors.set(scrolledElement, {
            scrollTop: scrolledElement.scrollTop,
            scrollLeft: scrolledElement.scrollLeft,
          });

          return {
            x: -(scrolledElement.scrollLeft - oldScrollPosition.scrollLeft),
            y: -(scrolledElement.scrollTop - oldScrollPosition.scrollTop),
          };
        })
      )
      .subscribe(({ x, y }) => {
        this.draggablePositions.forEach(({ clientRect }) => {
          clientRect.top += y;
          clientRect.bottom = clientRect.top + clientRect.height;
          clientRect.left += x;
          clientRect.right = clientRect.left + clientRect.width;
        });

        if (this.isPointerOverList) {
          const { x, y } = this.dragAndDropService.getLastPointerPosition();
          this.sortDraggables(draggable, x, y);
        }
      });
  }

  sortDraggables(draggable: DraggableDirective, pointerX: number, pointerY: number) {
    const dropIndexFromPoint = this.getDropIndexFromPoint(draggable, pointerX, pointerY);
    // console.log(dropIndexFromPoint);

    if (dropIndexFromPoint === -1 || dropIndexFromPoint === this.targetIndex) return;

    this.sourceIndex = this.targetIndex;
    moveItemInArray(this.draggablePositions, this.sourceIndex, dropIndexFromPoint);
    this.targetIndex = dropIndexFromPoint;

    this.draggablePositions.forEach((item, index) => {
      if (item.draggable === draggable) return;
      if (index > this.targetIndex) {
        item.offset = 108;
        item.draggable.setPosition(0, getElementSizeWithMargins(draggable.getVisibleElement()).height);
      } else {
        item.offset = 0;
        item.draggable.resetPosition();
      }
    });
    console.log("sourceIndex: " + this.sourceIndex, "targetIndex: " + this.targetIndex);

    this.clearDOMRectHelpers();

    this.draggablePositions.forEach((item) => {
      if (item.draggable === draggable) return;
      const helper = this.createDOMRectHelper(item.clientRect, item.offset, "green");
      this.DOMRectHelpers.push(helper);
      this.renderer.appendChild(this.document.body, helper);
    });
  }

  /** Calculate the distance between the placeholder and the insertion point of the dragged item */
  getHeightDiff(): number {
    return this.draggablePositions
      .filter((_, index) => index > this.targetIndex)
      .reduce((acc, item) => (acc += getElementSizeWithMargins(item.draggable.getRootElement()).height), 0);
  }

  endDragSequence() {
    this.stopScrolling();
    this.scrollSubscription?.unsubscribe();
  }

  ngOnDestroy() {
    this.dropListGroup?.removeDropList(this);
    this.scrollSubscription?.unsubscribe();
    this.stopScrollInterval.complete();
  }

  /** Drops a draggable into this container after the drop animation finished */
  drop(sourceDropList: DropListDirective) {
    this.destroyPlaceholder();

    this.dropped.emit({
      sourceIndex: this.sourceIndex,
      targetIndex: this.targetIndex,
      sourceDropList,
      targetDropList: this,
    });

    this.clearDOMRectHelpers();
  }

  /** To be deleted */
  private DOMRectHelpers: HTMLElement[] = [];

  /** To be deleted */
  private clearDOMRectHelpers() {
    this.DOMRectHelpers.forEach((item) => item.remove());
    this.DOMRectHelpers = [];
  }

  /** To be deleted */
  private createDOMRectHelper(DOMRect: MutableDOMRect, offset: number, color: string): HTMLElement {
    const element = this.renderer.createElement("div");
    this.renderer.setStyle(element, "position", "fixed");
    this.renderer.setStyle(element, "z-index", 100);
    this.renderer.setStyle(element, "top", DOMRect.top + offset + "px");
    this.renderer.setStyle(element, "left", DOMRect.left + "px");
    this.renderer.setStyle(element, "width", `${DOMRect.width}px`);
    this.renderer.setStyle(element, "height", `${DOMRect.height}px`);
    this.renderer.setStyle(element, "border", `1px dashed darkgreen`);
    this.renderer.setStyle(element, "pointer-events", `none`);
    return element;
  }

  /** To be deleted */
  private createDOMRectHelpers(draggable: DraggableDirective) {
    this.draggablePositions.forEach((item) => {
      if (item.draggable === draggable) return;
      const helper = this.createDOMRectHelper(item.clientRect, item.offset, "green");
      this.DOMRectHelpers.push(helper);
      this.renderer.appendChild(this.document.body, helper);
    });
  }
}
