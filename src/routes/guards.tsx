import type { ReactNode } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/store';
import type { PermissionCode } from '@/shared/lib/permissions';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ShieldX } from 'lucide-react';

export function RequireAuth({ children }: { children?: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'anonymous') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children ?? <Outlet />;
}

/**
 * Cierra una sección a quien no tenga permiso. Se pasa `anyOf` cuando la
 * sección es útil con cualquiera de varios permisos (p. ej. Caja se puede sólo
 * consultar, o además abrir y cerrar).
 */
export function RequirePermission({
  code,
  anyOf,
  children,
}: {
  code?: PermissionCode;
  anyOf?: PermissionCode[];
  children: ReactNode;
}) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const required = anyOf ?? (code ? [code] : []);
  const allowed = required.length === 0 || required.some((p) => hasPermission(p));

  if (!allowed) {
    return (
      <EmptyState
        icon={<ShieldX className="size-10" aria-hidden />}
        title="Sin permisos"
        description="No tienes permisos para ver esta sección. Si creés que es un error, pedile a un administrador que revise tu rol."
        action={
          <Link
            to="/admin"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Volver al panel
          </Link>
        }
      />
    );
  }
  return <>{children}</>;
}
