import { useEffect, type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTableSessionStore } from './tableSession';
import { useToast } from '@/shared/components/ui/Toast';

/**
 * Sends the diner back to the QR landing when there is no live table session.
 * Applied once at the route level, so a new page under /mesa cannot forget it.
 * Redirects declaratively rather than from an effect, which avoids rendering a
 * blank frame before the navigation happens.
 */
export function RequireTableSession({ children }: { children?: ReactNode }) {
  const hasSession = useTableSessionStore((s) => s.hasSession);
  const pruneIfExpired = useTableSessionStore((s) => s.pruneIfExpired);
  const token = useTableSessionStore((s) => s.token);
  const { toast } = useToast();

  useEffect(() => {
    // An expired session is cleared before redirecting, so the landing screen
    // does not bounce back to the menu with a token the backend rejects.
    if (pruneIfExpired()) {
      toast({
        tone: 'warning',
        title: 'Tu sesión de mesa venció',
        description: 'Escanea otra vez el QR de la mesa para seguir pidiendo.',
      });
    }
  }, [pruneIfExpired, toast, token]);

  if (!hasSession()) return <Navigate to="/mesa" replace />;
  return <>{children ?? <Outlet />}</>;
}
