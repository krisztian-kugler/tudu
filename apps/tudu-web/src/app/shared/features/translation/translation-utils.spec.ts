import { getNestedValue, getTranslation, interpolate } from "./translation-utils";

describe("getNestedValue", () => {
  it("should return the nested value from an object at the given path", () => {
    const obj = {
      a: {
        b: {
          c: "value",
        },
      },
    };

    expect(getNestedValue(obj, ["a", "b", "c"])).toBe("value");
  });

  it("should return the nested falsy value from an object at the given path", () => {
    const obj = {
      a: {
        b: {
          c: 0,
          d: "",
          e: null,
          f: undefined,
          g: NaN,
        },
      },
    };

    expect(getNestedValue(obj, ["a", "b", "c"])).toBe(0);
    expect(getNestedValue(obj, ["a", "b", "d"])).toBe("");
    expect(getNestedValue(obj, ["a", "b", "e"])).toBe(null);
    expect(getNestedValue(obj, ["a", "b", "f"])).toBe(undefined);
    expect(getNestedValue(obj, ["a", "b", "g"])).toBe(NaN);
  });

  it("should return undefined if the given path doesn't exist within the object", () => {
    const obj = {
      a: {
        b: {
          c: "value",
          d: null,
        },
      },
    };

    expect(getNestedValue(obj, ["a", "b", "c", "x"])).toBe(undefined);
    expect(getNestedValue(obj, ["a", "b", "d", "x"])).toBe(undefined);
  });
});

describe("getTranslation", () => {
  it("should return the translated value for a given key", () => {
    const translations = {
      a: "value A",
      b: {
        c: "value C",
        d: {
          e: "value E",
        },
      },
    };

    expect(getTranslation(translations, "a")).toBe("value A");
    expect(getTranslation(translations, "b_c")).toBe("value C");
    expect(getTranslation(translations, "b_d_e")).toBe("value E");
  });

  it("should return the key if the translation is not found", () => {
    const translations = {};

    expect(getTranslation(translations, "a")).toBe("a");
    expect(getTranslation(translations, "a_b")).toBe("a_b");
  });
});

describe("interpolate", () => {
  it("should interpolate a string with a parameter", () => {
    const input = "Hello, {{ name }}!";
    const params = { name: "John" };
    const output = "Hello, John!";

    expect(interpolate(input, params)).toBe(output);
  });

  it("should interpolate a string with multiple parameters", () => {
    const input = "My name is {{ name }}, I am {{ age }} years old and I work as a {{ job }}.";
    const params = { name: "John", age: 30, job: "bus driver" };
    const output = "My name is John, I am 30 years old and I work as a bus driver.";

    expect(interpolate(input, params)).toBe(output);
  });

  it("should interpolate a string with a nested parameter", () => {
    const input = "Hello, {{ user.name }}!";
    const params = { user: { name: "John" } };
    const output = "Hello, John!";

    expect(interpolate(input, params)).toBe(output);
  });

  it("should interpolate a string with undefined if the key doesn't exist", () => {
    const input = "Hello, {{ user.name }}!";
    const params = { user: {} };
    const output = "Hello, undefined!";

    expect(interpolate(input, params)).toBe(output);
  });

  it("should return the original string if there are no params to interpolate", () => {
    const input = "Hello, {{ name }}!";
    const params = {};
    const output = "Hello, {{ name }}!";

    expect(interpolate(input, params)).toBe(output);
    expect(interpolate(input)).toBe(output);
  });
});
