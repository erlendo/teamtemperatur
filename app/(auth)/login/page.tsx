import { Suspense } from 'react'
import { LoginClient } from './client'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 420 }}>
          <p>Laster innloggingsside...</p>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
