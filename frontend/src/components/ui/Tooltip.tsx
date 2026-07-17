import { cloneElement, isValidElement, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
}) {
  const [show, setShow] = useState(false)

  // When the tooltip text is a plain string and the wrapped control has no accessible name of
  // its own (typical for icon-only buttons), forward it as aria-label — otherwise a screen
  // reader only announces "button" since the tooltip text is invisible until hover/focus.
  const hasOwnLabel = isValidElement(children) && !!(children.props as { 'aria-label'?: string })['aria-label']
  const trigger =
    typeof content === 'string' && isValidElement(children) && !hasOwnLabel
      ? cloneElement(children as ReactElement<{ 'aria-label'?: string }>, { 'aria-label': content })
      : children

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {trigger}
      <AnimatePresence>
        {show && (
          <motion.span
            initial={{ opacity: 0, y: side === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className={cn(
              'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-elevated dark:bg-slate-700',
              side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
