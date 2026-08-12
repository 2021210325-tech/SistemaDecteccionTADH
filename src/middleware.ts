import { NextResponse, type NextRequest } from 'next/server'

function decodeToken(token: string): any {
  try {
    const payload = token.split('.')[1]
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  const protectedRoutes = ['/admin', '/psicologo', '/entidad']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (token) {
    const decoded = decodeToken(token)

    if (!decoded) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
      return response
    }

    if (request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone()
      if (decoded.roles?.includes('PSICOLOGO')) {
        url.pathname = '/psicologo'
      } else if (decoded.roles?.includes('ENTIDAD_GOBIERNO')) {
        url.pathname = '/entidad'
      } else {
        url.pathname = '/admin'
      }
      return NextResponse.redirect(url)
    }

    if (request.nextUrl.pathname.startsWith('/admin')) {
      const isAdmin = decoded.roles?.some((r: string) => r === 'ADMIN_GENERAL' || r.startsWith('ADMIN_'))
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    if (request.nextUrl.pathname.startsWith('/psicologo')) {
      if (!decoded.roles?.includes('PSICOLOGO')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    if (request.nextUrl.pathname.startsWith('/entidad')) {
      if (!decoded.roles?.includes('ENTIDAD_GOBIERNO')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}