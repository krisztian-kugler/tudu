import {
  EnvironmentInjector,
  inject,
  Injectable,
  RendererFactory2,
  runInInjectionContext,
  signal,
  WritableSignal,
} from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { DOCUMENT } from "@angular/common";
import { BehaviorSubject, filter, finalize, Observable, of, switchMap, tap } from "rxjs";

import { BrowserStorageService, StorageKey } from "src/app/services/browser-storage/browser-storage.service";
import { toTranslationSignal } from "./translation-signal";
import { getTranslation, interpolate } from "./translation-utils";

import type { Language, TranslationKeys } from "./types";

type TranslationConfig<Translations extends Record<string, unknown>> = {
  availableLanguages: Language[];
  initialLanguage?: Language;
  loadTranslations: (_: Language) => Observable<Translations>;
};

class BaseTranslationService<Translations extends Record<string, unknown>> {
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly browserStorageService = inject(BrowserStorageService);
  private readonly renderer = this.rendererFactory.createRenderer(null, null);
  private readonly _translations = signal<Translations | undefined>(undefined);
  private readonly translationsCache: Map<Language, Translations> = new Map();
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly availableLanguages: Language[] = [];
  readonly language: WritableSignal<Language>;
  readonly translations = toTranslationSignal(this._translations);
  readonly loading$ = this.loadingSubject.asObservable();

  constructor(readonly config: TranslationConfig<Translations>) {
    this.availableLanguages = config.availableLanguages;
    this.language = signal(config.initialLanguage ?? this.getDefaultLanguage());

    toObservable(this.language)
      .pipe(
        filter((language) => this.availableLanguages.includes(language)),
        tap((language) => {
          this.renderer.setAttribute(this.document.documentElement, "lang", language);
          this.browserStorageService.set(StorageKey.Language, language);
        }),
        switchMap((language) => {
          if (this.translationsCache.has(language)) return of(this.translationsCache.get(language) as Translations);

          this.loadingSubject.next(true);

          return runInInjectionContext(this.injector, () => config.loadTranslations(language)).pipe(
            tap((translations) => {
              this.translationsCache.set(language, translations);
            }),
            finalize(() => this.loadingSubject.next(false))
          );
        })
      )
      .subscribe(this._translations.set);
  }

  setLanguage(language: Language) {
    this.language.set(language);
  }

  translate(key: TranslationKeys<Translations>, interpolateParams?: Record<string, unknown>) {
    const value = getTranslation(this.translations(), key);
    return interpolate(value, interpolateParams);
  }

  private getDefaultLanguage(): Language {
    const storedLanguage = this.browserStorageService.get<Language>(StorageKey.Language);

    if (storedLanguage && this.availableLanguages.includes(storedLanguage)) return storedLanguage;

    const browserLanguage = navigator.language.split("-")[0] as Language;

    if (this.availableLanguages.includes(browserLanguage)) return browserLanguage;

    return "en";
  }
}

export const createTranslationService = <Translations extends Record<string, unknown>>(
  config: TranslationConfig<Translations>
) => {
  @Injectable({
    providedIn: "root",
  })
  class TranslationService extends BaseTranslationService<Translations> {
    constructor() {
      super(config);
    }
  }

  return TranslationService;
};
