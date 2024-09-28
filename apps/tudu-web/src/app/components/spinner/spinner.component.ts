import { ChangeDetectionStrategy, Component, HostBinding, input } from "@angular/core";

@Component({
  selector: "tudu-spinner",
  standalone: true,
  template: "",
  styleUrl: "./spinner.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  size = input<number>(24);
  thickness = input<number>(4);
  color = input<string>("yellow");
  duration = input<number>(500);

  @HostBinding("style.--size") get sizeValue(): string {
    return this.size() + "px";
  }

  @HostBinding("style.--thickness") get thicknessValue(): string {
    return this.thickness() + "px";
  }

  @HostBinding("style.--color") get colorValue(): string {
    return this.color();
  }

  @HostBinding("style.--duration") get durationValue(): string {
    return this.duration() + "ms";
  }
}
