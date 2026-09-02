import type { TertialItem, TertialReport } from '@/server/actions/stats'
import { TertialItemRow } from './TertialItemRow'

const UNTAGGED_LABEL = 'Ukjent'

function groupByTag(items: TertialItem[]): [string, TertialItem[]][] {
  const groups = new Map<string, TertialItem[]>()

  for (const item of items) {
    const key = item.tags[0] ?? UNTAGGED_LABEL
    const existing = groups.get(key)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(key, [item])
    }
  }

  return [...groups.entries()].sort(([a], [b]) => {
    if (a === UNTAGGED_LABEL) return 1
    if (b === UNTAGGED_LABEL) return -1
    return a.localeCompare(b, 'nb')
  })
}

function TagGroup({
  tag,
  items,
  teamId,
}: {
  tag: string
  items: TertialItem[]
  teamId: string
}) {
  const isUntagged = tag === UNTAGGED_LABEL

  return (
    <div>
      <h4
        style={{
          margin: '0 0 var(--space-xs)',
          fontSize: 'var(--font-size-base)',
          fontWeight: 700,
          color: isUntagged
            ? 'var(--color-neutral-500)'
            : 'var(--color-primary-dark)',
        }}
      >
        {tag}
      </h4>
      <ul style={{ listStyle: 'disc', margin: 0, paddingLeft: '1.25rem' }}>
        {items.map((item) => (
          <TertialItemRow key={item.id} item={item} teamId={teamId} />
        ))}
      </ul>
    </div>
  )
}

function TertialSection({
  label,
  period,
  items,
  teamId,
}: {
  label: string
  period: string
  items: TertialItem[]
  teamId: string
}) {
  const groups = groupByTag(items)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-md)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--font-size-lg)',
            fontWeight: 700,
            color: 'var(--color-neutral-900)',
          }}
        >
          {label}
        </h3>
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-500)',
          }}
        >
          {period}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-primary)',
          }}
        >
          {items.length} ferdigstilt
        </span>
      </div>
      {items.length === 0 ? (
        <p
          style={{
            margin: 0,
            color: 'var(--color-neutral-400)',
            fontSize: 'var(--font-size-sm)',
            fontStyle: 'italic',
          }}
        >
          Ingen ukemål ferdigstilt i denne perioden.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
          {groups.map(([tag, tagItems]) => (
            <TagGroup key={tag} tag={tag} items={tagItems} teamId={teamId} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TertialReportView({
  report,
  teamId,
}: {
  report: TertialReport
  teamId: string
}) {
  const tertials = [
    { label: 'T1', period: '1. jan – 30. apr', items: report.T1 },
    { label: 'T2', period: '1. mai – 31. aug', items: report.T2 },
    { label: 'T3', period: '1. sep – 31. des', items: report.T3 },
  ]

  const total = report.T1.length + report.T2.length + report.T3.length

  return (
    <section
      style={{
        padding: 'var(--space-2xl)',
        borderRadius: '1.5rem',
        border: '1px solid var(--color-neutral-200)',
        background: 'var(--color-neutral-50)',
        boxShadow: 'var(--shadow-sm)',
        display: 'grid',
        gap: 'var(--space-2xl)',
      }}
    >
      <div>
        <p
          style={{
            margin: '0 0 var(--space-xs)',
            color: 'var(--color-primary-dark)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Tertialrapport
        </p>
        <h2
          style={{
            margin: '0 0 var(--space-xs)',
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 800,
            color: 'var(--color-neutral-900)',
          }}
        >
          Ferdigstilte ukemål {report.year}
        </h2>
        <p
          style={{
            margin: 0,
            color: 'var(--color-neutral-500)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {total} ukemål ferdigstilt i {report.year}.
        </p>
      </div>
      {tertials.map((t) => (
        <TertialSection
          key={t.label}
          label={t.label}
          period={t.period}
          items={t.items}
          teamId={teamId}
        />
      ))}
    </section>
  )
}
