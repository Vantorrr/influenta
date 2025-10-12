'use client'

import { ReactNode } from 'react'
import Image from 'next/image'
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
          <div className="flex items-center justify-center gap-2">
            <Image src="/logo.jpg" alt="Influenta" width={24} height={24} className="rounded-md" />
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </div>
      )}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
      <Navigation />
    </div>
  )
}







