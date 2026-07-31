'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  forgotPasswordSchema,
  passwordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordInput,
  type SignInInput,
  type SignUpInput,
} from '@buffethub/validation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/env';
import type { ActionState } from './types';

export async function signInAction(
  input: SignInInput,
  redirectTo?: string,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Verifique os campos destacados.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { status: 'error', message: 'E-mail ou senha inválidos.' };
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/painel');
}

export async function signUpAction(input: SignUpInput): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Verifique os campos destacados.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    const message = /already registered|already exists/i.test(error.message)
      ? 'Já existe uma conta com este e-mail.'
      : 'Não foi possível concluir o cadastro. Tente novamente.';
    return { status: 'error', message };
  }

  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/painel');
  }

  return {
    status: 'success',
    message: 'Enviamos um link de confirmação para o seu e-mail.',
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function requestPasswordResetAction(
  input: ForgotPasswordInput,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Informe um e-mail válido.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/redefinir-senha`,
  });

  // Resposta genérica para não revelar se o e-mail existe.
  return {
    status: 'success',
    message: 'Se houver uma conta com esse e-mail, enviaremos instruções.',
  };
}

const updatePasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export async function updatePasswordAction(input: {
  password: string;
  confirmPassword: string;
}): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Verifique os campos destacados.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      status: 'error',
      message: 'Link expirado ou inválido. Solicite a redefinição novamente.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/painel');
}
