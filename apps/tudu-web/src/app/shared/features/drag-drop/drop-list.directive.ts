import {
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output,
  Renderer2,
  SkipSelf,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { animationFrameScheduler, interval, Subject, Subscription, takeUntil } from "rxjs";

import { DropListGroupDirective } from "./drop-list-group.directive";
import { getElementScrollDirection, getElementSizeWithMargins, ScrollDirection } from "src/utils/dom";
import { moveItemInArray, removeItemFromArray } from "src/utils/array";
import { canScroll, getScrollToOptions } from "./utils";

import type { DraggableDirective } from "./draggable.directive";
import type { DropListDropEvent, DropListEnterEvent, DropListExitEvent, DropListOrientation } from "./types";
import { DragAndDropService } from "./drag-and-drop.service";

@Directive({
  selector: "[tuduDropList]",
  standalone: true,
})
export class DropListDirective implements OnDestroy {
  @Input({ alias: "tuduDropListOrientation" }) orientation: DropListOrientation = "vertical";

  @HostBinding("style.gridAutoFlow") get flow() {
    return this.orientation === "vertical" ? "row" : "column";
  }

  @Output("tuduDropListEnter") entered = new EventEmitter<DropListEnterEvent>();
  @Output("tuduDropListExit") exited = new EventEmitter<DropListExitEvent>();
  @Output("tuduDropListDrop") dropped = new EventEmitter<DropListDropEvent>();

  animationDuration: number = 1500;
  placeholder: HTMLElement | null = null;

  private draggablePositions: {
    draggable: DraggableDirective;
    clientRect: DOMRect;
    offset: number;
  }[] = [];

  /** The starting index of the draggable at the beginning of the drag sequence */
  private fromIndex: number = NaN;

  /** The current index at which the active draggable is dragged */
  private toIndex: number = NaN;

  /** Indicates if a dragging sequence is currently happening over this drop list */
  private isPointerOverList: boolean = false;
  private pointerMoveSubscription?: Subscription;
  private scrollSubscription?: Subscription;

  /** List of registered daggables in this drop list. */
  private readonly unsortedDraggables = new Set<DraggableDirective>();

  /** List of all scrollable ancestors of the drop list element up the DOM tree */
  private scrollableAncestors: HTMLElement[] = [];

  /** The current scrollable element */
  private scrollElement?: HTMLElement;

  /** The direction in which the current scrollable element can be scrolled */
  private scrollDirection = ScrollDirection.NONE;

  /** Number of pixels by which we want to scroll each time */
  private autoScrollStep: number = 2;
  private stopScrollInterval = new Subject<void>();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public host: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Optional() @SkipSelf() private dropListGroup: DropListGroupDirective,
    private dragAndDropService: DragAndDropService,
    private ngZone: NgZone
  ) {
    this.dropListGroup?.addDropList(this);
  }

  /** Register a draggable in this drop list */
  addDraggable(draggable: DraggableDirective) {
    this.unsortedDraggables.add(draggable);
  }

  /** Unregister a draggable from this drop list */
  removeDraggable(draggable: DraggableDirective) {
    this.unsortedDraggables.delete(draggable);
  }

  /** Get all draggables that are registered in this drop list, sorted by their position in the DOM */
  private getSortedDraggables(): DraggableDirective[] {
    return Array.from(this.unsortedDraggables).sort((a, b) =>
      a.getRootElement().compareDocumentPosition(b.getRootElement()) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    );
  }

  private cacheScrollableAncestors() {
    const scrollableAncestors = [];
    let currentElement: HTMLElement | null = this.host.nativeElement;

    do {
      if (
        currentElement.scrollWidth > currentElement.clientWidth ||
        currentElement.scrollHeight > currentElement.clientHeight
      ) {
        scrollableAncestors.push(currentElement);
      }
      currentElement = currentElement.parentElement;
    } while (currentElement);

    this.scrollableAncestors = scrollableAncestors;
  }

  private getSiblingDropLists(): DropListDirective[] {
    return this.dropListGroup ? Array.from(this.dropListGroup.items).filter((dropList) => dropList !== this) : [];
  }

  getSiblingDropListFromPoint(x: number, y: number): DropListDirective | undefined {
    const elementFromPoint = this.document.elementFromPoint(x, y);

    return this.getSiblingDropLists().find(
      ({ host: { nativeElement } }) => nativeElement === elementFromPoint || nativeElement.contains(elementFromPoint)
    );
  }

  /** Creates a placeholder element based on the dimensions of the active draggable */
  private createPlaceholder(draggable: DraggableDirective): HTMLElement {
    const element = this.renderer.createElement("div") as HTMLElement;
    const { width, height } = getElementSizeWithMargins(draggable.getVisibleElement());

    this.renderer.setStyle(element, "width", `${width}px`);
    this.renderer.setStyle(element, "height", `${height}px`);
    this.renderer.setStyle(element, "position", "relative");
    this.renderer.setStyle(element, "z-index", 1111);
    this.renderer.setStyle(element, "border-radius", "4px");
    this.renderer.setStyle(element, "background-color", "darkred");
    // this.renderer.setStyle(element, "opacity", 0.5);
    this.renderer.setStyle(element, "pointer-events", "none");
    this.renderer.setStyle(element, "will-change", "height");

    return element;
  }

  /** Removes the placeholder element from the DOM */
  private removePlaceholder() {
    this.placeholder?.remove();
    this.placeholder = null;
  }

  private cacheDraggablePositions() {
    this.draggablePositions = this.getSortedDraggables().map((draggable) => ({
      draggable,
      clientRect: draggable.getRootElement().getBoundingClientRect(),
      offset: 0,
    }));
    // .sort((a, b) => a.clientRect.top - b.clientRect.top);
  }

  /** Get the list index at the current cursor position */
  private getDropIndexFromPoint(draggable: DraggableDirective, pointerX: number, pointerY: number): number {
    const top = pointerY - draggable.getPointerDistanceFromBoundingRect().top;
    const bottom = pointerY + draggable.getPointerDistanceFromBoundingRect().bottom;

    const itemAtTop = this.draggablePositions.find(({ draggable: test, clientRect, offset }) => {
      if (draggable === test) return false;
      return top > clientRect.top + offset && top < clientRect.bottom + offset;
    });

    if (isNaN(this.toIndex) && itemAtTop) {
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

    return this.toIndex;
  }

  startScrollingIfNeeded(pointerX: number, pointerY: number) {
    this.scrollElement = this.scrollableAncestors.find((ancestor) => {
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
    this.stopScrolling();

    interval(0, animationFrameScheduler)
      .pipe(takeUntil(this.stopScrollInterval))
      .subscribe(() => this.scrollElement?.scrollBy(getScrollToOptions(this.scrollDirection, this.autoScrollStep)));
  }

  stopScrolling() {
    this.stopScrollInterval.next();
  }

  startDraggingSequence(draggable: DraggableDirective) {
    this.isPointerOverList = true;

    this.listenToScrollEvents();
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
    this.renderer.appendChild(this.host.nativeElement, this.placeholder);

    this.fromIndex = this.toIndex = this.getSortedDraggables().indexOf(draggable);

    this.draggablePositions.forEach((item, index) => {
      if (index > this.toIndex) {
        item.offset = getElementSizeWithMargins(draggable.getVisibleElement()).height;
        item.draggable.setPosition(0, item.offset);
      }

      requestAnimationFrame(() => {
        this.renderer.setStyle(item.draggable.getRootElement(), "transition", `transform ${this.animationDuration}ms`);
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
    this.renderer.setStyle(this.placeholder, "transition", `height ${this.animationDuration}ms`);
    this.renderer.appendChild(this.host.nativeElement, this.placeholder);

    requestAnimationFrame(() => {
      const { height } = getElementSizeWithMargins(draggable.getVisibleElement());
      this.renderer.setStyle(this.placeholder, "height", `${height}px`);
    });
  }

  /** Called when a draggable enters the drop list at the given coordinates */
  enter(draggable: DraggableDirective, pointerX: number, pointerY: number) {
    this.isPointerOverList = true;
    this.cacheScrollableAncestors();

    if (this.draggablePositions.length === 0) this.cacheDraggablePositions();

    this.initializePlaceholder(draggable);

    this.fromIndex = this.toIndex = this.getDropIndexFromPoint(draggable, pointerX, pointerY);

    this.draggablePositions.splice(this.toIndex, 0, {
      draggable,
      clientRect: draggable.getRootElement().getBoundingClientRect(),
      offset: 0,
    });

    if (this.fromIndex > -1) {
      this.draggablePositions.forEach((item, index) => {
        if (draggable === item.draggable) return;

        this.renderer.setStyle(item.draggable.getRootElement(), "transition", `transform ${this.animationDuration}ms`);

        if (index >= this.toIndex) {
          item.offset = getElementSizeWithMargins(draggable.getVisibleElement()).height;
          item.draggable.setPosition(0, item.offset);
        }
      });

      this.createDOMRectHelpers(draggable);
    }

    this.entered.emit({ draggable, dropList: this, index: this.fromIndex });
  }

  leave(draggable: DraggableDirective) {
    this.isPointerOverList = false;
    removeItemFromArray(this.draggablePositions, this.toIndex);
    this.draggablePositions.forEach((item) => {
      item.offset = 0;
    });
    console.log(
      this.draggablePositions.map((item) => {
        return {
          item: item.draggable.getRootElement().textContent,
          top: item.clientRect.top,
        };
      })
    );
    this.fromIndex = this.toIndex = NaN;
    this.stopScrolling();
    console.log("drop list left");

    this.clearDOMRectHelpers();

    if (this.placeholder) {
      this.renderer.setStyle(this.placeholder, "transition", `height ${this.animationDuration}ms`);
      this.renderer.setStyle(this.placeholder, "height", "0px");

      const unlisten = this.renderer.listen(this.placeholder, "transitionend", () => {
        unlisten();
        if (!this.isPointerOverList) this.removePlaceholder();
      });
    }

    this.getSortedDraggables()
      .filter((item) => item !== draggable)
      .forEach((item, i) => {
        //this.renderer.removeStyle(item.element.nativeElement, "transition");
        item.resetPosition();

        requestAnimationFrame(() => {
          this.renderer.setStyle(item.getRootElement(), "transition", `transform ${this.animationDuration}ms`);
        });
      });
    this.pointerMoveSubscription?.unsubscribe();
    this.exited.emit({ draggable, dropList: this });
  }

  reset() {
    this.draggablePositions.forEach(({ draggable }) => {
      draggable.resetPosition();
      const rootElement = draggable.getRootElement();
      this.renderer.removeStyle(rootElement, "transform");
      this.renderer.removeStyle(rootElement, "transition");
      if (!draggable.getRootElement().attributes.getNamedItem("style")?.value.trim())
        this.renderer.removeAttribute(rootElement, "style");
    });
    this.draggablePositions = [];
    this.getSortedDraggables().forEach((draggable, i) => {
      draggable.resetPosition();
      const rootElement = draggable.getRootElement();
      this.renderer.removeStyle(rootElement, "transform");
      this.renderer.removeStyle(rootElement, "transition");
      if (!draggable.getRootElement().attributes.getNamedItem("style")?.value.trim())
        this.renderer.removeAttribute(rootElement, "style");
    });

    this.getSiblingDropLists().forEach((dropList) => {
      dropList.reset2();
    });
  }

  reset2() {
    this.draggablePositions.forEach(({ draggable }) => {
      draggable.resetPosition();
      const rootElement = draggable.getRootElement();
      this.renderer.removeStyle(rootElement, "transform");
      this.renderer.removeStyle(rootElement, "transition");
      if (!draggable.getRootElement().attributes.getNamedItem("style")?.value.trim())
        this.renderer.removeAttribute(rootElement, "style");
    });
    this.draggablePositions = [];
    this.getSortedDraggables().forEach((item, i) => {
      //this.renderer.removeStyle(item.element.nativeElement, "transition");
      item.resetPosition();
    });
  }

  private listenToScrollEvents() {
    this.scrollSubscription = this.dragAndDropService.scroll$.subscribe(() => {
      console.log("Listening to scroll events in drop list...");
    });
  }

  sortDraggables(draggable: DraggableDirective, pointerX: number, pointerY: number) {
    const dropIndexFromPoint = this.getDropIndexFromPoint(draggable, pointerX, pointerY);
    // console.log(dropIndexFromPoint);

    if (dropIndexFromPoint === -1 || dropIndexFromPoint === this.toIndex) return;

    this.fromIndex = this.toIndex;
    moveItemInArray(this.draggablePositions, this.fromIndex, dropIndexFromPoint);
    this.toIndex = dropIndexFromPoint;

    this.draggablePositions.forEach((item, index) => {
      if (item.draggable === draggable) return;
      if (index > this.toIndex) {
        item.offset = 108;
        item.draggable.setPosition(0, getElementSizeWithMargins(draggable.getVisibleElement()).height);
      } else {
        item.offset = 0;
        item.draggable.resetPosition();
      }
    });
    console.log("fromIndex: " + this.fromIndex, "toIndex: " + this.toIndex);

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
      .filter((_, index) => index > this.toIndex)
      .reduce((acc, item) => (acc += getElementSizeWithMargins(item.draggable.getRootElement()).height), 0);
  }

  endDragSequence() {
    this.stopScrolling();
    this.scrollSubscription?.unsubscribe();
  }

  ngOnDestroy() {
    this.dropListGroup?.removeDropList(this);
    this.stopScrollInterval.complete();
  }

  /** Drops a draggable into this container after(!) the drop animation finished! */
  drop(draggable: DraggableDirective, fromContainer: DropListDirective) {
    this.draggablePositions.forEach(({ draggable }) => {
      const rootElement = draggable.getRootElement();
      this.renderer.removeStyle(rootElement, "transform");
      this.renderer.removeStyle(rootElement, "transition");
      draggable.resetPosition();
      if (!draggable.getRootElement().attributes.getNamedItem("style")?.value.trim())
        this.renderer.removeAttribute(rootElement, "style");
    });
    this.removePlaceholder();
    this.clearDOMRectHelpers();
    this.draggablePositions = [];

    this.dropped.emit({
      sourceIndex: this.fromIndex,
      targetIndex: this.toIndex,
      sourceDropList: fromContainer,
      targetDropList: this,
    });

    return;
    const draggableHost: HTMLElement = draggable.getVisibleElement();
    const draggableHostRect: DOMRect = draggable.getVisibleElement().getBoundingClientRect();
    const placeholderRect: DOMRect = this.placeholder!.getBoundingClientRect();
    const deltaY: number = draggableHostRect.top - placeholderRect.top;
    const deltaX: number = draggableHostRect.left - placeholderRect.left;

    this.renderer.setStyle(draggableHost, "position", "relative");
    this.renderer.removeStyle(draggableHost, "top");
    this.renderer.removeStyle(draggableHost, "left");
    this.renderer.appendChild(this.placeholder, draggableHost);

    draggable.setPosition(deltaX, deltaY);

    requestAnimationFrame(() => {
      this.renderer.removeStyle(draggableHost, "transform");
      draggable.resetPosition();
      this.renderer.setStyle(draggableHost, "transition", `transform ${this.animationDuration}ms`);

      const transitionEndListener = this.renderer.listen(draggableHost, "transitionend", () => {
        transitionEndListener();
        ["position", "z-index", "transition"].forEach((prop) => this.renderer.removeStyle(draggableHost, prop));

        this.draggablePositions.forEach(({ draggable }) => {
          const rootElement = draggable.getRootElement();
          this.renderer.removeStyle(rootElement, "transform");
          this.renderer.removeStyle(rootElement, "transition");
          draggable.resetPosition();
          if (!draggable.getRootElement().attributes.getNamedItem("style")?.value.trim())
            this.renderer.removeAttribute(rootElement, "style");
        });
      });
    });
  }

  /** To be deleted */
  private DOMRectHelpers: HTMLElement[] = [];

  /** To be deleted */
  private clearDOMRectHelpers() {
    this.DOMRectHelpers.forEach((item) => item.remove());
    this.DOMRectHelpers = [];
  }

  /** To be deleted */
  private createDOMRectHelper(DOMRect: DOMRect, offset: number, color: string): HTMLElement {
    const element = this.renderer.createElement("div");
    this.renderer.setStyle(element, "position", "fixed");
    this.renderer.setStyle(element, "z-index", 100);
    this.renderer.setStyle(element, "top", DOMRect.top + offset + "px");
    this.renderer.setStyle(element, "left", DOMRect.left + "px");
    this.renderer.setStyle(element, "width", `${DOMRect.width}px`);
    this.renderer.setStyle(element, "height", `${DOMRect.height}px`);
    this.renderer.setStyle(element, "border", `2px solid ${color}`);
    this.renderer.setStyle(element, "border-radius", `4px`);
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
