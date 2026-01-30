import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  state: 'idle' | 'listening' | 'speaking';
  onPress: () => void;
  onStop?: () => void;
  size?: 'default' | 'large';
  className?: string;
  disabled?: boolean;
}

export function VoiceButton({
  state,
  onPress,
  onStop,
  size = 'default',
  className,
  disabled = false,
}: VoiceButtonProps) {
  const isActive = state !== 'idle';

  const handleClick = () => {
    if (isActive && onStop) {
      onStop();
    } else {
      onPress();
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'listening':
        return <MicOff className={cn(size === 'large' ? 'w-10 h-10' : 'w-8 h-8')} />;
      case 'speaking':
        return <VolumeX className={cn(size === 'large' ? 'w-10 h-10' : 'w-8 h-8')} />;
      default:
        return <Mic className={cn(size === 'large' ? 'w-10 h-10' : 'w-8 h-8')} />;
    }
  };

  const getLabel = () => {
    switch (state) {
      case 'listening':
        return 'Listening... Tap to stop';
      case 'speaking':
        return 'Speaking... Tap to stop';
      default:
        return 'Tap to speak';
    }
  };

  const getStateStyles = () => {
    switch (state) {
      case 'listening':
        return 'bg-destructive text-destructive-foreground';
      case 'speaking':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={getLabel()}
      aria-pressed={isActive}
      className={cn(
        'voice-button',
        size === 'large' ? 'w-24 h-24' : 'w-20 h-20',
        getStateStyles(),
        'shadow-lg hover:shadow-xl',
        'transition-all duration-200',
        'focus-visible:ring-4 focus-visible:ring-offset-4',
        isActive && (state === 'listening' ? 'listening' : 'speaking'),
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {getIcon()}
    </button>
  );
}
