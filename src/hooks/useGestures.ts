import { useEffect, useRef, useCallback, useState } from 'react';

type GestureType = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'tap' | 'long-press';

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

interface UseGesturesOptions {
  threshold?: number;
  longPressDelay?: number;
}

export function useGestures(
  ref: React.RefObject<HTMLElement>,
  handlers: GestureHandlers,
  options: UseGesturesOptions = {}
) {
  const { threshold = 50, longPressDelay = 500 } = options;
  
  const [lastGesture, setLastGesture] = useState<GestureType | null>(null);
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        setLastGesture('long-press');
        handlers.onLongPress?.();
        touchStartRef.current = null; // Prevent other gestures
      }, longPressDelay);
    };

    const handleTouchMove = () => {
      // Cancel long press if user moves
      clearLongPressTimer();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      clearLongPressTimer();
      
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Check if it's a tap (small movement, short time)
      if (absX < 10 && absY < 10 && deltaTime < 300) {
        setLastGesture('tap');
        handlers.onTap?.();
        touchStartRef.current = null;
        return;
      }

      // Check for swipes
      if (absX > threshold || absY > threshold) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            setLastGesture('swipe-right');
            handlers.onSwipeRight?.();
          } else {
            setLastGesture('swipe-left');
            handlers.onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            setLastGesture('swipe-down');
            handlers.onSwipeDown?.();
          } else {
            setLastGesture('swipe-up');
            handlers.onSwipeUp?.();
          }
        }
      }

      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      clearLongPressTimer();
    };
  }, [ref, handlers, threshold, longPressDelay, clearLongPressTimer]);

  return { lastGesture };
}
