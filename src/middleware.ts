import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  try {
    // Rotas que precisam de autenticação de admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
      });

      if (!token) {
        return NextResponse.redirect(new URL('/auth/login?callbackUrl=/admin', request.url));
      }

      // Verificar se o usuário tem role de admin
      if (token.role !== 'admin') {
        return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
      }
    }

    // Rotas que precisam de autenticação básica
    if (request.nextUrl.pathname.startsWith('/conta')) {
      const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
      });

      if (!token) {
        return NextResponse.redirect(new URL('/auth/login?callbackUrl=/conta', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/admin/:path*', '/conta/:path*'],
};
