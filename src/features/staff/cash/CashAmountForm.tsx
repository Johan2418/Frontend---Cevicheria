import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { dollarsToCents } from '@/shared/lib/money';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

/**
 * Both cash forms capture an amount in dollars, because that is what the user
 * counts in the drawer. The API stores integer cents, so the conversion happens
 * on submit — never bind a dollar input straight to a *Cents field.
 */
const amountSchema = z.object({
  amount: z
    .number({ message: 'Ingresá un monto' })
    .min(0, 'Debe ser 0 o más')
    .max(1_000_000, 'Monto demasiado alto'),
});

type AmountForm = z.infer<typeof amountSchema>;

export function CashAmountForm({
  label,
  submitLabel,
  icon,
  variant,
  onSubmit,
  loading,
}: {
  label: string;
  submitLabel: string;
  icon: ReactNode;
  variant?: 'primary' | 'danger';
  onSubmit: (cents: number) => void;
  loading: boolean;
}) {
  const form = useForm<AmountForm>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: 0 },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const cents = dollarsToCents(values.amount);
    if (cents === null) {
      form.setError('amount', { message: 'Ingresá un monto válido' });
      return;
    }
    onSubmit(cents);
  });

  return (
    <form className="flex max-w-md items-end gap-3" onSubmit={handleSubmit} noValidate>
      <div className="flex-1">
        <Input
          label={label}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          error={form.formState.errors.amount?.message}
          {...form.register('amount', { valueAsNumber: true })}
        />
      </div>
      <Button type="submit" variant={variant} loading={loading}>
        {icon} {submitLabel}
      </Button>
    </form>
  );
}
