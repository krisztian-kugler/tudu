import { DOCUMENT } from "@angular/common";
import { Directive, ElementRef, HostListener, Inject, Optional, Renderer2, SkipSelf } from "@angular/core";
import { Subscription } from "rxjs";

import { DropListDirective } from "./drop-list.directive";
import { DragAndDropService } from "./drag-and-drop.service";

import type { Position, BoundingRectDistance } from "./types";

@Directive({
  selector: "[tuduDraggable]",
  standalone: true,
})
export class DraggableDirective {
  private startPosition: Position = { x: 0, y: 0 };
  private movePosition: Position = { x: 0, y: 0 };

  private sourceDropList?: DropListDirective;

  private pointerMoveSubscription?: Subscription;
  private pointerUpSubscription?: Subscription;
  private scrollSubscription?: Subscription;

  private preview: HTMLElement | null = null;
  private anchor?: Node;

  private pointerDistanceFromBoundingRect: BoundingRectDistance = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private element: ElementRef<HTMLElement>,
    private dragAndDropService: DragAndDropService,
    @Optional() @SkipSelf() private dropList?: DropListDirective
  ) {
    this.dropList?.addDraggable(this);
  }

  setPosition(x: number, y: number) {
    this.movePosition = { x, y };

    x || y
      ? this.renderer.setStyle(this.getVisibleElement(), "transform", `translate(${x}px, ${y}px)`)
      : this.renderer.removeStyle(this.getVisibleElement(), "transform");
  }

  resetPosition() {
    this.setPosition(0, 0);
  }

  getRootElement(): HTMLElement {
    return this.element.nativeElement;
  }

  getVisibleElement(): HTMLElement {
    return this.preview ?? this.getRootElement();
  }

  getPointerDistanceFromBoundingRect(): BoundingRectDistance {
    return this.pointerDistanceFromBoundingRect;
  }

  setPointerDistanceFromBoundingRect(pointerX: number, pointerY: number) {
    const clientRect = this.getRootElement().getBoundingClientRect();

    this.pointerDistanceFromBoundingRect = {
      top: pointerY - clientRect.top,
      bottom: clientRect.bottom - pointerY,
      left: pointerX - clientRect.left,
      right: clientRect.right - pointerX,
    };
  }

  @HostListener("pointerdown", ["$event"]) onPointerDown({ clientX, clientY }: PointerEvent) {
    if (this.dragAndDropService.isDragging()) return;

    this.setPointerDistanceFromBoundingRect(clientX, clientY);

    this.dragAndDropService.dragStart(this);

    this.startPosition = {
      x: clientX - this.movePosition.x,
      y: clientY - this.movePosition.y,
    };

    const element = this.getRootElement();

    if (this.dropList) {
      this.preview = this.createPreview();
      this.sourceDropList = this.dropList;
      this.anchor = this.renderer.createComment("");
      this.renderer.insertBefore(this.dropList.host.nativeElement, this.anchor, element);
      this.renderer.appendChild(this.document.body, this.preview);
      this.renderer.removeChild(this.dropList.host.nativeElement, element);
      this.dropList.startDraggingSequence(this);

      // this.dropList.removeDraggable(this);
    } else {
      this.renderer.setStyle(element, "pointer-events", "none");
      this.renderer.setStyle(element, "touch-action", "none");
      this.renderer.setStyle(element, "user-select", "none");
    }

    this.renderer.setAttribute(this.document.body, "dragging", "");

    this.pointerMoveSubscription = this.dragAndDropService.pointerMove$.subscribe(this.onPointerMove.bind(this));
    this.pointerUpSubscription = this.dragAndDropService.pointerUp$.subscribe(this.onPointerUp.bind(this));
    this.scrollSubscription = this.dragAndDropService.scroll$.subscribe(this.onScroll.bind(this));
  }

  private onPointerMove({ clientX, clientY }: PointerEvent) {
    this.setPosition(clientX - this.startPosition.x, clientY - this.startPosition.y);
    this.updateDropList(clientX, clientY);
  }

  private onPointerUp(event: PointerEvent) {
    const dragElement = this.getVisibleElement();
    this.removeStyles(dragElement, ["pointer-events", "touch-action", "user-select"]);
    this.renderer.removeAttribute(this.document.body, "dragging");

    if (this.dropList) {
      this.dropList.endDragSequence();
      this.animatePreviewToPlaceholder(this.dropList).then(() => {
        this.renderer.insertBefore(this.sourceDropList!.host.nativeElement, this.getRootElement(), this.anchor);
        this.renderer.removeChild(this.sourceDropList?.host.nativeElement, this.anchor);
        this.resetPosition();
        this.anchor = undefined;
        this.dropList!.drop(this, this.sourceDropList!);
        this.dropList = this.sourceDropList;
        this.dropList!.reset();
        this.dragAndDropService.dragEnd();
      });
    } else {
      this.dragAndDropService.dragEnd();
    }

    this.pointerMoveSubscription?.unsubscribe();
    this.pointerUpSubscription?.unsubscribe();
    this.scrollSubscription?.unsubscribe();
  }

  private onScroll() {
    const { clientX, clientY } = this.dragAndDropService.getLastPointerMoveEvent()!;
    this.updateDropList(clientX, clientY);
  }

  private updateDropList(x: number, y: number) {
    if (!this.dropList) return;

    const newDropList = this.dropList.getSiblingDropListFromPoint(x, y);

    if (newDropList && newDropList !== this.dropList) {
      this.dropList.leave(this);
      this.dropList = newDropList;
      this.dropList.enter(this, x, y);
    }

    this.dropList.startScrollingIfNeeded(x, y);
    this.dropList.sortDraggables(this, x, y);
  }

  private scrollableAncestors = new Map<HTMLElement, { scrollTop: number; scrollLeft: number }>();

  private cacheScrollableAncestors() {
    this.scrollableAncestors.clear();
    let currentElement: HTMLElement | null = this.dropList!.host.nativeElement;

    while (currentElement) {
      if (
        currentElement.scrollWidth > currentElement.clientWidth ||
        currentElement.scrollHeight > currentElement.clientHeight
      ) {
        this.scrollableAncestors.set(currentElement, {
          scrollTop: currentElement.scrollTop,
          scrollLeft: currentElement.scrollLeft,
        });
      }
      currentElement = currentElement.parentElement;
    }

    console.log(this.scrollableAncestors);
  }

  private animatePreviewToPlaceholder(dropList: DropListDirective): Promise<void> {
    this.cacheScrollableAncestors();
    const scrollSubscription = this.dragAndDropService.scroll$.subscribe((event) => {
      const scrolledElement = event.target as HTMLElement;
      const currentScrollPosition = this.scrollableAncestors.get(scrolledElement);
      const newScrollPosition = { scrollTop: scrolledElement.scrollTop, scrollLeft: scrolledElement.scrollLeft };
      const scrollDelta = {
        scrollTop: -(newScrollPosition.scrollTop - (currentScrollPosition?.scrollTop || 0)),
        scrollLeft: -(newScrollPosition.scrollLeft - (currentScrollPosition?.scrollLeft || 0)),
      };
      const visibleElement = this.getVisibleElement();
      this.renderer.setStyle(
        visibleElement,
        "top",
        `${parseFloat(getComputedStyle(visibleElement).top) + scrollDelta.scrollTop}px`
      );
      this.renderer.setStyle(
        visibleElement,
        "left",
        `${parseFloat(getComputedStyle(visibleElement).left) + scrollDelta.scrollLeft}px`
      );
      this.scrollableAncestors.set(scrolledElement, {
        scrollTop: scrolledElement.scrollTop,
        scrollLeft: scrolledElement.scrollLeft,
      });
    });

    return new Promise((resolve) => {
      const visibleElement: HTMLElement = this.getVisibleElement();
      const elementRect: DOMRect = visibleElement.getBoundingClientRect();
      const placeholderRect: DOMRect = dropList.placeholder!.getBoundingClientRect();

      this.renderer.setStyle(visibleElement, "top", `${placeholderRect.top - this.dropList!.getHeightDiff()}px`);
      this.renderer.setStyle(visibleElement, "left", `${placeholderRect.left}px`);
      this.setPosition(
        elementRect.left - placeholderRect.left,
        elementRect.top - (placeholderRect.top - this.dropList!.getHeightDiff())
      );

      requestAnimationFrame(() => {
        this.renderer.setStyle(visibleElement, "transition", `transform ${dropList.animationDuration}ms`);
        this.resetPosition();

        const unlisten = this.renderer.listen(visibleElement, "transitionend", () => {
          unlisten();
          scrollSubscription.unsubscribe();
          this.destroyPreview();
          resolve(undefined);
        });
      });
    });
  }

  private createPreview(): HTMLElement {
    const element = this.getRootElement();
    const preview = element.cloneNode(true) as HTMLElement;
    const { top, left } = element.getBoundingClientRect();

    this.setStyles(preview, {
      position: "fixed",
      "z-index": "var(--z-index-draggable)",
      top: `${top}px`,
      left: `${left}px`,
      "pointer-events": "none",
      "touch-action": "none",
      "user-select": "none",
      "background-color": "red",
    });

    return preview;
  }

  private destroyPreview() {
    this.preview?.remove();
    this.preview = null;
  }

  private setStyles(element: HTMLElement, styles: Record<string, string>) {
    for (const [prop, value] of Object.entries(styles)) this.renderer.setStyle(element, prop, value);
  }

  private removeStyles(element: HTMLElement, styles: string[]) {
    for (const style of styles) this.renderer.removeStyle(element, style);
  }
}
