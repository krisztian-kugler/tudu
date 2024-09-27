import { ChangeDetectionStrategy, Component, HostBinding, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { IconComponent } from "../icon/icon.component";
import { IconName } from "src/provide-icons";
import { Theme, ThemeService } from "src/app/services/theme/theme.service";
import { SidebarButtonComponent } from "../sidebar-button/sidebar-button.component";
import { BrowserStorageService, StorageKey } from "src/app/services/browser-storage/browser-storage.service";

type SidebarAppearance = "default" | "compact";

type NavigationLink = {
  label: string;
  icon: IconName;
  path: string;
};

@Component({
  selector: "tudu-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, SidebarButtonComponent],
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @HostBinding("attr.data-appearance") appearance: SidebarAppearance = "default";
  @HostBinding("class.compact") compact: boolean = false;

  mapThemeToIcon: Record<Theme, IconName> = {
    light: "sun",
    dark: "moon",
  };

  navigationLinks: NavigationLink[] = [
    {
      label: "Home",
      icon: "home",
      path: "/home",
    },
    {
      label: "Board",
      icon: "trello",
      path: "/board",
    },
    {
      label: "Backlog",
      icon: "file-text",
      path: "/backlog",
    },
    {
      label: "Timeline",
      icon: "clock",
      path: "/timeline",
    },
    {
      label: "Calendar",
      icon: "calendar",
      path: "/calendar",
    },
  ];

  constructor(
    public themeService: ThemeService,
    private browserStorageService: BrowserStorageService
  ) {
    this.appearance = this.browserStorageService.get(StorageKey.SidebarAppearance) || "default";
    this.compact = this.appearance === "compact";
  }

  @HostListener("transitionstart", ["$event"]) onAppearanceChangeStart({ propertyName }: TransitionEvent) {
    if (propertyName === "width" && this.appearance === "default") this.compact = false;
  }

  @HostListener("transitionend", ["$event"]) onAppearanceChangeEnd({ propertyName }: TransitionEvent) {
    if (propertyName === "width" && this.appearance === "compact") this.compact = true;
  }

  toggleAppearance() {
    this.appearance = this.appearance === "default" ? "compact" : "default";
    this.browserStorageService.set(StorageKey.SidebarAppearance, this.appearance);
  }

  toggleUserMenu() {
    console.log("toggle user menu");
  }
}
