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

export function RequirePermission({
  code,
  children,
}: {
  code: PermissionCode;
  children: ReactNode;
}) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (!hasPermission(code)) {
    return (
      <EmptyState
        icon={<ShieldX className="size-10" aria-hidden />}
        title="Sin permisos"
        description="No tienes permisos para ver esta sección."
      />
    );
  }
  return <>{children}</>;
}
