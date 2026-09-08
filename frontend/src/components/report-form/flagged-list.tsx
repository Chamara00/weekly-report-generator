'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from './field-error';

interface FlaggedItem {
  description: string;
  flagged: boolean;
}

/**
 * Blockers and achievements: a list where exactly one item can be flagged.
 *
 * The flag is a RADIO group, not checkboxes. The backend rejects more than one
 * flagged item per report (@AtMostOneFlag), so the control that cannot express
 * an invalid state is the right one -- selecting a new key item clears the old.
 */
export function FlaggedList({
  legend,
  description,
  items,
  keyLabel,
  fieldPrefix,
  errors,
  disabled,
  addLabel,
  onChange,
}: {
  legend: string;
  description: string;
  items: FlaggedItem[];
  keyLabel: string;
  /** Matches the API's error paths, e.g. "blockers". */
  fieldPrefix: string;
  errors: Record<string, string>;
  disabled: boolean;
  addLabel: string;
  onChange: (items: FlaggedItem[]) => void;
}) {
  function update(index: number, changes: Partial<FlaggedItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  }

  function setFlag(index: number) {
    // Radio semantics: flagging one clears every other.
    onChange(items.map((item, i) => ({ ...item, flagged: i === index })));
  }

  return (
    <fieldset className="space-y-3">
      <div>
        <legend className="text-sm font-medium">{legend}</legend>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">None added.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex flex-wrap items-start gap-2 rounded-md border p-3">
              <div className="min-w-[12rem] flex-1">
                <Input
                  value={item.description}
                  disabled={disabled}
                  placeholder={legend}
                  aria-label={`${legend} ${index + 1}`}
                  aria-invalid={Boolean(errors[`${fieldPrefix}.${index}.description`])}
                  onChange={(event) => update(index, { description: event.target.value })}
                />
                <FieldError message={errors[`${fieldPrefix}.${index}.description`]} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="radio"
                  id={`${fieldPrefix}-key-${index}`}
                  name={`${fieldPrefix}-key`}
                  checked={item.flagged}
                  disabled={disabled}
                  onChange={() => setFlag(index)}
                  className="accent-primary h-4 w-4"
                />
                <Label htmlFor={`${fieldPrefix}-key-${index}`} className="text-xs font-normal">
                  {keyLabel}
                </Label>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                  aria-label={`Remove ${legend} ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...items, { description: '', flagged: false }])}
      >
        {addLabel}
      </Button>
    </fieldset>
  );
}
