import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderAge } from './OrderAge';

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

describe('OrderAge', () => {
  it('shows how long a live ticket has been waiting', () => {
    render(<OrderAge createdAt={minutesAgo(7)} status="PREPARING" />);
    expect(screen.getByText('7m')).toBeInTheDocument();
  });

  it('stays calm below the warning threshold', () => {
    const { container } = render(<OrderAge createdAt={minutesAgo(5)} status="PENDING" />);
    const el = container.firstElementChild!;
    expect(el.className).not.toMatch(/bg-amber|bg-red/);
  });

  it('warns once a ticket passes ten minutes', () => {
    const { container } = render(<OrderAge createdAt={minutesAgo(12)} status="PENDING" />);
    expect(container.firstElementChild!.className).toMatch(/bg-amber/);
  });

  it('escalates to late once a ticket passes twenty minutes', () => {
    const { container } = render(<OrderAge createdAt={minutesAgo(25)} status="READY" />);
    expect(container.firstElementChild!.className).toMatch(/bg-red/);
  });

  it('does not escalate a delivered ticket — its age is history, not a queue', () => {
    const { container } = render(<OrderAge createdAt={minutesAgo(90)} status="DELIVERED" />);
    expect(container.firstElementChild!.className).not.toMatch(/bg-amber|bg-red/);
  });

  it('exposes the wait in words for screen readers', () => {
    render(<OrderAge createdAt={minutesAgo(12)} status="PENDING" />);
    expect(screen.getByLabelText('Esperando 12 minutos')).toBeInTheDocument();
  });
});
