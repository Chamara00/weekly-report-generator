/** Inline validation message, shared by every field in the report form. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-destructive mt-1 text-xs">{message}</p>;
}
