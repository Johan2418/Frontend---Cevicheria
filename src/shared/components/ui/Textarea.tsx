import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-stone-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition-colors placeholder:text-stone-400 focus:outline-2 focus:outline-offset-0 focus:outline-brand-600 disabled:cursor-not-allowed disabled:bg-stone-100',
            error ? 'border-red-500' : 'border-stone-300',
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-stone-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
