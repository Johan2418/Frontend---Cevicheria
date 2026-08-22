import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableSessionStore } from './tableSession';

export function RequireTableSession({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const hasSession = useTableSessionStore((s) => s.hasSession);

  useEffect(() => {
    if (!hasSession()) {
      navigate('/mesa', { replace: true });
    }
  }, [hasSession, navigate]);

  if (!hasSession()) return null;
  return <>{children}</>;
}
