import { ChangeDetectionStrategy, Component, TemplateRef } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ButtonComponent } from "../button/button.component";
import { NotificationService } from "src/app/services/notification/notification.service";
import { ModalService } from "src/app/shared/features/modal/modal.service";

@Component({
  selector: "tudu-home",
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  constructor(
    private modalService: ModalService,
    private notificationService: NotificationService
  ) {}

  openModal(contentTemplate: TemplateRef<any>) {
    this.modalService.open(contentTemplate, { title: "Modal title" });
  }

  openNotification(message: string | TemplateRef<any>) {
    this.notificationService.create(message);
  }
}
