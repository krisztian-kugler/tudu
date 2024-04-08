import {
  AfterContentInit,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  Output,
  QueryList,
  Renderer2,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Subscription } from "rxjs";

import { DraggableDirective } from "../draggable/draggable.directive";
import { moveItemInArray } from "src/utils/array";

type Sign = 1 | -1;

type Position = {
  x: number;
  y: number;
};

type DropEvent = {
  fromIndex: number;
  toIndex: number;
};

type Flow = "row" | "column";

@Directive({
  selector: "[tuduDropList]",
  standalone: true,
})
export class DropListDirective implements AfterContentInit {
  @ContentChildren(DraggableDirective) private draggables?: QueryList<DraggableDirective>;

  @Input({ alias: "tuduDropListFlow" }) @HostBinding("style.gridAutoFlow") flow: Flow = "row";
  @Input({ alias: "tuduDropListGap" }) @HostBinding("style.gap.px") gap: number = 8;
  @Input({ alias: "tuduDropListAnimationDuration" }) animationDuration: number = 200;

  @Output("tuduDropListDrop") drop = new EventEmitter<DropEvent>();

  private activeDraggable?: DraggableDirective;
  private draggingTracker: DraggableDirective[] = [];
  private fromIndex: number = NaN;
  private toIndex: number = NaN;
  private listeners: (() => void)[] = [];
  private subscriptions: Subscription[] = [];
  private toPlaceholder?: HTMLElement;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private host: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  private createPlaceholder(draggable: DraggableDirective): HTMLElement {
    const { tagName, offsetWidth, offsetHeight } = draggable.host.nativeElement;
    const element = this.renderer.createElement(tagName) as HTMLElement;
    this.renderer.setStyle(element, "width", `${offsetWidth}px`);
    this.renderer.setStyle(element, "height", `${offsetHeight}px`);
    this.renderer.setStyle(element, "pointer-events", `none`);
    this.renderer.setStyle(element, "position", `relative`);
    this.renderer.setStyle(element, "z-index", 1);
    return element;
  }

  private getHeightOffset(startIndex: number, endIndex: number): number {
    return (
      this.draggingTracker
        .slice(startIndex, endIndex)
        .reduce((height, { host }) => (height += host.nativeElement.offsetHeight), 0) +
      (endIndex - startIndex) * this.gap
    );
  }

  private getPositionOffset(sign: Sign = 1): Position {
    return this.activeDraggable
      ? {
          x: this.flow === "row" ? 0 : sign * (this.activeDraggable.host.nativeElement.offsetWidth + this.gap),
          y: this.flow === "row" ? sign * (this.activeDraggable.host.nativeElement.offsetHeight + this.gap) : 0,
        }
      : { x: 0, y: 0 };
  }

  private onPointerEnter(draggable: DraggableDirective) {
    const newToIndex = this.draggingTracker.findIndex((item) => item === draggable);
    moveItemInArray(this.draggingTracker, this.toIndex, newToIndex);
    this.toIndex = newToIndex;
    console.log("fromIndex: " + this.fromIndex, "toIndex: " + this.toIndex);

    if (this.toIndex > this.fromIndex) {
      const offset = this.getHeightOffset(this.fromIndex, this.toIndex);
      this.renderer.setStyle(this.toPlaceholder, "transform", `translateY(${offset}px)`);
    } else if (this.toIndex < this.fromIndex) {
      const offset = this.getHeightOffset(this.toIndex, this.fromIndex);
      this.renderer.setStyle(this.toPlaceholder, "transform", `translateY(-${offset}px)`);
    } else {
      this.renderer.removeStyle(this.toPlaceholder, "transform");
    }

    this.draggingTracker.forEach((item, index) => {
      if (this.toIndex > this.fromIndex) {
        if (index >= this.fromIndex && index < this.toIndex) item.movePosition = this.getPositionOffset(-1);
        else item.resetPosition();
      } else if (this.toIndex < this.fromIndex) {
        if (index > this.toIndex && index <= this.fromIndex) item.movePosition = this.getPositionOffset(1);
        else item.resetPosition();
      } else {
        item.resetPosition();
      }
    });

    // if (draggableHost.compareDocumentPosition(itemHost) & Node.DOCUMENT_POSITION_FOLLOWING)
  }

  private onDragStart(draggable: DraggableDirective) {
    this.activeDraggable = draggable;
    const draggableHost = draggable.host.nativeElement;
    const { top, left } = draggableHost.getBoundingClientRect();
    this.renderer.setStyle(draggableHost, "position", "fixed");
    this.renderer.setStyle(draggableHost, "z-index", "var(--z-index-draggable)");
    this.renderer.setStyle(draggableHost, "top", `${top}px`);
    this.renderer.setStyle(draggableHost, "left", `${left}px`);

    this.draggingTracker = this.draggables?.toArray() || [];
    this.fromIndex = this.draggingTracker.indexOf(draggable);
    this.toIndex = this.fromIndex;

    this.toPlaceholder = this.createPlaceholder(draggable);
    this.renderer.insertBefore(this.host.nativeElement, this.toPlaceholder, draggableHost);
    this.renderer.appendChild(this.document.body, draggableHost);

    this.draggables?.forEach((item) => {
      if (item !== draggable) {
        requestAnimationFrame(() =>
          this.renderer.setStyle(item.host.nativeElement, "transition", `transform ${this.animationDuration}ms`)
        );
      }
    });

    this.listeners.push(
      this.renderer.listen(
        this.document.body,
        "pointermove",
        (
          (element?: HTMLElement) =>
          ({ target }) => {
            if (target === draggableHost || target === element) return;
            element = target;
            const movingOverDraggable = this.draggables?.find(({ host }) => host.nativeElement === target);
            if (movingOverDraggable) this.onPointerEnter(movingOverDraggable);
          }
        )()
      )
    );
  }

  private onDragEnd(draggable: DraggableDirective) {
    const draggableHost: HTMLElement = draggable.host.nativeElement;
    const draggableHostRect: DOMRect = draggableHost.getBoundingClientRect();
    const toElementRect: DOMRect = this.toPlaceholder!.getBoundingClientRect();
    const topDiff: number = draggableHostRect.top - toElementRect.top;
    const leftDiff: number = draggableHostRect.left - toElementRect.left;

    this.renderer.setStyle(draggableHost, "position", "relative");
    this.renderer.removeStyle(draggableHost, "top");
    this.renderer.removeStyle(draggableHost, "left");
    this.renderer.appendChild(this.toPlaceholder, draggableHost);

    this.listeners.forEach((unlisten) => unlisten());
    this.listeners = [];
    draggable.movePosition = { x: leftDiff, y: topDiff };

    requestAnimationFrame(() => {
      this.renderer.removeStyle(draggableHost, "transform");
      draggable.resetPosition();
      this.renderer.setStyle(draggableHost, "transition", `transform ${this.animationDuration}ms`);

      const transitionEndListener = this.renderer.listen(draggableHost, "transitionend", () => {
        transitionEndListener();
        ["position", "z-index", "transition"].forEach((prop) => this.renderer.removeStyle(draggableHost, prop));
        this.renderer.insertBefore(this.host.nativeElement, draggableHost, this.toPlaceholder);
        this.toPlaceholder?.remove();

        this.draggables?.forEach((item) => {
          this.renderer.removeStyle(item.host.nativeElement, "transform");
          this.renderer.removeStyle(item.host.nativeElement, "transition");
          item.resetPosition();
          if (!item.host.nativeElement.attributes.getNamedItem("style")?.value.trim())
            this.renderer.removeAttribute(item.host.nativeElement, "style");
        });
        this.drop.emit({ fromIndex: this.fromIndex, toIndex: this.toIndex });
      });
    });
  }

  ngAfterContentInit() {
    this.draggables?.changes.subscribe(() => {
      this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      this.subscriptions = [];

      this.draggables?.forEach((draggable) => {
        this.subscriptions.push(
          draggable.dragStart.subscribe(() => this.onDragStart(draggable)),
          draggable.dragEnd.subscribe(() => this.onDragEnd(draggable))
        );
      });
    });

    this.draggables?.notifyOnChanges();
  }
}
