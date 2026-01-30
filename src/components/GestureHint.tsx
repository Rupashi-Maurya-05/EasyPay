import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface GestureHintProps {
  gesture: 'swipe-left' | 'swipe-right' | null;
  onComplete?: () => void;
}

export function GestureHint({ gesture, onComplete }: GestureHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (gesture) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gesture, onComplete]);

  if (!visible || !gesture) return null;

  const isLeft = gesture === 'swipe-left';

  return (
    <div
      className="gesture-hint animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'gesture-hint-content',
          isLeft ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'
        )}
      >
        <div className="flex items-center gap-4">
          {isLeft ? (
            <>
              <ArrowLeft className="w-8 h-8" />
              <div className="flex items-center gap-2">
                <RotateCcw className="w-6 h-6" />
                <span>Repeat</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Check className="w-6 h-6" />
                <span>Confirm</span>
              </div>
              <ArrowRight className="w-8 h-8" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
