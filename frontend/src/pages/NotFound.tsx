import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="text-center">
        <Logo size="lg" className="mx-auto mb-8" />
        <p className="font-display text-7xl font-extrabold text-primary/30">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>Go back home</Button>
          </Link>
          <Link to="/app">
            <Button leftIcon={<Home className="h-4 w-4" />}>My dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
