import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  CalendarClock,
  Banknote,
  UtensilsCrossed,
  Package,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/shared/auth/store';
import { PERMISSIONS } from '@/shared/lib/permissions';
import { inventoryApi } from '@/shared/api/inventory';
import { cashApi } from '@/shared/api/cash';
import { reportsApi } from '@/shared/api/reports';
import { formatMoney } from '@/shared/lib/money';
import { formatDate, formatTime } from '@/shared/lib/date';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { StatCard } from '@/shared/components/ui/StatCard';
import { cn } from '@/shared/lib/cn';
import { queryKeys } from '@/shared/api/queryKeys';

export function DashboardPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const dayQuery = useQuery({
    queryKey: queryKeys.businessDay.current,
    queryFn: inventoryApi.getCurrentBusinessDay,
    retry: false,
    enabled: hasPermission(PERMISSIONS.INVENTORY_READ),
  });

  const cashQuery = useQuery({
    queryKey: queryKeys.cash.current,
    queryFn: cashApi.current,
    retry: false,
    enabled: hasPermission(PERMISSIONS.CASH_READ),
  });

  const reportQuery = useQuery({
    queryKey: queryKeys.reports.current,
    queryFn: reportsApi.current,
    enabled: hasPermission(PERMISSIONS.REPORT_READ),
  });

  const dayOpen = Boolean(dayQuery.data);
  const cashOpen = Boolean(cashQuery.data);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Panel" description="Estado general de la operación de hoy" />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatusCard
          icon={<CalendarClock className="size-5" aria-hidden />}
          title="Jornada"
          status={dayOpen ? 'open' : 'closed'}
          statusLabel={dayOpen ? 'Abierta' : 'Cerrada'}
          detail={
            dayOpen && dayQuery.data
              ? `Abierta el ${formatDate(dayQuery.data.businessDate)} a las ${formatTime(dayQuery.data.openedAt)}`
              : 'No hay jornada abierta'
          }
          actionLabel={dayOpen ? 'Ver inventario' : 'Abrir jornada'}
          actionTo="/admin/jornada"
        />

        <StatusCard
          icon={<Banknote className="size-5" aria-hidden />}
          title="Caja"
          status={cashOpen ? 'open' : 'closed'}
          statusLabel={cashOpen ? 'Abierta' : 'Cerrada'}
          detail={cashOpen ? `Fondo: ${formatMoney(cashQuery.data?.cashSession.openingCents ?? 0)}` : 'No hay caja abierta'}
          actionLabel={cashOpen ? 'Ver caja' : 'Abrir caja'}
          actionTo="/admin/caja"
        />
      </div>

      {hasPermission(PERMISSIONS.REPORT_READ) && reportQuery.data && (
        <Card>
          <CardHeader title="Resumen de ventas" description={`Jornada del ${formatDate(reportQuery.data.businessDate)}`} />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard label="Pedidos entregados" value={String(reportQuery.data.sales.deliveredOrderCount)} />
              <StatCard label="Total vendido" value={formatMoney(reportQuery.data.sales.totalCents)} />
              <StatCard label="Ventas app" value={formatMoney(reportQuery.data.sales.appCents)} />
              <StatCard label="Ventas manuales" value={formatMoney(reportQuery.data.sales.manualCents)} />
            </div>
          </CardBody>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Accesos rápidos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink to="/admin/cocina" icon={<UtensilsCrossed className="size-5" aria-hidden />} label="Cocina" />
          <QuickLink to="/admin/inventario" icon={<Package className="size-5" aria-hidden />} label="Inventario" />
          <QuickLink to="/admin/reportes" icon={<BarChart3 className="size-5" aria-hidden />} label="Reportes" />
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  status,
  statusLabel,
  detail,
  actionLabel,
  actionTo,
}: {
  icon: ReactNode;
  title: string;
  status: 'open' | 'closed';
  statusLabel: string;
  detail: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              {icon}
            </span>
            <div>
              <p className="font-semibold text-stone-900">{title}</p>
              <p className="text-sm text-stone-500">{detail}</p>
            </div>
          </div>
          <Badge tone={status === 'open' ? 'success' : 'neutral'}>{statusLabel}</Badge>
        </div>
        <Link
          to={actionTo}
          className={cn(
            'mt-4 inline-flex items-center gap-1 text-sm font-medium',
            status === 'open' ? 'text-stone-600 hover:text-stone-900' : 'text-brand-700 hover:text-brand-800',
          )}
        >
          {actionLabel} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardBody>
    </Card>
  );
}


function QuickLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        {icon}
      </span>
      <span className="font-medium text-stone-800">{label}</span>
      <ArrowRight className="ml-auto size-4 text-stone-400" aria-hidden />
    </Link>
  );
}
