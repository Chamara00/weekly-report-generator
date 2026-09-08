'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from './field-error';

/**
 * A plain list of text rows: next week's planned tasks, and the links list.
 * No flag, no extra fields -- kept separate from FlaggedList so neither grows
 * conditionals for the other's behaviour.
 */
export function SimpleList({
  legend,
  description,
  values,
  placeholder,
  addLabel,
  fieldPrefix,
  errors,
  disabled,
  onChange,
}: {
  legend: string;
  description: string;
  values: string[];
  placeholder: string;
  addLabel: string;
  fieldPrefix: string;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <div>
        <legend className="text-sm font-medium">{legend}</legend>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>

      {values.length === 0 ? (
        <p className="text-muted-foreground text-sm">None added.</p>
      ) : (
        <div className="space-y-2">
          {values.map((value, index) => (
            <div key={index}>
              <div className="flex items-center gap-2">
                <Input
                  value={value}
                  disabled={disabled}
                  placeholder={placeholder}
                  aria-label={`${legend} ${index + 1}`}
                  aria-invalid={Boolean(errors[`${fieldPrefix}.${index}`])}
                  onChange={(event) =>
                    onChange(values.map((item, i) => (i === index ? event.target.value : item)))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onChange(values.filter((_, i) => i !== index))}
                  aria-label={`Remove ${legend} ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <FieldError
                message={
                  errors[`${fieldPrefix}.${index}`] ?? errors[`${fieldPrefix}.${index}.name`]
                }
              />
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...values, ''])}
      >
        {addLabel}
      </Button>
    </fieldset>
  );
}
