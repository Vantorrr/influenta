'use client'

import React, { useEffect, useState } from 'react'

export function Snowfall() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[40] overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute text-white/80 animate-fall"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
            fontSize: `${Math.random() * 10 + 10}px`,
            opacity: Math.random() * 0.6 + 0.2,
          }}
        >
          ❄
        </div>
      ))}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
          }
          100% {
            transform: translateY(120vh) translateX(20px) rotate(360deg);
          }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  )
}

