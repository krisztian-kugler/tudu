import { ChangeDetectionStrategy, Component, HostBinding, input } from "@angular/core";

import { IconComponent } from "../icon/icon.component";
import { IconName } from "src/provide-icons";

type ButtonVariant = "primary" | "secondary" | "tertiary";

@Component({
  selector: "button [tudu-button]",
  standalone: true,
  imports: [IconComponent],
  templateUrl: "./button.component.html",
  styleUrl: "./button.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  variant = input<ButtonVariant>("primary");
  leadingIcon = input<IconName>();
  trailingIcon = input<IconName>();
  disabled = input<boolean>(false);
  loading = input<boolean>(false);

  @HostBinding("disabled") get disabledState() {
    return this.disabled();
  }

  @HostBinding("class") get variantClass() {
    return this.variant();
  }
}
