import { Settings, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container flex items-center justify-between h-20">
        <button
          onClick={() => navigate('/')}
          className={cn(
            'flex items-center gap-3 tap-target rounded-xl px-4',
            'focus-visible:ring-4 focus-visible:ring-offset-2',
            'transition-colors hover:bg-muted'
          )}
          aria-label="Go to home"
        >
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">₹</span>
          </div>
          <span className="text-accessible-lg font-bold text-foreground hidden sm:block">
            Easy Pay
          </span>
        </button>

        <nav className="flex items-center gap-2">
          {!isHome && (
            <button
              onClick={() => navigate('/')}
              className={cn(
                'tap-target rounded-xl px-4 flex items-center gap-2',
                'bg-muted text-muted-foreground',
                'hover:bg-muted/80 transition-colors',
                'focus-visible:ring-4 focus-visible:ring-offset-2'
              )}
              aria-label="Home"
            >
              <Home className="w-6 h-6" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}
          <button
            onClick={() => navigate('/settings')}
            className={cn(
              'tap-target rounded-xl px-4 flex items-center gap-2',
              location.pathname === '/settings'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
              'transition-colors',
              'focus-visible:ring-4 focus-visible:ring-offset-2'
            )}
            aria-label="Settings"
          >
            <Settings className="w-6 h-6" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
