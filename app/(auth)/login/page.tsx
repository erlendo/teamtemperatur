import { Suspense } from 'react'
import { LoginClient } from './client'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <div className="auth-grid">
            <div className="auth-hero">
              <p>Laster innloggingsside...</p>
            </div>
            <div className="auth-card">
              <p style={{ margin: 0 }}>Forbereder innlogging...</p>
            </div>
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
