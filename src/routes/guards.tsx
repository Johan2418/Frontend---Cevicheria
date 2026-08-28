import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
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
 * Inverse of RequireAuth: keeps a signed-in user off the auth screens, which
 * otherwise let them re-submit a login they already have.
 */
export function RedirectIfAuthenticated({ children }: { children?: ReactNode }) {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') return <Navigate to="/admin" replace />;
  return children ?? <Outlet />;
}

/**
 * Route-level permission gate. Accepts a single code, or `anyOf` for sections
 * reachable through several permissions — matching how the staff nav decides
 * which links to show, so the menu and the URL agree.
 *
 * Pages keep their own finer-grained checks for individual actions; this only
 * guards the entrance against someone typing the URL directly.
 */
export function RequirePermission({
  code,
  anyOf,
  children,
}: {
  code?: PermissionCode;
  anyOf?: PermissionCode[];
  children?: ReactNode;
}) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const codes = anyOf ?? (code ? [code] : []);
  const allowed = codes.length === 0 || codes.some((c) => hasPermission(c));

  if (!allowed) {
    return (
      <EmptyState
        icon={<ShieldX className="size-10" aria-hidden />}
        title="Sin permisos"
        description="No tenés permisos para ver esta sección."
      />
    );
  }
  return <>{children ?? <Outlet />}</>;
}
