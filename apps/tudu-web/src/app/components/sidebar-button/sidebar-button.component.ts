import { ChangeDetectionStrategy, Component, HostBinding, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IconComponent } from "../icon/icon.component";
import { IconName } from "src/provide-icons";

@Component({
  selector: "[tudu-sidebar-button]",
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: "./sidebar-button.component.html",
  styleUrls: ["./sidebar-button.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarButtonComponent {
  @Input({ required: true }) icon!: IconName;
  @Input({ required: true }) label!: string;
  @Input("buttonTitle") title?: string;
  @Input() @HostBinding("class.compact") compact?: boolean;
}
