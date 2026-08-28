import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTableSessionStore } from './tableSession';

/**
 * Sends the diner back to the QR landing when there is no live table session.
 * Applied once at the route level, so a new page under /mesa cannot forget it.
 * Redirects declaratively rather than from an effect, which avoids rendering a
 * blank frame before the navigation happens.
 */
export function RequireTableSession({ children }: { children?: ReactNode }) {
  const hasSession = useTableSessionStore((s) => s.hasSession);

  if (!hasSession()) return <Navigate to="/mesa" replace />;
  return <>{children ?? <Outlet />}</>;
}
