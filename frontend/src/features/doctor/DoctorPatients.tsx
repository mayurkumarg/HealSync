import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, UserPlus, QrCode, Clock, Phone, ArrowRight, FileHeart } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, Button, Badge, EmptyState, Avatar, Skeleton } from '@/components/ui'
import { doctorApi } from '@/api/doctor'
import { countdown } from '@/lib/format'
import { RequestAccessDrawer } from './RequestAccessDrawer'
import { ClaimCodeModal } from './ClaimCodeModal'

export default function DoctorPatients() {
  const [requestOpen, setRequestOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)
  const { data, isLoading } = useQuery({ queryKey: ['doctor', 'patients'], queryFn: doctorApi.listPatients })

  return (
    <div>
      <PageHeader
        title="My Patients"
        description="Patients who have granted you access to their records."
        action={
          <div className="flex gap-2.5">
            <Button variant="outline" leftIcon={<QrCode className="h-4 w-4" />} onClick={() => setClaimOpen(true)}>
              Claim code
            </Button>
            <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setRequestOpen(true)}>
              Request access
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No patients yet"
          description="Request access from a patient by phone, or claim a code they've shared with you."
          action={
            <div className="flex gap-2.5">
              <Button variant="outline" leftIcon={<QrCode className="h-4 w-4" />} onClick={() => setClaimOpen(true)}>
                Claim code
              </Button>
              <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setRequestOpen(true)}>
                Request access
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((a) => (
            <Card key={a._id} hover className="flex flex-col p-5">
              <div className="flex items-center gap-3">
                <Avatar name={a.patientId?.name || a.patientId?.email} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{a.patientId?.name || 'Patient'}</p>
                  {a.patientId?.phone_no && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {a.patientId.phone_no}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <Badge tone="success" dot>
                  View access
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {countdown(a.expiresAt)}
                </span>
              </div>
              {a.reason && <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">Reason: {a.reason}</p>}

              <Link to={`/app/doctor/patients/${a.patientId._id}`} className="mt-4">
                <Button variant="outline" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />} leftIcon={<FileHeart className="h-4 w-4" />}>
                  View records
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <RequestAccessDrawer open={requestOpen} onClose={() => setRequestOpen(false)} />
      <ClaimCodeModal open={claimOpen} onClose={() => setClaimOpen(false)} />
    </div>
  )
}
