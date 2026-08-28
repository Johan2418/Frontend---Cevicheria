import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CashAmountForm } from './CashAmountForm';

function setup() {
  const onSubmit = vi.fn();
  render(
    <CashAmountForm
      label="Fondo inicial (USD)"
      submitLabel="Abrir caja"
      icon={null}
      onSubmit={onSubmit}
      loading={false}
    />,
  );
  return { onSubmit, user: userEvent.setup() };
}

const field = () => screen.getByLabelText('Fondo inicial (USD)');
const submit = () => screen.getByRole('button', { name: /Abrir caja/i });

describe('CashAmountForm', () => {
  // The original defect: a dollar input was bound straight to a *Cents field,
  // so $50.00 of float was stored as $0.50 and corrupted the reconciliation.
  it('submits dollars as integer cents', async () => {
    const { onSubmit, user } = setup();

    await user.clear(field());
    await user.type(field(), '50');
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith(5000);
  });

  it('accepts cents and does not reject a decimal amount', async () => {
    const { onSubmit, user } = setup();

    await user.clear(field());
    await user.type(field(), '12.50');
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith(1250);
  });

  it('allows a zero float', async () => {
    const { onSubmit, user } = setup();

    await user.clear(field());
    await user.type(field(), '0');
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith(0);
  });

  it('refuses a negative amount', async () => {
    const { onSubmit, user } = setup();

    await user.clear(field());
    await user.type(field(), '-5');
    await user.click(submit());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Debe ser 0 o más');
  });

  it('refuses an empty amount instead of sending NaN', async () => {
    const { onSubmit, user } = setup();

    await user.clear(field());
    await user.click(submit());

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
