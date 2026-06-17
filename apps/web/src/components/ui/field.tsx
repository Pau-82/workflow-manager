import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

const CONTROL_BASE =
  'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50';

function controlClasses(hasError: boolean): string {
  return cn(
    CONTROL_BASE,
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
  );
}

/** Envoltorio label + control + slot de error. Compartido por inputs y selects. */
function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/** Input de texto/número con label y error. */
export function Field({ label, error, hint, id, className, ...rest }: FieldProps) {
  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint}>
      <input
        id={id}
        className={cn(controlClasses(Boolean(error)), className)}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextareaFieldProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/** Textarea con label y error. */
export function TextareaField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: TextareaFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint}>
      <textarea
        id={id}
        className={cn(controlClasses(Boolean(error)), 'min-h-20', className)}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Select con label y error (las <option> van como children). */
export function SelectField({
  label,
  error,
  hint,
  id,
  className,
  children,
  ...rest
}: SelectFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint}>
      <select
        id={id}
        className={cn(controlClasses(Boolean(error)), className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}
