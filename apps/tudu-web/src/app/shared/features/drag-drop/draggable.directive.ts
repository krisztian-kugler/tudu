import { DOCUMENT } from "@angular/common";
import { Directive, ElementRef, HostListener, inject, Renderer2 } from "@angular/core";
import { Subscription } from "rxjs";

import { DragAndDropService } from "./drag-and-drop.service";
import { DropListDirective } from "./drop-list.directive";
import { ANIMATION_DURATION } from "./utils";

import type { Position, BoundingRectDistance } from "./types";

@Directive({
  selector: "[tuduDraggable]",
  standalone: true,
})
export class DraggableDirective {
  private startPosition: Position = { x: 0, y: 0 };
  private movePosition: Position = { x: 0, y: 0 };
  private preview: HTMLElement | null = null;
  private anchor: Node | null = null;
  private pointerDistanceFromBoundingRect: BoundingRectDistance = { top: 0, bottom: 0, left: 0, right: 0 };
  private sourceDropList: DropListDirective | null = null;
  private pointerMoveSubscription?: Subscription;
  private pointerUpSubscription?: Subscription;
  private scrollSubscription?: Subscription;
  private scrollableAncestors = new Map<HTMLElement, { scrollTop: number; scrollLeft: number }>();

  private document = inject(DOCUMENT);
  private renderer = inject(Renderer2);
  private element = inject<ElementRef<HTMLElement>>(ElementRef);
  private dragAndDropService = inject(DragAndDropService);
  private dropList = inject(DropListDirective, { optional: true, skipSelf: true });

  constructor() {
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

    this.dragAndDropService.startDragging();
    this.setPointerDistanceFromBoundingRect(clientX, clientY);

    this.startPosition = {
      x: clientX - this.movePosition.x,
      y: clientY - this.movePosition.y,
    };

    const rootElement = this.getRootElement();

    if (this.dropList) {
      this.sourceDropList = this.dropList;
      this.preview = this.createPreview();
      this.anchor = this.renderer.createComment("");
      this.renderer.insertBefore(this.dropList.getRootElement(), this.anchor, rootElement);
      this.renderer.appendChild(this.document.body, this.preview);
      this.renderer.removeChild(this.dropList.getRootElement(), rootElement);
      this.dropList.startDraggingSequence(this);
    } else {
      this.renderer.setStyle(rootElement, "pointer-events", "none");
      this.renderer.setStyle(rootElement, "touch-action", "none");
      this.renderer.setStyle(rootElement, "user-select", "none");
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
        this.renderer.insertBefore(this.sourceDropList!.getRootElement(), this.getRootElement(), this.anchor);
        this.renderer.removeChild(this.sourceDropList!.getRootElement(), this.anchor);
        this.resetPosition();
        this.anchor = null;
        this.dropList!.drop(this.sourceDropList!);
        this.dropList = this.sourceDropList;
        this.dropList!.reset();
        this.resetPosition();
        this.dragAndDropService.stopDragging();
      });
    } else {
      this.dragAndDropService.stopDragging();
    }

    this.pointerMoveSubscription?.unsubscribe();
    this.pointerUpSubscription?.unsubscribe();
    this.scrollSubscription?.unsubscribe();
  }

  private onScroll() {
    const { x, y } = this.dragAndDropService.getLastPointerPosition()!;
    this.updateDropList(x, y);
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

  private cacheScrollableAncestors() {
    this.scrollableAncestors.clear();
    let currentElement: HTMLElement | null = this.dropList!.getRootElement();

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
      const placeholderRect: DOMRect = dropList.getPlaceholderRect()!;

      this.renderer.setStyle(visibleElement, "top", `${placeholderRect.top - this.dropList!.getHeightDiff()}px`);
      this.renderer.setStyle(visibleElement, "left", `${placeholderRect.left}px`);
      this.setPosition(
        elementRect.left - placeholderRect.left,
        elementRect.top - (placeholderRect.top - this.dropList!.getHeightDiff())
      );

      requestAnimationFrame(() => {
        this.renderer.setStyle(visibleElement, "transition", `transform ${ANIMATION_DURATION}ms`);
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
    const rootElement = this.getRootElement();
    const preview = rootElement.cloneNode(true) as HTMLElement;
    const { top, left } = rootElement.getBoundingClientRect();

    this.renderer.setStyle(preview, "position", "fixed");
    this.renderer.setStyle(preview, "z-index", "var(--z-index-draggable)");
    this.renderer.setStyle(preview, "top", `${top}px`);
    this.renderer.setStyle(preview, "left", `${left}px`);
    this.renderer.setStyle(preview, "pointer-events", "none");
    this.renderer.setStyle(preview, "touch-action", "none");
    this.renderer.setStyle(preview, "user-select", "none");

    return preview;
  }

  private destroyPreview() {
    this.preview?.remove();
    this.preview = null;
  }

  resetStyles() {
    const rootElement = this.getRootElement();

    this.renderer.removeStyle(rootElement, "transform");
    this.renderer.removeStyle(rootElement, "transition");

    if (!rootElement.attributes.getNamedItem("style")?.value.trim())
      this.renderer.removeAttribute(rootElement, "style");
  }

  private removeStyles(element: HTMLElement, styles: string[]) {
    for (const style of styles) this.renderer.removeStyle(element, style);
  }
}
