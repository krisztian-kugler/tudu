import { ScrollDirection } from "src/utils/dom";

export const ANIMATION_DURATION = 2000;

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
