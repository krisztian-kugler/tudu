import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, Renderer2 } from "@angular/core";
import { BehaviorSubject, tap } from "rxjs";

import { BrowserStorageService, StorageKey } from "../browser-storage/browser-storage.service";

export type Theme = "light" | "dark";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  theme$ = new BehaviorSubject<Theme>(this.browserStorageService.get<Theme>(StorageKey.Theme) || "light");

  private applyTheme$ = this.theme$.pipe(
    tap((value) => {
      this.renderer.setAttribute(this.document.documentElement, "data-theme", value);
      this.browserStorageService.set(StorageKey.Theme, value);
    })
  );

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private browserStorageService: BrowserStorageService
  ) {
    this.applyTheme$.subscribe();
  }

  toggle() {
    this.theme$.next(this.theme$.value === "light" ? "dark" : "light");
  }
}
