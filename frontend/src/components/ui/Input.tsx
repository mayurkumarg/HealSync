import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, invalid, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:h-4.5 [&>svg]:w-4.5">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-foreground',
            'placeholder:text-muted-foreground/70 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-60',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            invalid ? 'border-danger focus:ring-danger/40 focus:border-danger' : 'border-input',
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </span>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
