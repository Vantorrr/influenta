import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Защита админ-панели
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Здесь будет проверка токена и роли
    // Пока просто проверяем наличие токена в cookie
    const token = request.cookies.get('token')
    
    if (!token && request.nextUrl.pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}

