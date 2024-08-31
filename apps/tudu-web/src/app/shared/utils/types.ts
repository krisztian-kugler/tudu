export type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

export type PickProperties<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
