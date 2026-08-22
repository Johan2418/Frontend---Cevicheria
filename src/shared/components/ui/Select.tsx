import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, placeholder, id, className, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-stone-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-sm text-stone-900 shadow-sm transition-colors focus:outline-2 focus:outline-offset-0 focus:outline-brand-600 disabled:cursor-not-allowed disabled:bg-stone-100',
              error ? 'border-red-500' : 'border-stone-300',
              className,
            )}
            {...props}
          >
            {placeholder !== undefined && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
        </div>
        {error ? (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-stone-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = 'Select';
