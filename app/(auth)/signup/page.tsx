import { Suspense } from 'react'
import { SignupClient } from './client'

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <SignupClient />
    </Suspense>
  )
}
