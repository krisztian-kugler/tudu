import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
} from "@angular/core";

import { IconName, IconRegistry, Icons } from "src/provide-icons";

@Component({
  selector: "svg [tudu-icon]",
  standalone: true,
  template: "",
  styles: [
    `
      :host {
        display: inline-block;
        stroke: var(--color-text);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent implements OnChanges {
  @Input({ required: true }) name!: IconName;
  @Input() @HostBinding("style.width.px") @HostBinding("style.height.px") size: number = 24;

  @HostBinding("attr.xmlns") nameSpace: string = "http://www.w3.org/2000/svg";
  @HostBinding("attr.viewBox") viewBox: string | null = null;

  constructor(
    @Inject(Icons) private iconRegistry: IconRegistry,
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    const name = changes["name"].currentValue as IconName;
    const icon = this.iconRegistry[name];

    if (!icon) console.warn(`Icon not found: '${name}'. Make sure to add it to the icon registry.`);
    else {
      const div = this.renderer.createElement("div") as HTMLDivElement;
      this.renderer.setProperty(div, "innerHTML", icon);
      const svg = div.firstElementChild as SVGSVGElement;
      this.renderer.setProperty(this.elementRef.nativeElement, "innerHTML", svg.innerHTML);
      this.viewBox = svg.getAttribute("viewBox");
    }
  }
}
