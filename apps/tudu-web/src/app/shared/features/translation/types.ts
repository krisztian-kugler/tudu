import type { Signal } from "@angular/core";

import type translations from "../../../../assets/translations/en.json";

export type Translations = typeof translations;

export type Language = "en" | "hu";

export type TranslationKeys<T> = T extends object
  ? T extends Array<unknown> | Set<unknown> | Map<unknown, unknown> | Function
    ? never
    : {
        [K in keyof T]: K extends string ? (T[K] extends string ? K : `${K}_${TranslationKeys<T[K]>}`) : never;
      }[keyof T]
  : never;

export type TranslationSignal<T extends Record<string, unknown>> = {
  readonly [K in TranslationKeys<T>]: Signal<string> &
    ((interpolateParams: Record<string, unknown> | undefined) => string);
} & Signal<T>;
