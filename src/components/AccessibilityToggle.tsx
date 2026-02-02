import { cn } from '@/lib/utils';
interface AccessibilityToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}
export function AccessibilityToggle({
  label,
  description,
  checked,
  onChange,
  id
}: AccessibilityToggleProps) {
  return <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex-1">
        <label htmlFor={id} className="text-accessible-lg font-semibold text-foreground cursor-pointer block">
          {label}
        </label>
        {description && <p className="text-accessible-sm text-muted-foreground mt-1">
            {description}
          </p>}
      </div>
      <button id={id} role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cn("relative w-20 h-12 rounded-full transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-offset-4 text-left", checked ? 'bg-primary' : 'bg-muted')}>
        <span className={cn("absolute top-1.5 w-9 h-9 rounded-full bg-card shadow-md transition-transform duration-200 px-0 text-left mx-[50px]", checked ? 'translate-x-1.5' : 'translate-x-9')} />
        <span className="sr-only">{checked ? 'Enabled' : 'Disabled'}</span>
      </button>
    </div>;
}