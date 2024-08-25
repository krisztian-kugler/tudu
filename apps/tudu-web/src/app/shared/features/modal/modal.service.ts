import { DOCUMENT } from "@angular/common";
import {
  ApplicationRef,
  ComponentRef,
  Injectable,
  Renderer2,
  TemplateRef,
  createComponent,
  inject,
} from "@angular/core";
import { Subject } from "rxjs";

import { ModalComponent } from "./modal.component";

type ModalOptions = {
  title?: string;
};

@Injectable({
  providedIn: "root",
})
export class ModalService {
  private modalNotifier$?: Subject<string>;
  private modalComponent: ComponentRef<ModalComponent> | null = null;

  private document = inject(DOCUMENT);
  private application = inject(ApplicationRef);
  private renderer = inject(Renderer2);

  open(contentTemplate: TemplateRef<any>, options?: ModalOptions) {
    if (this.modalComponent)
      return console.warn(
        "Stacked modals are not allowed. Please close the existing modal first before opening a new one."
      );

    const contentView = contentTemplate.createEmbeddedView(null);

    this.modalComponent = createComponent(ModalComponent, {
      environmentInjector: this.application.injector,
      projectableNodes: [contentView.rootNodes],
    });

    if (options?.title) this.modalComponent.setInput("title", options.title);

    this.modalComponent.instance.closeStartEvent.subscribe(() => this.close());
    this.modalComponent.instance.closeEndEvent.subscribe(() => this.destroy());

    this.application.attachView(this.modalComponent.hostView);

    this.renderer.appendChild(this.document.body, this.modalComponent.location.nativeElement);

    this.modalNotifier$ = new Subject();

    return this.modalNotifier$.asObservable();
  }

  close() {
    this.modalComponent?.changeDetectorRef.detach();
    this.modalNotifier$?.complete();
  }

  private destroy() {
    this.modalComponent?.destroy();
    this.modalComponent = null;
  }
}
