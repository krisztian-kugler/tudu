import { DOCUMENT } from "@angular/common";
import {
  ApplicationRef,
  ComponentRef,
  Inject,
  Injectable,
  RendererFactory2,
  TemplateRef,
  createComponent,
  inject,
} from "@angular/core";

import { NotificationComponent } from "src/app/components/notification/notification.component";

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly renderer = this.rendererFactory.createRenderer(null, null);

  private notificationComponent: ComponentRef<NotificationComponent> | null = null;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private application: ApplicationRef
  ) {}

  create(contentTemplate: string | TemplateRef<any>) {
    let projectableNodes: Node[][];

    if (typeof contentTemplate === "string") {
      const text = this.renderer.createText(contentTemplate);
      projectableNodes = [[text]];
    } else {
      const contentView = contentTemplate.createEmbeddedView(null);
      projectableNodes = [contentView.rootNodes];
    }

    this.notificationComponent = createComponent(NotificationComponent, {
      environmentInjector: this.application.injector,
      projectableNodes,
    });

    this.application.attachView(this.notificationComponent.hostView);

    this.renderer.appendChild(this.document.body, this.notificationComponent.location.nativeElement);
  }

  destroy() {
    this.notificationComponent?.destroy();
    this.notificationComponent = null;
  }
}
