import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full resize-y rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-foreground',
          'placeholder:text-muted-foreground/70 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-ring',
          'disabled:cursor-not-allowed disabled:opacity-60',
          invalid ? 'border-danger focus:ring-danger/40 focus:border-danger' : 'border-input',
          className,
        )}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'
