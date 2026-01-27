'use client'

interface CustomRadioGroupProps {
  name: string
  label: string
  options: { value: string | number; label: string }[]
  value?: string | number
  onChange: (value: string | number) => void
  required?: boolean
}

export function CustomRadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  required = false,
}: CustomRadioGroupProps) {
  return (
    <fieldset
      style={{
        border: 'none',
        padding: 0,
        margin: 0,
        marginBottom: 'var(--space-lg)',
      }}
    >
      <legend
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: '600',
          marginBottom: 'var(--space-md)',
          color: 'var(--color-neutral-900)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-sm)',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
      </legend>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
          gap: 'var(--space-sm)',
        }}
      >
        {options.map((option) => (
          <label
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 'var(--border-radius-md)',
              border: '2px solid var(--color-neutral-200)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor:
                value === option.value ? 'var(--color-primary-light)' : 'white',
              borderColor:
                value === option.value
                  ? 'var(--color-primary)'
                  : 'var(--color-neutral-200)',
              fontWeight: value === option.value ? '600' : '500',
              color:
                value === option.value ? 'white' : 'var(--color-neutral-900)',
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLLabelElement
              if (value !== option.value) {
                target.style.borderColor = 'var(--color-primary)'
                target.style.backgroundColor = 'var(--color-neutral-50)'
              }
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLLabelElement
              if (value !== option.value) {
                target.style.borderColor = 'var(--color-neutral-200)'
                target.style.backgroundColor = 'white'
              }
            }}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              style={{
                marginRight: 'var(--space-sm)',
                cursor: 'pointer',
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
