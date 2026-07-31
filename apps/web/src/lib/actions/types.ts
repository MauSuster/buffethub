export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: FieldErrors }
  | { status: 'success'; message?: string };

export const idle: ActionState = { status: 'idle' };
