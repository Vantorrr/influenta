'use client'

import { ReactNode } from 'react'
import { Navigation, Header } from './navigation'

interface LayoutProps {
  title: string
  children: ReactNode
}

export function Layout({ title, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-telegram-bg">
      <Header title={title} />
      <main className="pt-14 pb-16">
        {children}
      </main>
      <Navigation />
    </div>
  )
}

