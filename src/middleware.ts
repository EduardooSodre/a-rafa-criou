import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Rotas que precisam de autenticação de admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Verificar se o usuário tem role de admin
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Rotas que precisam de autenticação básica
  if (request.nextUrl.pathname.startsWith('/conta')) {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/conta/:path*'],
};
