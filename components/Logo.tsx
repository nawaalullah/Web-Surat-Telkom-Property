/** Logo Telkom Property. Dua versi dirender; CSS (globals.css) menampilkan salah satunya sesuai tema. */
export default function Logo({ className = '', alt = 'Telkom Property by Telkom Indonesia' }: { className?: string; alt?: string }) {
  return (
    <>
      <img src="/logo-light.png" alt={alt} className={`logo-light ${className}`} />
      <img src="/logo-dark.png" alt={alt} className={`logo-dark ${className}`} />
    </>
  );
}
