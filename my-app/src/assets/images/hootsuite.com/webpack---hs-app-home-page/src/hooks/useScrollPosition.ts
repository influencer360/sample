// TODO: Upgrade hs-app-scripts/TypeScript and remove triple-slash directive
/// <reference types="resize-observer-browser" />

import { useEffect, useCallback, useMemo, useRef, useState, RefObject } from 'react';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

interface ScrollInfo {
  position: number;
  isAtStart: boolean;
  isAtEnd: boolean;
}

type ScrollState = {
  top: ScrollInfo;
  left: ScrollInfo;
};

type UseScrollPosition<T extends HTMLElement> = {
  ref: RefObject<T>;
  top: ScrollInfo;
  left: ScrollInfo;
  scrollBy: (options: ScrollToOptions) => void;
  scrollTo: (options: ScrollToOptions) => void;
};

interface Options {
  delay?: number;
  threshold?: number;
}

const getScrollState = (el: HTMLElement, threshold = 0): ScrollState => {
  return {
    top: {
      position: el.scrollTop,
      isAtStart: el.scrollTop <= threshold,
      isAtEnd: el.scrollTop + el.offsetHeight >= el.scrollHeight - threshold,
    },
    left: {
      position: el.scrollLeft,
      isAtStart: el.scrollLeft <= threshold,
      isAtEnd: el.scrollLeft + el.offsetWidth >= el.scrollWidth - threshold,
    },
  };
};

const useScrollPosition = <T extends HTMLElement>({
  delay = 100,
  threshold = 0,
}: Options = {}): UseScrollPosition<T> => {
  const ref = useRef<T>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    top: { position: 0, isAtStart: true, isAtEnd: false },
    left: { position: 0, isAtStart: true, isAtEnd: false },
  });
  const throttledSetScrollState = useMemo(() => throttle(setScrollState, delay), [delay]);
  const debouncedSetScrollState = useMemo(() => debounce(setScrollState, delay), [delay]);
  const scrollBy = useCallback((options: ScrollToOptions) => ref.current?.scrollBy(options), [ref]);
  const scrollTo = useCallback((options: ScrollToOptions) => ref.current?.scrollTo(options), [ref]);

  useEffect(() => {
    const el = ref.current;
    el && setScrollState(getScrollState(el, threshold));

    const handleScroll = () => {
      if (el) {
        throttledSetScrollState(getScrollState(el, threshold));
      }
    };

    el?.addEventListener('scroll', handleScroll);

    return () => el?.removeEventListener('scroll', handleScroll);
  }, [threshold, throttledSetScrollState]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      ref.current && debouncedSetScrollState(getScrollState(ref.current, threshold));
    });

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [threshold, debouncedSetScrollState]);

  return {
    ref,
    ...scrollState,
    scrollBy,
    scrollTo,
  };
};

export default useScrollPosition;
