import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, ...props }, ref) => {
    return (
      <label className={cn('inline-flex cursor-pointer items-center gap-2.5 text-sm', className)}>
        <span className="relative inline-flex">
          <input ref={ref} type="checkbox" checked={checked} className="peer sr-only" {...props} />
          {/* The box is a real sibling of .peer, so peer-checked variants resolve correctly. */}
          <span
            className={cn(
              'grid h-5 w-5 place-items-center rounded-md border border-input bg-surface transition-all',
              'peer-checked:border-primary peer-checked:bg-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background',
              '[&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100',
            )}
          >
            <Check className="h-3.5 w-3.5 text-primary-foreground transition-opacity" strokeWidth={3} />
          </span>
        </span>
        {label && <span className="text-foreground">{label}</span>}
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'
