import { inject, Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, finalize, Observable, of, tap } from "rxjs";

import { toTranslationSignal } from "./translation-signal";

import type { Language, Translations, TranslationSignal } from "./types";

@Injectable({
  providedIn: "root",
})
export class TranslationService {
  readonly translations: TranslationSignal<Translations>;

  private readonly _translations = signal<Translations | undefined>(undefined);
  private readonly translationsCache: Map<Language, Translations> = new Map();
  private readonly currentLang = signal<Language>("en");
  private readonly loadingStatusSubject = new BehaviorSubject<boolean>(false);
  readonly loadingStatus$ = this.loadingStatusSubject.asObservable();

  private http = inject(HttpClient);

  constructor() {
    this.translations = toTranslationSignal(this._translations);
  }

  loadTranslations(language: Language): Observable<Translations | undefined> {
    if (this.translationsCache.has(language)) {
      const cachedTranslations = this.translationsCache.get(language);
      this._translations.set(cachedTranslations);
      return of(this._translations());
    }

    this.loadingStatusSubject.next(true);

    return this.http.get<Translations>(`assets/translations/${language}.json`).pipe(
      tap((translations) => {
        this.translationsCache.set(language, translations);
        this._translations.set(translations);
      }),
      finalize(() => {
        this.loadingStatusSubject.next(false);
      })
    );
  }

  setLanguage(language: Language) {
    this.loadTranslations(language).subscribe(() => {
      this.currentLang.set(language);
    });
  }

  getLanguage(): Language {
    return this.currentLang();
  }
}
