import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/forms/reset-password-form';

export const metadata: Metadata = { title: 'Definir nova senha' };

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Definir nova senha</h1>
        <p className="mt-2 text-muted-foreground">
          Escolha uma nova senha para sua conta. Este link é válido por tempo limitado.
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
