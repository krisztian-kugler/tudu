export const moveItemInArray = <T>(arr: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) {
    console.error("Invalid index");
    return arr;
  }
  const itemToMove = arr.splice(fromIndex, 1)[0];
  arr.splice(toIndex, 0, itemToMove);
  return arr;
};
