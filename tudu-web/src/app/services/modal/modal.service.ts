import { DOCUMENT } from "@angular/common";
import {
  ApplicationRef,
  ComponentRef,
  Inject,
  Injectable,
  Renderer2,
  TemplateRef,
  createComponent,
} from "@angular/core";
import { Subject } from "rxjs";

import { ModalComponent } from "src/app/components/modal/modal.component";

type ModalOptions = {
  title?: string;
};

@Injectable({
  providedIn: "root",
})
export class ModalService {
  private modalNotifier$?: Subject<string>;

  private modalComponent: ComponentRef<ModalComponent> | null = null;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private application: ApplicationRef,
    private renderer: Renderer2
  ) {}

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

    this.modalComponent.instance.title = options?.title;
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
