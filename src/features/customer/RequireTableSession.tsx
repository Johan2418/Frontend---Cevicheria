import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableSessionStore } from './tableSession';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { useToast } from '@/shared/components/ui/Toast';

export function RequireTableSession({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const hasSession = useTableSessionStore((s) => s.hasSession);
  const pruneIfExpired = useTableSessionStore((s) => s.pruneIfExpired);
  const token = useTableSessionStore((s) => s.token);
  const { toast } = useToast();

  useEffect(() => {
    // Una sesión vencida se limpia antes de redirigir, para que la pantalla de
    // inicio no vuelva a rebotar al menú con un token que el backend rechaza.
    const expired = pruneIfExpired();
    if (expired) {
      toast({
        tone: 'warning',
        title: 'Tu sesión de mesa venció',
        description: 'Escaneá otra vez el QR de la mesa para seguir pidiendo.',
      });
    }
    if (expired || !hasSession()) {
      navigate('/mesa', { replace: true });
    }
  }, [hasSession, pruneIfExpired, navigate, toast, token]);

  if (!hasSession()) return <FullPageSpinner label="Verificando tu mesa…" />;
  return <>{children}</>;
}
