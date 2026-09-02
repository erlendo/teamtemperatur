import type { TertialItem, TertialReport } from '@/server/actions/stats'

function ItemRow({ item }: { item: TertialItem }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-sm)',
        padding: 'var(--space-sm) 0',
        borderBottom: '1px solid var(--color-neutral-100)',
      }}
    >
      <div style={{ flex: 1, display: 'grid', gap: 'var(--space-xs)' }}>
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-800)',
          }}
        >
          {item.title}
        </span>
        {item.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-xs)',
              flexWrap: 'wrap',
            }}
          >
            {item.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: '0.1rem 0.5rem',
                  borderRadius: '999px',
                  background: 'var(--color-neutral-100)',
                  color: 'var(--color-neutral-600)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <span
        style={{
          flexShrink: 0,
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-neutral-500)',
        }}
      >
        {item.members.join(', ')}
      </span>
    </li>
  )
}

function TertialSection({
  label,
  period,
  items,
}: {
  label: string
  period: string
  items: TertialItem[]
}) {
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
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}

export function TertialReportView({ report }: { report: TertialReport }) {
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
        />
      ))}
    </section>
  )
}
