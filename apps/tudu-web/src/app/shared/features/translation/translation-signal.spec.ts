import { signal } from "@angular/core";

import { toTranslationSignal } from "./translation-signal";

describe("toTranslationSignal", () => {
  const translations = {
    a: "value A",
    b: {
      c: "value C",
      d: {
        e: "value E",
        f: "value F {{ data }}",
      },
    },
  };

  it("should generate signals for each key", () => {
    const originalSignal = signal(translations);
    const translationSignal = toTranslationSignal(originalSignal);

    expect(translationSignal.name).toBe(originalSignal.name);
    expect(translationSignal()).toBe(translations);
    expect(translationSignal.a()).toBe("value A");
    expect(translationSignal.b_c()).toBe("value C");
    expect(translationSignal.b_d_e()).toBe("value E");
  });

  it("should return the key for unknown keys", () => {
    const originalSignal = signal(translations);
    const translationSignal = toTranslationSignal(originalSignal) as any;

    expect(translationSignal.unknown_key()).toBe("unknown_key");
  });

  it("should return undefined for unknown keys with wrong type", () => {
    const originalSignal = signal(translations);
    const translationSignal = toTranslationSignal(originalSignal) as any;

    expect(translationSignal[Symbol()]).toBeUndefined();
  });

  it("should not generate a new signal for an existing key", () => {
    const originalSignal = signal(translations);
    const translationSignal = toTranslationSignal(originalSignal);

    const a1 = translationSignal.a;
    const a2 = translationSignal.a;

    expect(a1).toBe(a2);
  });

  it("should interpolate values", () => {
    const originalSignal = signal(translations);
    const translationSignal = toTranslationSignal(originalSignal);

    const interpolateSpy = jest.spyOn(jest.requireActual("./translation-utils"), "interpolate");
    const params = { data: "interpolated" };

    expect(translationSignal.b_d_f(params)).toBe("value F interpolated");
    expect(interpolateSpy).toHaveBeenCalledWith(translations.b.d.f, params);
  });
});
