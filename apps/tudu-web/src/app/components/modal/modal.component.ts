import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  Renderer2,
  ViewChild,
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
  @Input() title?: string;

  @Output() closeStartEvent = new EventEmitter<ModalComponent>();
  @Output() closeEndEvent = new EventEmitter<ModalComponent>();

  @ViewChild("modal") modal?: ElementRef<HTMLDivElement>;

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
    this.closeStartEvent.emit();
    this.renderer.addClass(this.host.nativeElement, "fadeOut");
    this.renderer.addClass(this.modal?.nativeElement, "zoomOut");
  }
}
