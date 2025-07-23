import { useState, useCallback, useMemo, UIEvent, CSSProperties } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number;
    item: T;
    offsetTop: number;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  containerProps: {
    style: CSSProperties;
    onScroll: (e: UIEvent<HTMLDivElement>) => void;
  };
  innerProps: {
    style: CSSProperties;
  };
}

/**
 * Custom hook for virtual scrolling large lists
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  const totalHeight = items.length * itemHeight;
  
  const visibleRange = useMemo(() => {
    const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      startIndex + visibleItemsCount + overscan * 2
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const virtualItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      result.push({
        index: i,
        item: items[i],
        offsetTop: i * itemHeight,
      });
    }
    return result;
  }, [items, visibleRange, itemHeight]);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef) {
      const targetScrollTop = index * itemHeight;
      containerRef.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, [containerRef, itemHeight]);

  const containerProps = {
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const,
    },
    onScroll: handleScroll,
    ref: setContainerRef,
  };

  const innerProps = {
    style: {
      height: totalHeight,
      position: 'relative' as const,
    },
  };

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    containerProps,
    innerProps,
  };
}
