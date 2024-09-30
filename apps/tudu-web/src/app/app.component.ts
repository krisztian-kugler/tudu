import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";

import { SidebarComponent } from "./components/sidebar/sidebar.component";

@Component({
  selector: "tudu-root",
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
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
export class AppComponent {}
