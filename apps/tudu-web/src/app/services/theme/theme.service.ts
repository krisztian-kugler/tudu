import { inject, Injectable, RendererFactory2 } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { BehaviorSubject } from "rxjs";

import { BrowserStorageService, StorageKey } from "../browser-storage/browser-storage.service";

export type Theme = "light" | "dark";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly browserStorageService = inject(BrowserStorageService);
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly renderer = this.rendererFactory.createRenderer(null, null);
  private readonly themeSubject = new BehaviorSubject<Theme>(
    this.browserStorageService.get<Theme>(StorageKey.Theme) || "light"
  );

  readonly theme$ = this.themeSubject.asObservable();

  constructor() {
    this.themeSubject.subscribe((value) => {
      this.renderer.setAttribute(this.document.documentElement, "data-theme", value);
      this.browserStorageService.set(StorageKey.Theme, value);
    });
  }

  toggle() {
    this.themeSubject.next(this.themeSubject.value === "light" ? "dark" : "light");
  }
}
