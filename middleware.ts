import { NextRequest, NextResponse } from 'next/server';
import { verifySession, NAMA_COOKIE } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const s = await verifySession(req.cookies.get(NAMA_COOKIE)?.value);
  const { pathname } = req.nextUrl;
  if (pathname === '/login') return s ? NextResponse.redirect(new URL('/arsip', req.url)) : NextResponse.next();
  if (!s) return NextResponse.redirect(new URL('/login', req.url));
  if (pathname === '/') return NextResponse.redirect(new URL('/arsip', req.url));
}
export const config = { matcher: ['/', '/login', '/arsip/:path*', '/catat/:path*', '/belum-diunggah/:path*', '/laporan/:path*', '/pengaturan/:path*', '/profil/:path*', '/bantuan/:path*'] };
