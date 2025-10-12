import Image from 'next/image'

export function LoadingScreen({ text = 'Загрузка...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-telegram-bg">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Image 
              src="/logo.jpg" 
              alt="Influenta" 
              width={80} 
              height={80} 
              className="rounded-2xl animate-pulse"
            />
          </div>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram-primary mx-auto mb-4"></div>
        <p className="text-telegram-textSecondary">{text}</p>
      </div>
    </div>
  )
}
