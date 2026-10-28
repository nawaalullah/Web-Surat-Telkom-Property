import { APP_PEMILIK, APP_TAHUN, APP_VERSI } from '@/lib/app';

/** Footer hak cipta dan versi aplikasi. */
export default function HakCipta({ className = '' }: { className?: string }) {
    return (
        <footer className={'text-center text-xs text-muted leading-relaxed ' + className}>
            <div>© {APP_TAHUN} {APP_PEMILIK}. All rights reserved.</div>
            <div>Designed by {APP_PEMILIK} · Versi {APP_VERSI}</div>
        </footer>
    );
}
