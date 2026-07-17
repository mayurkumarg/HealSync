import { cloneElement, isValidElement, useId } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface FieldProps {
  label?: ReactNode
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}

/** Label + control + inline validation error wrapper for forms. Auto-generates and wires a
 * matching id/htmlFor pair when the caller doesn't provide one, so a screen reader still
 * announces the label on focus even if a call site forgot to set `htmlFor`/`id` explicitly. */
export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  const generatedId = useId()
  const ownId = isValidElement(children) ? (children.props as { id?: string }).id : undefined
  const fieldId = htmlFor ?? ownId ?? generatedId
  const control =
    isValidElement(children) && !ownId
      ? cloneElement(children as ReactElement<{ id?: string }>, { id: fieldId })
      : children

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="flex items-center gap-1 text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      {control}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-danger animate-fade-in">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
