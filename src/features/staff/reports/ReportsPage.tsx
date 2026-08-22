import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/shared/api/reports';
import { MOVEMENT_TYPE_LABEL } from '@/shared/api/inventory';
import { PAYMENT_METHOD_LABEL } from '@/shared/api/payments';
import { formatMoney } from '@/shared/lib/money';
import { formatDate } from '@/shared/lib/date';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';

export function ReportsPage() {
  const reportQuery = useQuery({ queryKey: ['report', 'current'], queryFn: reportsApi.current });

  if (reportQuery.isPending) return <FullPageSpinner />;
  if (reportQuery.isError || !reportQuery.data) {
    return <EmptyState title="No hay reporte disponible" description="Abrí la jornada para ver el reporte." />;
  }

  const report = reportQuery.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Reporte</h1>
        <p className="text-sm text-stone-500">Resumen de la jornada del {formatDate(report.businessDate)}</p>
      </div>

      <Card>
        <CardHeader title="Ventas" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-4">
            <Metric label="Pedidos entregados" value={String(report.sales.deliveredOrderCount)} />
            <Metric label="Total" value={formatMoney(report.sales.totalCents)} />
            <Metric label="Ventas app" value={formatMoney(report.sales.appCents)} />
            <Metric label="Ventas manuales" value={formatMoney(report.sales.manualCents)} />
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader title="Pagos verificados" description="Por método de pago" />
          <CardBody>
            {report.verifiedPayments.length === 0 ? (
              <p className="text-sm text-stone-500">Sin pagos verificados todavía.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {report.verifiedPayments.map((p, i) => (
                  <li key={i} className="flex justify-between py-2 text-sm">
                    <span className="text-stone-600">{PAYMENT_METHOD_LABEL[p.method]}</span>
                    <span className="font-semibold text-stone-900">{formatMoney(p.amountCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Movimientos de inventario" description="Cantidad neta por tipo" />
          <CardBody>
            {report.inventoryMovements.length === 0 ? (
              <p className="text-sm text-stone-500">Sin movimientos registrados.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {report.inventoryMovements.map((m, i) => (
                  <li key={i} className="flex justify-between py-2 text-sm">
                    <span className="text-stone-600">{MOVEMENT_TYPE_LABEL[m.movementType]}</span>
                    <span className="font-semibold text-stone-900">
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-50 p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
    </div>
  );
}
