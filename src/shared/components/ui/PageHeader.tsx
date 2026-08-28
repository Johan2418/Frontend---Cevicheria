import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Primary actions for the page, rendered right-aligned on wider screens. */
  action?: ReactNode;
}

/**
 * The title block every staff page opens with. Previously copy-pasted as a
 * bare `h1 + p` across all eleven of them.
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
        {description && <p className="text-sm text-stone-500">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
