import { ChangeDetectionStrategy, Component, HostBinding, booleanAttribute, input } from "@angular/core";

import { IconComponent } from "../icon/icon.component";
import { SpinnerComponent } from "../spinner/spinner.component";

import type { IconName } from "src/provide-icons";

type ButtonVariant = "primary" | "secondary" | "tertiary";

@Component({
  selector: "button [tudu-button]",
  standalone: true,
  imports: [IconComponent, SpinnerComponent],
  templateUrl: "./button.component.html",
  styleUrl: "./button.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  variant = input<ButtonVariant>("primary");
  leadingIcon = input<IconName>();
  trailingIcon = input<IconName>();
  disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  loading = input<boolean, unknown>(false, { transform: booleanAttribute });

  @HostBinding("disabled") get disabledState(): boolean {
    return this.disabled();
  }

  @HostBinding("class") get variantClass(): ButtonVariant {
    return this.variant();
  }
}
