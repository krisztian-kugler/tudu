import type { MutableDOMRect } from "./types";

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

export const ANIMATION_DURATION = 5000;

export const getMutableClientRect = (element: Element): MutableDOMRect => {
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
  };
};

export const getElementSizeWithMargins = (element: HTMLElement): { width: number; height: number } => {
  const { width, height } = element.getBoundingClientRect();
  const { marginLeft, marginRight, marginTop, marginBottom } = window.getComputedStyle(element);

  return {
    width: width + parseFloat(marginLeft) + parseFloat(marginRight),
    height: height + parseFloat(marginTop) + parseFloat(marginBottom),
  };
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

export const getScrollToOptions = (scrollDirection: ScrollDirection, autoScrollStep: number): ScrollToOptions => {
  switch (scrollDirection) {
    case ScrollDirection.TOP:
      return { left: 0, top: -autoScrollStep };
    case ScrollDirection.TOP_RIGHT:
      return { left: autoScrollStep, top: -autoScrollStep };
    case ScrollDirection.RIGHT:
      return { left: autoScrollStep, top: 0 };
    case ScrollDirection.BOTTOM_RIGHT:
      return { left: autoScrollStep, top: autoScrollStep };
    case ScrollDirection.BOTTOM:
      return { left: 0, top: autoScrollStep };
    case ScrollDirection.BOTTOM_LEFT:
      return { left: -autoScrollStep, top: autoScrollStep };
    case ScrollDirection.LEFT:
      return { left: -autoScrollStep, top: 0 };
    case ScrollDirection.TOP_LEFT:
      return { left: -autoScrollStep, top: -autoScrollStep };
    default:
      return { left: 0, top: 0 };
  }
};

export const canScroll = (element: HTMLElement, direction: ScrollDirection): boolean => {
  const { scrollTop, scrollLeft, scrollWidth, scrollHeight, clientWidth, clientHeight } = element;

  switch (direction) {
    case ScrollDirection.TOP:
      return scrollTop > 0;
    case ScrollDirection.TOP_RIGHT:
      return scrollTop > 0 || scrollLeft < scrollWidth - clientWidth;
    case ScrollDirection.RIGHT:
      return scrollLeft < scrollWidth - clientWidth;
    case ScrollDirection.BOTTOM_RIGHT:
      return scrollTop < scrollHeight - clientHeight || scrollLeft < scrollWidth - clientWidth;
    case ScrollDirection.BOTTOM:
      return scrollTop < scrollHeight - clientHeight;
    case ScrollDirection.BOTTOM_LEFT:
      return scrollTop < scrollHeight - clientHeight || scrollLeft > 0;
    case ScrollDirection.LEFT:
      return scrollLeft > 0;
    case ScrollDirection.TOP_LEFT:
      return scrollTop > 0 || scrollLeft > 0;
    default:
      return false;
  }
};
