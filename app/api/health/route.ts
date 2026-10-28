import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Dipakai pm2/Nginx untuk memeriksa aplikasi dan database hidup. */
export async function GET() {
  try {
    const r = db.prepare("SELECT nilai FROM meta WHERE kunci = 'versi_skema'").get() as { nilai: string } | undefined;
    return NextResponse.json({ ok: true, skema: r?.nilai ?? null });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
