export const getNestedValue = <T extends Record<string, unknown> | undefined>(obj: T, path: string[]): unknown =>
  path.reduce<unknown>((acc, pathSegment) => (acc as any)?.[pathSegment], obj);

export const getTranslation = <T extends Record<string, unknown> | undefined>(translations: T, key: string): string =>
  String(getNestedValue(translations, key.split("_")) ?? key);

export const interpolate = (value: string, params?: Record<string, unknown>): string => {
  if (!params || !Object.keys(params).length) return value;

  const placeholderRegex = /\{\{\s*([\w.]+)\s*\}\}/g;

  let match: RegExpExecArray | null;
  let result: string = "";
  let lastIndex: number = 0;

  while ((match = placeholderRegex.exec(value))) {
    const [placeholder, key] = match;
    const nestedValue = getNestedValue(params, key.split("."));
    result += value.slice(lastIndex, match.index) + nestedValue;
    lastIndex = match.index + placeholder.length;
  }

  return (result += value.slice(lastIndex));
};
