import { computed } from "@angular/core";

import { getTranslation, interpolate } from "./translation-utils";

import type { Signal } from "@angular/core";
import type { TranslationSignal } from "./types";

export const toTranslationSignal = <T extends Record<string, unknown>>(
  signal: Signal<T | undefined>
): TranslationSignal<T> =>
  new Proxy(signal, {
    get(target: Signal<T | undefined> & T, prop: string) {
      if (prop in target) return target[prop];

      if (typeof prop !== "string") return undefined;

      const valueSignal = computed(() => getTranslation(target(), prop));
      const getValue = Object.assign(
        (interpolateParams?: Record<string, unknown>) => interpolate(valueSignal(), interpolateParams),
        valueSignal
      );
      Object.defineProperty(target, prop, { value: getValue });

      return getValue;
    },
  }) as TranslationSignal<T>;
