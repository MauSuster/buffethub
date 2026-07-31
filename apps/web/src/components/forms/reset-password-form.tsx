'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { updatePasswordAction } from '@/lib/actions/auth';
import { applyServerErrors } from '@/lib/forms';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import type { ActionState } from '@/lib/actions/types';

type FormValues = { password: string; confirmPassword: string };

export function ResetPasswordForm() {
  const [state, setState] = useState<ActionState>({ status: 'idle' });
  const form = useForm<FormValues>({
    defaultValues: { password: '', confirmPassword: '' },
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = form.handleSubmit(async (values) => {
    setState({ status: 'idle' });
    const result = await updatePasswordAction(values);
    if (result.status === 'error') {
      applyServerErrors(form.setError, result.fieldErrors);
      setState(result);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {state.status === 'error' ? <Alert variant="error">{state.message}</Alert> : null}
      <Field label="Nova senha" htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mín. 8 caracteres"
          aria-invalid={!!errors.password}
          {...register('password', { required: 'Informe a nova senha' })}
        />
      </Field>
      <Field
        label="Confirmar nova senha"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          aria-invalid={!!errors.confirmPassword}
          {...register('confirmPassword', { required: 'Confirme a nova senha' })}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : null}
        Salvar nova senha
      </Button>
    </form>
  );
}
