import { ChangeDetectionStrategy, Component, TemplateRef } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ModalService } from "src/app/services/modal/modal.service";

@Component({
  selector: "tudu-home",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  constructor(private modalService: ModalService) {}

  openModal(contentTemplate: TemplateRef<any>) {
    this.modalService.open(contentTemplate, { title: "Modal title" });
  }
}
