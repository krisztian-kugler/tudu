import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  Renderer2,
  viewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";

import { IconComponent } from "../icon/icon.component";

@Component({
  selector: "tudu-modal",
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: "./modal.component.html",
  styleUrls: ["./modal.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  title = input<string>();

  closeStartEvent = output<ModalComponent>();
  closeEndEvent = output<ModalComponent>();

  modal = viewChild<ElementRef<HTMLDivElement>>("modal");

  constructor(
    private host: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  @HostListener("click", ["$event"]) onBackdropClick({ target }: MouseEvent) {
    if ((target as HTMLElement).contains(this.host.nativeElement)) this.close();
  }

  @HostListener("animationend", ["$event"]) onFadeOutEnd(event: AnimationEvent) {
    if (event.target === this.host.nativeElement && this.host.nativeElement.classList.contains("fadeOut"))
      this.closeEndEvent.emit(this);
  }

  close() {
    this.closeStartEvent.emit(this);
    this.renderer.addClass(this.host.nativeElement, "fadeOut");
    this.renderer.addClass(this.modal()?.nativeElement, "zoomOut");
  }
}
