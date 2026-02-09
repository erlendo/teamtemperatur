import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'tt-show-relations'

export function useVisibleRelations() {
  const [showRelations, setShowRelations] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setShowRelations(stored === 'true')
    }
    setMounted(true)
  }, [])

  const toggleRelations = useCallback(() => {
    setShowRelations((prev) => {
      const newValue = !prev
      localStorage.setItem(STORAGE_KEY, String(newValue))
      return newValue
    })
  }, [])

  return { showRelations, toggleRelations, mounted }
}
