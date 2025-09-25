'use client'

export default function DebugPage() {
  return (
    <div className="p-8 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      <div className="space-y-2">
        <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'НЕ УСТАНОВЛЕНО!'}</p>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        <hr className="my-4" />
        <p>Если NEXT_PUBLIC_API_URL не установлено, нужно добавить в Vercel:</p>
        <code className="bg-gray-100 p-2 block">NEXT_PUBLIC_API_URL = https://web-production-2bad2.up.railway.app</code>
      </div>
    </div>
  )
}
