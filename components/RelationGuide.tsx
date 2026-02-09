'use client'

import { Info, X } from 'lucide-react'
import { useState } from 'react'

export function RelationGuide() {
  const [isOpen, setIsOpen] = useState(true)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'var(--space-xl)',
          right: 'var(--space-xl)',
          padding: 'var(--space-md)',
          backgroundColor: 'var(--color-primary, #3b82f6)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        title="Vis veiledning for relasjoner"
      >
        <Info size={24} />
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--space-xl)',
        right: 'var(--space-xl)',
        backgroundColor: 'white',
        border: '2px solid var(--color-primary, #3b82f6)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        maxWidth: '400px',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-md)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          <Info size={20} />
          Lag forbindelser
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-neutral-500)',
            padding: 'var(--space-xs)',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Lukk"
        >
          <X size={20} />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 var(--space-sm) 0',
              fontWeight: 600,
              color: 'var(--color-neutral-700)',
            }}
          >
            Slik oppretter du piler:
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: 'var(--space-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-xs)',
            }}
          >
            <li>
              <strong>Dra og slipp</strong> et kort fra én kolonne til en annen
            </li>
            <li>
              Pilene vises automatisk når du slipper kortet
            </li>
          </ul>
        </div>

        <div
          style={{
            backgroundColor: '#f0fdf4',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #86efac',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '3px',
                backgroundColor: '#10b981',
                borderRadius: '2px',
              }}
            />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>
              Grønn pil (neste steg)
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#166534' }}>
            <strong>Ukemål → Pipeline</strong>
            <br />
            Dra et ukemål til pipeline-kolonnen
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#eff6ff',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #93c5fd',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '3px',
                backgroundColor: '#3b82f6',
                borderRadius: '2px',
              }}
            />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>
              Blå pil (del av)
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#1e40af' }}>
            <strong>Pipeline → Mål</strong>
            <br />
            Dra et pipeline-kort til mål-kolonnen
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#fefce8',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #fde047',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: '#713f12',
              fontWeight: 500,
            }}
          >
            💡 <strong>Tips:</strong> Du kan bare ha én forbindelse per kort i
            hver retning. Ny forbindelse erstatter automatisk den gamle.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          style={{
            padding: 'var(--space-sm)',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            marginTop: 'var(--space-sm)',
          }}
        >
          Skjønner!
        </button>
      </div>
    </div>
  )
}
