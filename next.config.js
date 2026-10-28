const aman = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
];
module.exports = {
  poweredByHeader: false,
  async headers() { return [{ source: '/:path*', headers: aman }]; },
  experimental: { serverComponentsExternalPackages: ['better-sqlite3', 'exceljs'], serverActions: { bodySizeLimit: '12mb' } },
};
