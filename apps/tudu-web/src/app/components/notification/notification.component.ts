import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CommonModule } from "@angular/common";

import { IconComponent } from "../icon/icon.component";

@Component({
  selector: "tudu-notification",
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: "./notification.component.html",
  styleUrl: "./notification.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  close() {}
}
