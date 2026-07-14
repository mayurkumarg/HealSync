import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value, onClear, placeholder = 'Search…', ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={ref}
          value={value}
          placeholder={placeholder}
          className={cn(
            'h-11 w-full rounded-xl border border-input bg-surface pl-11 pr-10 text-sm text-foreground',
            'placeholder:text-muted-foreground/70 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-ring',
            className,
          )}
          {...props}
        />
        {value && onClear && (
          <button
            onClick={onClear}
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  },
)
SearchBar.displayName = 'SearchBar'
