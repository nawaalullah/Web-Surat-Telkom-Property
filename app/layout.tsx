import './globals.css';
import { skripTemaAwal } from '@/lib/tema';

export const metadata = { title: 'Arsip Surat Keluar - Telkom Property' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: skripTemaAwal }} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
      </head>
      <body className="m-0 bg-canvas text-ink font-sans">{children}</body>
    </html>
  );
}
