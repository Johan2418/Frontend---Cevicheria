import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { cn } from '@/shared/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  hint?: string;
}

/**
 * The whole row is the hit area, not just the 16px box, so it stays usable on
 * a tablet in the middle of service.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, id, className, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div>
        <label
          htmlFor={inputId}
          className={cn(
            'flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-stone-700',
            disabled && 'cursor-not-allowed opacity-60',
            className,
          )}
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            disabled={disabled}
            aria-describedby={hint ? `${inputId}-hint` : undefined}
            className="size-4 shrink-0 rounded border-stone-300 accent-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            {...props}
          />
          {label}
        </label>
        {hint && (
          <p id={`${inputId}-hint`} className="ml-6.5 text-sm text-stone-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';

/**
 * Checkbox bound to a react-hook-form control. Replaces the hand-rolled copies
 * that previously lived in CatalogPage and TablesPage.
 */
export function FormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  hint,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Checkbox
          label={label}
          hint={hint}
          checked={Boolean(field.value)}
          onChange={(e) => field.onChange(e.target.checked)}
          onBlur={field.onBlur}
          ref={field.ref}
        />
      )}
    />
  );
}
