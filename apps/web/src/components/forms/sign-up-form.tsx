'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpInput } from '@buffethub/validation';
import { maskPhoneBR } from '@buffethub/utils';
import { signUpAction } from '@/lib/actions/auth';
import { applyServerErrors } from '@/lib/forms';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import type { ActionState } from '@/lib/actions/types';

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  marketingOptIn: boolean;
};

export function SignUpForm() {
  const [state, setState] = useState<ActionState>({ status: 'idle' });
  const form = useForm<FormValues>({
    resolver: zodResolver(signUpSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
      acceptedPrivacy: false,
      marketingOptIn: false,
    },
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const phoneField = register('phone');

  const onSubmit = form.handleSubmit(async () => {
    setState({ status: 'idle' });
    const v = form.getValues();
    const input = {
      fullName: v.fullName,
      email: v.email,
      phone: v.phone,
      password: v.password,
      confirmPassword: v.confirmPassword,
      acceptedTerms: true,
      acceptedPrivacy: true,
      marketingOptIn: Boolean(v.marketingOptIn),
    } as SignUpInput;
    const result = await signUpAction(input);
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

      <Field label="Nome completo" htmlFor="fullName" error={errors.fullName?.message} required>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Maria da Silva"
          aria-invalid={!!errors.fullName}
          {...register('fullName')}
        />
      </Field>

      <Field label="E-mail" htmlFor="email" error={errors.email?.message} required>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
      </Field>

      <Field label="Celular" htmlFor="phone" error={errors.phone?.message} required>
        <Input
          id="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 91234-5678"
          aria-invalid={!!errors.phone}
          {...phoneField}
          onChange={(event) => {
            event.target.value = maskPhoneBR(event.target.value);
            void phoneField.onChange(event);
          }}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Senha" htmlFor="password" error={errors.password?.message} required>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mín. 8 caracteres"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </Field>
        <Field
          label="Confirmar senha"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </Field>
      </div>

      <div className="space-y-2 pt-1">
        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox {...register('acceptedTerms')} />
          <span>
            Li e aceito os <span className="font-medium text-foreground">Termos de Uso</span>.
          </span>
        </label>
        {errors.acceptedTerms ? (
          <p className="text-xs font-medium text-destructive">{errors.acceptedTerms.message}</p>
        ) : null}

        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox {...register('acceptedPrivacy')} />
          <span>
            Li e aceito a{' '}
            <span className="font-medium text-foreground">Política de Privacidade</span>.
          </span>
        </label>
        {errors.acceptedPrivacy ? (
          <p className="text-xs font-medium text-destructive">{errors.acceptedPrivacy.message}</p>
        ) : null}

        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox {...register('marketingOptIn')} />
          <span>Quero receber novidades e ofertas por e-mail.</span>
        </label>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : null}
        Criar conta
      </Button>
    </form>
  );
}
