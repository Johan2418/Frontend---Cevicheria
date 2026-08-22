import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, UtensilsCrossed, Waves } from 'lucide-react';
import { tablesApi } from '@/shared/api/tables';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useTableSessionStore } from './tableSession';

export function TableLandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { hasSession, setSession } = useTableSessionStore();
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState('');
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (hasSession()) {
      navigate('/mesa/menu', { replace: true });
    }
  }, [hasSession, navigate]);

  useEffect(() => {
    if (token) {
      void exchange(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function exchange(raw: string) {
    setLoading(true);
    setError(null);
    try {
      const qrToken = extractToken(raw);
      const result = await tablesApi.exchangeToken(qrToken);
      setSession(result.table, result.tableSessionToken, result.expiresAt);
      toast({ tone: 'success', title: `Bienvenido a la mesa ${result.table.code}` });
      navigate('/mesa/menu', { replace: true });
    } catch (e) {
      setError(toastError(e).description ?? 'No se pudo validar la mesa');
    } finally {
      setLoading(false);
    }
  }

  function extractToken(raw: string): string {
    const trimmed = raw.trim();
    try {
      const url = new URL(trimmed);
      return url.searchParams.get('token') ?? trimmed;
    } catch {
      return trimmed;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3" role="status">
        <Spinner className="size-8" />
        <p className="text-sm text-stone-500">Validando tu mesa…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-brand-700 text-white shadow-lg">
        <Waves className="size-10" aria-hidden />
      </div>
      <h1 className="font-display text-4xl text-brand-800">CholosBar</h1>
      <p className="mt-2 max-w-sm text-stone-600">
        Escaneá el código QR de tu mesa para ver el menú y hacer tu pedido sin levantarte.
      </p>

      <div className="mt-8 w-full max-w-sm space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
          <UtensilsCrossed className="size-5 shrink-0" aria-hidden />
          <span>¿Ya escaneaste? Revisá que te haya llevado al menú.</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) void exchange(manual);
          }}
          className="space-y-2"
        >
          <Input
            label="¿Tienes el enlace o token del QR?"
            placeholder="Pegá el enlace o el token"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            error={error ?? undefined}
          />
          <Button type="submit" className="w-full" size="lg" disabled={!manual.trim()}>
            <QrCode className="size-5" aria-hidden />
            Ingresar a mi mesa
          </Button>
        </form>
      </div>
    </div>
  );
}
