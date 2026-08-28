import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { BrandLogo } from '@/shared/components/BrandLogo';

/**
 * Replaces the silent redirect the wildcard route used to perform, which hid
 * broken links and made mistyped QR URLs look like they had worked.
 */
export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <BrandLogo compact={false} />
      <Compass className="size-12 text-stone-300" aria-hidden />
      <h1 className="text-2xl font-bold text-stone-900">No encontramos esta página</h1>
      <p className="max-w-sm text-sm text-stone-500">
        Puede que el enlace esté mal escrito o que ya no exista. Escaneá de nuevo el QR de tu mesa
        para volver al menú.
      </p>
      <Link
        to="/mesa"
        className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
      >
        Ir al inicio
      </Link>
    </main>
  );
}
