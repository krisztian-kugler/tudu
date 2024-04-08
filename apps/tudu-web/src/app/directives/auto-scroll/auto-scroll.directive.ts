import { Directive, ElementRef, Input, Renderer2, booleanAttribute } from "@angular/core";

const directiveName = "tuduAutoScroll";

@Directive({
  selector: `[${directiveName}]`,
  standalone: true,
})
export class AutoScrollDirective {
  @Input({ alias: directiveName, transform: booleanAttribute }) set active(value: boolean) {
    if (value)
      this.listeners.push(this.renderer.listen(this.host.nativeElement, "pointermove", this.onPointerMove.bind(this)));
    else {
      this.listeners.forEach((unlisten) => unlisten());
      this.listeners = [];
      this.scrollOptions = {};
      clearInterval(this.interval);
    }
  }

  @Input({ alias: `${directiveName}Threshold` }) threshold: number = 0.25;

  @Input({ alias: `${directiveName}Unit` }) unit: number = 1;

  @Input({ alias: `${directiveName}SpeedZones` }) speedZones: number = 1;

  private scrollOptions: Pick<ScrollToOptions, "top" | "left"> = {};
  private listeners: (() => void)[] = [];
  private interval?: ReturnType<typeof setInterval>;

  constructor(
    private host: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  private onPointerMove(event: PointerEvent) {
    const scrollOptions = this.getScrollOptions(event);

    if (scrollOptions.top !== this.scrollOptions.top || scrollOptions.left !== this.scrollOptions.left) {
      this.scrollOptions = scrollOptions;
      clearInterval(this.interval);

      if (this.scrollOptions.top || this.scrollOptions.left)
        this.interval = setInterval(() => this.host.nativeElement.scrollBy(this.scrollOptions), 1000 / 60);
    }
  }

  private getScrollValue(thresholdSize: number, distanceFromThresholdBoundary: number): number {
    return (Math.floor(distanceFromThresholdBoundary / Math.ceil(thresholdSize / this.speedZones)) + 1) * this.unit;
  }

  private getScrollOptions({ clientX, clientY }: PointerEvent): Pick<ScrollToOptions, "top" | "left"> {
    const hostRect: DOMRect = this.host.nativeElement.getBoundingClientRect();

    const thresholdWidth = hostRect.width * this.threshold;
    const thresholdHeight = hostRect.height * this.threshold;

    const top = hostRect.top + thresholdHeight;
    const bottom = hostRect.bottom - thresholdHeight;
    const left = hostRect.left + thresholdWidth;
    const right = hostRect.right - thresholdWidth;

    if (clientY <= top) {
      const speedMultiplierY = this.getScrollValue(thresholdHeight, top - clientY);

      if (clientX <= left)
        return {
          top: -speedMultiplierY,
          left: -this.getScrollValue(thresholdWidth, left - clientX),
        };

      if (clientX >= right)
        return {
          top: -speedMultiplierY,
          left: this.getScrollValue(thresholdWidth, clientX - right),
        };

      return {
        top: -speedMultiplierY,
      };
    }

    if (clientY >= bottom) {
      const speedMultiplierY = this.getScrollValue(thresholdHeight, clientY - bottom);

      if (clientX <= left)
        return {
          top: speedMultiplierY,
          left: -this.getScrollValue(thresholdWidth, left - clientX),
        };

      if (clientX >= right)
        return {
          top: speedMultiplierY,
          left: this.getScrollValue(thresholdWidth, clientX - right),
        };

      return {
        top: speedMultiplierY,
      };
    }

    if (clientX <= left)
      return {
        left: -this.getScrollValue(thresholdWidth, left - clientX),
      };

    if (clientX >= right)
      return {
        left: this.getScrollValue(thresholdWidth, clientX - right),
      };

    return {};
  }
}
