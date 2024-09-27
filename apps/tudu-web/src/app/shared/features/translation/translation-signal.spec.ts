import { getNestedValue } from "./translation-signal";

describe("getNestedValue", () => {
  it("should return the nested value from an object", () => {
    const obj = {
      a: {
        b: {
          c: "value",
        },
      },
    };

    expect(getNestedValue(obj, ["a", "b", "c"])).toBe("value");
  });
});
