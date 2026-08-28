import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  /** Shown instead of the default panel, e.g. a diner-friendly message. */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors so one broken screen cannot blank the whole app.
 * Mounted separately around the customer and staff outlets, so a failure in
 * the kitchen board never takes down table ordering.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-stone-200 bg-white p-8 text-center"
      >
        <AlertTriangle className="size-10 text-amber-500" aria-hidden />
        <h2 className="text-lg font-semibold text-stone-900">Algo salió mal</h2>
        <p className="text-sm text-stone-500">
          No pudimos mostrar esta sección. Probá de nuevo; si sigue fallando, recargá la página.
        </p>
        <Button onClick={this.reset}>Reintentar</Button>
      </div>
    );
  }
}
