'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '@buffethub/validation';
import { requestPasswordResetAction } from '@/lib/actions/auth';
import { applyServerErrors } from '@/lib/forms';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import type { ActionState } from '@/lib/actions/types';

type FormValues = { email: string };

export function ForgotPasswordForm() {
  const [state, setState] = useState<ActionState>({ status: 'idle' });
  const form = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema) as unknown as Resolver<FormValues>,
    defaultValues: { email: '' },
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = form.handleSubmit(async () => {
    setState({ status: 'idle' });
    const result = await requestPasswordResetAction({ email: form.getValues().email });
    if (result.status === 'error') {
      applyServerErrors(form.setError, result.fieldErrors);
    }
    setState(result);
  });

  if (state.status === 'success') {
    return <Alert variant="success">{state.message}</Alert>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {state.status === 'error' ? <Alert variant="error">{state.message}</Alert> : null}
      <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : null}
        Enviar instruções
      </Button>
    </form>
  );
}
