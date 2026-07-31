import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { FieldErrors } from '@/lib/actions/types';

/** Mapeia os erros de campo retornados por uma Server Action para o react-hook-form. */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors?: FieldErrors,
): void {
  if (!fieldErrors) return;
  for (const [key, messages] of Object.entries(fieldErrors)) {
    const first = messages?.[0];
    if (first) {
      setError(key as Path<T>, { type: 'server', message: first });
    }
  }
}

export function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
