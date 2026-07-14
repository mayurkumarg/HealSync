import { Link } from 'react-router-dom'
import { Rocket, ArrowLeft } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { ROLE_LABEL } from '@/routes/nav'

export function ComingSoon() {
  const { user } = useAuth()
  const role = user ? ROLE_LABEL[user.role] : ''

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
          <Rocket className="h-9 w-9" />
        </div>
        <Badge tone="primary" className="mb-4">
          {role} portal
        </Badge>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          Your {role.toLowerCase()} workspace is on the way
        </h1>
        <p className="mt-3 text-muted-foreground">
          You're signed in successfully. The full {role.toLowerCase()} experience — dashboards, tools
          and analytics — is being crafted with the same care as the patient app you can already
          explore.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
