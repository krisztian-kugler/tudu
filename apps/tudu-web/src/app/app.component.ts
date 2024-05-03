import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";

import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { ThemeService } from "./services/theme/theme.service";
import { BrowserStorageService } from "./services/browser-storage/browser-storage.service";
import { ModalService } from "./services/modal/modal.service";
import { NotificationService } from "./services/notification/notification.service";

@Component({
  selector: "tudu-root",
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  providers: [ThemeService, BrowserStorageService, ModalService, NotificationService],
  template: `
    <tudu-sidebar />
    <header>Header</header>
    <router-outlet />
  `,
  styles: [
    `
      :host {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto 1fr;
        height: 100vh;
      }

      header {
        display: flex;
        align-items: center;
        height: 64px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor(translateService: TranslateService) {
    translateService.addLangs(["en"]);
    translateService.setDefaultLang("en");
    translateService.use("en");
  }
}
