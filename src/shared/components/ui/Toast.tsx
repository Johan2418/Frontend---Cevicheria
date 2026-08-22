import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (input: { tone?: ToastTone; title: string; description?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneIcons: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-5 text-emerald-500" aria-hidden />,
  error: <XCircle className="size-5 text-red-500" aria-hidden />,
  info: <Info className="size-5 text-sky-500" aria-hidden />,
  warning: <AlertTriangle className="size-5 text-amber-500" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: { tone?: ToastTone; title: string; description?: string }) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, tone: input.tone ?? 'info', ...input }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-lg"
          >
            <div className="mt-0.5 shrink-0">{toneIcons[t.tone]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-stone-500">{t.description}</p>}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="rounded p-0.5 text-stone-400 hover:text-stone-600"
              aria-label="Cerrar notificación"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return ctx;
}

export function toastError(e: unknown): { tone: ToastTone; title: string; description?: string } {
  if (e && typeof e === 'object' && 'message' in e) {
    return {
      tone: 'error',
      title: 'Ocurrió un error',
      description: String((e as { message: string }).message),
    };
  }
  return { tone: 'error', title: 'Ocurrió un error inesperado' };
}
