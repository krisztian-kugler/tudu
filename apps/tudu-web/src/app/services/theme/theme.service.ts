import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, Renderer2 } from "@angular/core";
import { BehaviorSubject } from "rxjs";

import { BrowserStorageService, StorageKey } from "../browser-storage/browser-storage.service";

export type Theme = "light" | "dark";

const defaultTheme: Theme = "light";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  public themeChange$ = new BehaviorSubject<Theme>(this.theme);

  private _theme: Theme = defaultTheme;

  private get theme(): Theme {
    return this._theme;
  }

  private set theme(value: Theme) {
    this._theme = value;
    this.renderer.setAttribute(this.document.documentElement, "data-theme", value);
    this.themeChange$.next(value);
    this.browserStorageService.set(StorageKey.Theme, value);
  }

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private browserStorageService: BrowserStorageService
  ) {
    const storedTheme = this.browserStorageService.get<Theme>(StorageKey.Theme);
    this.theme = storedTheme || defaultTheme;
  }

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light";
  }
}
