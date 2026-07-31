import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form';

export const metadata: Metadata = { title: 'Recuperar senha' };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Recuperar senha</h1>
        <p className="mt-2 text-muted-foreground">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-sm text-muted-foreground">
        Lembrou a senha?{' '}
        <Link href="/entrar" className="font-medium text-primary hover:underline">
          Voltar para entrar
        </Link>
      </p>
    </div>
  );
}
