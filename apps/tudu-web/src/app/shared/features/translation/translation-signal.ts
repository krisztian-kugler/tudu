import { computed } from "@angular/core";

import type { Signal } from "@angular/core";
import type { TranslationSignal } from "./types";

export const getNestedValue = <T extends Record<string, unknown> | undefined>(obj: T, path: string[]): unknown =>
  path.reduce<unknown>((acc, pathSegment) => acc && (acc as any)[pathSegment], obj);

export const getTranslation = <T extends Record<string, unknown> | undefined>(translations: T, key: string): string =>
  String(getNestedValue(translations, key.split("_")));

export const interpolate = (value: string, params?: Record<string, unknown>): string => {
  if (!params || !Object.keys(params).length) return value;

  const placeholderRegex = /\{\{\s*([\w.]+)\s*\}\}/g;

  let match: RegExpExecArray | null;
  let result: string = "";
  let lastIndex: number = 0;

  while ((match = placeholderRegex.exec(value))) {
    const [placeholder, key] = match;
    const nestedValue = getNestedValue(params, key.split("."));
    result += value.slice(lastIndex, match.index) + (nestedValue ?? placeholder);
    lastIndex = match.index + placeholder.length;
  }

  return (result += value.slice(lastIndex));
};

export const toTranslationSignal = <T extends Record<string, unknown>>(
  signal: Signal<T | undefined>
): TranslationSignal<T> =>
  new Proxy(signal, {
    get(target: Signal<T | undefined> & T, prop: string) {
      if (prop in target) return target[prop];

      if (typeof prop !== "string") return undefined;

      const valueSignal = computed(() => getTranslation(target(), prop));
      const getValue = Object.assign(
        (interpolateParams: Record<string, unknown> | undefined) =>
          interpolateParams ? interpolate(valueSignal(), interpolateParams) : valueSignal(),
        valueSignal
      );
      Object.defineProperty(target, prop, { value: getValue });

      return getValue;
    },
  }) as TranslationSignal<T>;
