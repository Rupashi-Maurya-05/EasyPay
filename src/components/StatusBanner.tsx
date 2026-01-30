import { Mic, Volume2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBannerProps {
  type: 'listening' | 'speaking' | 'error' | 'info';
  message: string;
  className?: string;
}

export function StatusBanner({ type, message, className }: StatusBannerProps) {
  const config = {
    listening: {
      icon: Mic,
      bgColor: 'bg-destructive/10',
      textColor: 'text-destructive',
      borderColor: 'border-destructive/30',
    },
    speaking: {
      icon: Volume2,
      bgColor: 'bg-success/10',
      textColor: 'text-success',
      borderColor: 'border-success/30',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-destructive/10',
      textColor: 'text-destructive',
      borderColor: 'border-destructive/30',
    },
    info: {
      icon: AlertCircle,
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      borderColor: 'border-primary/30',
    },
  };

  const { icon: Icon, bgColor, textColor, borderColor } = config[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 px-6 py-4 rounded-2xl border-2',
        bgColor,
        textColor,
        borderColor,
        'animate-fade-in',
        className
      )}
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      <span className="text-accessible-base font-medium">{message}</span>
    </div>
  );
}
