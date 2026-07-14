import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  invalid?: boolean
  placeholder?: string
}

/** Native select styled to match the design system (accessible, keyboard-friendly). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, invalid, placeholder, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'h-11 w-full appearance-none rounded-xl border bg-surface pl-3.5 pr-10 text-sm text-foreground',
            'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-60',
            invalid ? 'border-danger focus:ring-danger/40' : 'border-input',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    )
  },
)
Select.displayName = 'Select'
