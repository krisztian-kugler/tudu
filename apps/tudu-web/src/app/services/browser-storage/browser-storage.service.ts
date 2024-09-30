import { Injectable } from "@angular/core";

export enum StorageKey {
  Theme = "tudu_theme",
  SidebarAppearance = "tudu_sidebar_appearance",
  Language = "tudu_language",
}

@Injectable({
  providedIn: "root",
})
export class BrowserStorageService {
  get<T>(key: StorageKey) {
    return window.localStorage.getItem(key) as T | null;
  }

  set(key: StorageKey, value: string) {
    window.localStorage.setItem(key, value);
  }
}
