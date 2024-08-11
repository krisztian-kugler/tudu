export const getElementSizeWithMargins = (element: HTMLElement): { width: number; height: number } => {
  const { width, height } = element.getBoundingClientRect();
  const { marginLeft, marginRight, marginTop, marginBottom } = window.getComputedStyle(element);

  return {
    width: width + parseFloat(marginLeft) + parseFloat(marginRight),
    height: height + parseFloat(marginTop) + parseFloat(marginBottom),
  };
};

export const getRelativeRect = (element: HTMLElement): { top: number; bottom: number; left: number; right: number } => {
  const elementRect = element.getBoundingClientRect();
  const parentRect = element.parentElement!.getBoundingClientRect();

  return {
    top: elementRect.top - parentRect.top,
    right: elementRect.right - parentRect.right,
    bottom: elementRect.bottom - parentRect.bottom,
    left: elementRect.left - parentRect.left,
  };
};

export const shiftDomRectBy = (rect: DOMRect, { x, y }: { x: number; y: number }): DOMRect => {
  return {
    top: rect.top + y,
    bottom: rect.bottom + y,
    left: rect.left + x,
    right: rect.right + x,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
  } as DOMRect;
};

export const isPointerNearDomRect = (rect: DOMRect, threshold: number, pointerX: number, pointerY: number): boolean => {
  const { top, right, bottom, left, width, height } = rect;
  const xThreshold = width * threshold;
  const yThreshold = height * threshold;

  return (
    (pointerY < top + yThreshold && pointerY > top) ||
    (pointerY > bottom - yThreshold && pointerY < bottom) ||
    (pointerX < left + xThreshold && pointerX > left) ||
    (pointerX > right - xThreshold && pointerX < right)
  );
};

export const getElementScrollDirection = (
  rect: DOMRect,
  threshold: number,
  pointerX: number,
  pointerY: number
): ScrollDirection => {
  const { top, right, bottom, left, width, height } = rect;
  const XThreshold = width * threshold;
  const YThreshold = height * threshold;

  if (pointerY >= top && pointerY <= top + YThreshold) {
    if (pointerX >= left && pointerX <= left + XThreshold) return ScrollDirection.TOP_LEFT;
    if (pointerX <= right && pointerX >= right - XThreshold) return ScrollDirection.TOP_RIGHT;
    return ScrollDirection.TOP;
  }

  if (pointerY >= bottom - YThreshold && pointerY <= bottom) {
    if (pointerX >= left && pointerX <= left + XThreshold) return ScrollDirection.BOTTOM_LEFT;
    if (pointerX <= right && pointerX >= right - XThreshold) return ScrollDirection.BOTTOM_RIGHT;
    return ScrollDirection.BOTTOM;
  }

  if (pointerX >= left && pointerX <= left + XThreshold) return ScrollDirection.LEFT;
  if (pointerX >= right - XThreshold && pointerX <= right) return ScrollDirection.RIGHT;

  return ScrollDirection.NONE;
};

export enum ScrollDirection {
  NONE,
  TOP,
  TOP_RIGHT,
  RIGHT,
  BOTTOM_RIGHT,
  BOTTOM,
  BOTTOM_LEFT,
  LEFT,
  TOP_LEFT,
}
