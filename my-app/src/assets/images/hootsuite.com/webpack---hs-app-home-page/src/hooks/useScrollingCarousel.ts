import { useEffect, useCallback, useState, RefObject } from 'react';
import { track } from 'fe-lib-tracking';
import {
  TRACKING_EVENT_USER_CLICKS_GO_TO_NEXT_GROUP,
  TRACKING_EVENT_USER_CLICKS_GO_TO_PREVIOUS_GROUP,
  TRACKING_ORIGIN_HOMEPAGE,
} from 'constants/tracking';
import useScrollPosition from 'hooks/useScrollPosition';
import { WidgetName } from 'typings/Widget';

type Direction = 'block' | 'inline';

type UseScrollingCarousel<T extends HTMLElement> = {
  ref: RefObject<T>;
  goToIndex: (index: number) => void;
  goToNext: (count?: number) => void;
  goToPrevious: (count?: number) => void;
  goToStart: () => void;
  goToEnd: () => void;
  goToNextGroup: () => void;
  goToPreviousGroup: () => void;
  isAtStart: boolean;
  isAtEnd: boolean;
  isOverflowing: boolean;
};

const useScrollingCarousel = <T extends HTMLElement>(
  direction: Direction = 'inline',
  threshold = 0,
  widgetName: WidgetName,
): UseScrollingCarousel<T> => {
  const { ref, left, top, scrollBy, scrollTo } = useScrollPosition<T>({ threshold });
  const [children, setChildren] = useState<HTMLElement[]>([]);
  const [visibleChildrenIndexes, setVisibleChildrenIndexes] = useState<number[]>([]);

  useEffect(() => {
    const mutationObserver = new MutationObserver(() => {
      if (ref.current) {
        setChildren([...ref.current.children] as HTMLElement[]);
      }
    });

    if (ref.current) {
      setChildren([...ref.current.children] as HTMLElement[]);
      mutationObserver.observe(ref.current, { childList: true });
    }

    return () => {
      mutationObserver.disconnect();
    };
  }, [ref]);

  useEffect(() => {
    const intersectionOberserver = new IntersectionObserver(
      entries => {
        setVisibleChildrenIndexes(prev => {
          const set = new Set([...prev]);

          entries.forEach(entry => {
            const index = children.indexOf(entry.target as HTMLElement);
            if (index > -1) {
              if (entry.isIntersecting) {
                set.add(index);
              } else {
                set.delete(index);
              }
            }
          });

          return children.map((el, i) => i).filter(i => set.has(i));
        });
      },
      { root: ref.current, threshold: 1 },
    );

    children.forEach(el => intersectionOberserver.observe(el));
    goToStart();

    return () => {
      intersectionOberserver.disconnect();
    };
  }, [children, ref]);

  const goToIndex = useCallback(
    (index: number) => {
      if (ref.current && children[index]) {
        if (direction === 'inline') {
          scrollTo({ left: children[index].offsetLeft - ref.current.offsetLeft });
        } else {
          scrollTo({ top: children[index].offsetTop - ref.current.offsetTop });
        }
      }
    },
    [children, direction, scrollTo, ref],
  );

  const goToNext = useCallback(
    (count = 1) => {
      const index = Math.min(visibleChildrenIndexes[0] + count, children.length - 1);
      goToIndex(index);
    },
    [children, visibleChildrenIndexes, goToIndex],
  );

  const goToPrevious = useCallback(
    (count = 1) => {
      const index = Math.max(visibleChildrenIndexes[0] - count, 0);
      goToIndex(index);
    },
    [visibleChildrenIndexes, goToIndex],
  );

  const goToStart = useCallback(() => {
    goToIndex(0);
  }, [goToIndex]);

  const goToEnd = useCallback(() => {
    goToIndex(children.length - 1);
  }, [children, goToIndex]);

  const goToNextGroup = useCallback(() => {
    if (ref.current) {
      track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_GO_TO_NEXT_GROUP, {
        widgetName: widgetName,
      });
      scrollBy({ left: ref.current.offsetWidth });
    }
  }, [ref, scrollBy, widgetName]);

  const goToPreviousGroup = useCallback(() => {
    if (ref.current) {
      track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_GO_TO_PREVIOUS_GROUP, {
        widgetName: widgetName,
      });
      scrollBy({ left: -ref.current.offsetWidth });
    }
  }, [ref, scrollBy, widgetName]);

  const isAtStart = direction === 'inline' ? left.isAtStart : top.isAtStart;
  const isAtEnd = direction === 'inline' ? left.isAtEnd : top.isAtEnd;
  const isOverflowing = visibleChildrenIndexes.length < children.length;

  return {
    ref,
    goToIndex,
    goToNext,
    goToPrevious,
    goToStart,
    goToEnd,
    goToNextGroup,
    goToPreviousGroup,
    isAtStart,
    isAtEnd,
    isOverflowing,
  };
};

export default useScrollingCarousel;
