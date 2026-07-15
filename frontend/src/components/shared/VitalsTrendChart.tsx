import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatDate } from '@/lib/format'
import type { BpReading, SugarReading } from '@/types'

/** Shared BP/sugar trend chart used by both the patient vitals page and the doctor records view. */
export function VitalsTrendChart({
  kind,
  readings,
  height = 240,
}: {
  kind: 'bp' | 'sugar'
  readings: (BpReading | SugarReading)[]
  height?: number
}) {
  const data = readings.map((r) => ({
    date: formatDate(r.recordedAt, 'MMM d'),
    ...(kind === 'bp'
      ? { systolic: (r as BpReading).systolic, diastolic: (r as BpReading).diastolic }
      : { level: (r as SugarReading).level }),
  }))

  if (data.length === 0) {
    return (
      <div className="grid h-full min-h-[160px] place-items-center text-sm text-muted-foreground">
        No readings recorded.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'rgb(var(--muted-fg))' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--muted-fg))' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{
            background: 'rgb(var(--surface))',
            border: '1px solid rgb(var(--border))',
            borderRadius: 12,
            fontSize: 13,
            color: 'rgb(var(--fg))',
          }}
        />
        {kind === 'bp' ? (
          <>
            <Line type="monotone" dataKey="systolic" stroke="rgb(var(--danger))" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="diastolic" stroke="rgb(var(--accent))" strokeWidth={2.5} dot={{ r: 3 }} />
          </>
        ) : (
          <Line type="monotone" dataKey="level" stroke="rgb(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
