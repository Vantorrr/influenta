import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Защита админ-панели
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Не делаем редирект на /admin/login (страницы нет в мини-приложении)
    // Проверка прав выполняется на страницах через useAuth()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}









