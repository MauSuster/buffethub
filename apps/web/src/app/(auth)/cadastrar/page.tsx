import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUpForm } from '@/components/forms/sign-up-form';

export const metadata: Metadata = { title: 'Criar conta' };

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Crie sua conta</h1>
        <p className="mt-2 text-muted-foreground">
          Leva menos de um minuto. Para clientes e fornecedores.
        </p>
      </div>

      <SignUpForm />

      <p className="text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/entrar" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
