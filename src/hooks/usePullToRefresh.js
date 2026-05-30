import { useCallback, useRef, useState } from 'react';
import { haptic } from '../utils/haptics';

/**
 * Pull-to-refresh for screen-scroll containers.
 *
 * Usage:
 *   const { refreshing, pullHandlers } = usePullToRefresh(onRefresh);
 *   <div className="screen-scroll" {...pullHandlers}>
 *     {refreshing && <RefreshSpinner />}
 *     ...content...
 *   </div>
 *
 * Only fires when the scroll container is already at the top (scrollTop === 0)
 * and the user drags down past `threshold` px. Fires `haptic('light')` when the
 * threshold is crossed so the driver gets tactile feedback before lifting.
 */
export function usePullToRefresh(onRefresh, threshold = 64) {
    const startY = useRef(null);
    const thresholdReached = useRef(false);
    const [refreshing, setRefreshing] = useState(false);

    const onTouchStart = useCallback((e) => {
        const el = e.currentTarget;
        // Only begin tracking when the container is scrolled to the very top.
        if (el.scrollTop > 1) return;
        startY.current = e.touches[0].clientY;
        thresholdReached.current = false;
    }, []);

    const onTouchMove = useCallback((e) => {
        if (startY.current === null || refreshing) return;
        const el = e.currentTarget;
        // If user scrolled down since touch-start, abandon tracking.
        if (el.scrollTop > 1) { startY.current = null; return; }
        const dy = e.touches[0].clientY - startY.current;
        if (dy >= threshold && !thresholdReached.current) {
            thresholdReached.current = true;
            haptic('light');
        }
    }, [refreshing, threshold]);

    const onTouchEnd = useCallback(async (e) => {
        if (startY.current === null) return;
        const el = e.currentTarget;
        const dy = e.changedTouches[0].clientY - startY.current;
        startY.current = null;

        if (dy >= threshold && el.scrollTop <= 1 && !refreshing) {
            setRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setRefreshing(false);
            }
        }
    }, [threshold, refreshing, onRefresh]);

    return {
        refreshing,
        pullHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    };
}
