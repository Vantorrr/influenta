'use client'

import { useEffect } from 'react'

export default function AdminModerationPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/verification'
    }
  }, [])

  return null
}


