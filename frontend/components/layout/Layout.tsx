'use client'

import { ReactNode } from 'react'
import { Navigation } from './navigation'

interface LayoutProps {
  children: ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-telegram-bg pb-16">
      {title && (
        <div className="sticky top-0 bg-telegram-bgSecondary border-b border-telegram-border z-10 px-4 py-3">
          <h1 className="text-lg font-semibold text-center">{title}</h1>
        </div>
      )}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
      <Navigation />
    </div>
  )
}

