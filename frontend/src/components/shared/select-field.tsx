'use client';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * A labelled dropdown built on the native <select>.
 *
 * Deliberately not the shadcn/Base UI Select: that one renders the raw value in
 * its trigger unless it is also given an items map, so a project dropdown would
 * show a cuid instead of "Client A". A native select maps value to label for
 * free, is keyboard- and screen-reader-correct with no extra code, and opens
 * the OS picker on mobile.
 */
export function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  disabled,
  invalid,
  className,
  onChange,
}: {
  id: string;
  label?: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'border-input bg-background flex h-9 w-full rounded-lg border px-3 py-1 text-sm shadow-xs outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20',
          'dark:bg-input/30',
        )}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
