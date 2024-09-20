import { clamp } from "./number";

export const addItemToArrayMutable = <T>(arr: T[], item: T, index: number) => {
  const clampedIndex = clamp(index, 0, arr.length);

  arr.splice(clampedIndex, 0, item);
};

export const addItemToArrayImmutable = <T>(arr: T[], item: T, index: number): T[] => {
  const clampedIndex = clamp(index, 0, arr.length);

  return [...arr.slice(0, clampedIndex), item, ...arr.slice(clampedIndex)];
};

export const removeItemFromArrayMutable = <T>(arr: T[], index: number) => {
  const clampedIndex = clamp(index, 0, arr.length - 1);

  arr.splice(clampedIndex, 1);
};

export const removeItemFromArrayImmutable = <T>(arr: T[], index: number): T[] => {
  const clampedIndex = clamp(index, 0, arr.length - 1);

  return arr.filter((_, i) => i !== clampedIndex);
};

export const moveItemInArrayMutable = <T>(arr: T[], sourceIndex: number, targetIndex: number) => {
  const clampedSourceIndex = clamp(sourceIndex, 0, arr.length - 1);
  const clampedTargetIndex = clamp(targetIndex, 0, arr.length - 1);

  if (sourceIndex === targetIndex) return;

  const itemToMove = arr.splice(clampedSourceIndex, 1)[0];
  arr.splice(clampedTargetIndex, 0, itemToMove);
};

export const moveItemInArrayImmutable = <T>(arr: T[], sourceIndex: number, targetIndex: number): T[] => {
  const clampedSourceIndex = clamp(sourceIndex, 0, arr.length - 1);
  const clampedTargetIndex = clamp(targetIndex, 0, arr.length - 1);

  if (sourceIndex === targetIndex) return arr;

  const newArr = [...arr];
  const [item] = newArr.splice(clampedSourceIndex, 1);
  newArr.splice(clampedTargetIndex, 0, item);

  return newArr;
};

export const transferItemBetweenArrays = <T>(
  sourceArr: T[],
  targetArr: T[],
  sourceIndex: number,
  targetIndex: number
) => {
  const clampedSourceIndex = clamp(sourceIndex, 0, sourceArr.length - 1);
  const clampedTargetIndex = clamp(targetIndex, 0, targetArr.length);

  if (sourceArr.length) targetArr.splice(clampedTargetIndex, 0, sourceArr.splice(clampedSourceIndex, 1)[0]);
};
