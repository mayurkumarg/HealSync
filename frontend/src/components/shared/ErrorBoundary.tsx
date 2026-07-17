import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-danger/10 text-danger">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Something went wrong</h1>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              An unexpected error occurred. Try reloading the page — if it keeps happening, please
              let us know.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      )
    }

    return this.props.children
  }
}
