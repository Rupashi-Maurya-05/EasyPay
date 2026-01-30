import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
  disabled?: boolean;
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  variant = 'default',
  className,
  disabled = false,
}: ActionCardProps) {
  const variantStyles = {
    default: 'bg-card hover:bg-card/90',
    primary: 'bg-primary/10 hover:bg-primary/20 border-primary/30',
    success: 'bg-success/10 hover:bg-success/20 border-success/30',
    warning: 'bg-warning/10 hover:bg-warning/20 border-warning/30',
  };

  const iconVariantStyles = {
    default: 'text-primary',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={`${title}${description ? `. ${description}` : ''}`}
      className={cn(
        'action-card w-full',
        variantStyles[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center',
          'bg-background/50'
        )}
      >
        <Icon className={cn('w-8 h-8', iconVariantStyles[variant])} />
      </div>
      <div className="text-center">
        <h3 className="text-accessible-lg font-bold text-card-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-accessible-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}
