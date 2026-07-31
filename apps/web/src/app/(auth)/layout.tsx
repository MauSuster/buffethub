import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, PartyPopper, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const highlights = [
  { icon: Star, text: 'Fornecedores avaliados por clientes reais' },
  { icon: ShieldCheck, text: 'Pagamento protegido, liberado só após a confirmação' },
  { icon: Sparkles, text: 'Orçamentos personalizados direto com quem realiza' },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="confetti absolute inset-0 opacity-20" aria-hidden />
        <Link
          href="/"
          className="relative inline-flex items-center gap-2 font-display text-lg font-semibold"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary-foreground text-primary">
            <PartyPopper className="h-4 w-4" />
          </span>
          BuffetHub
        </Link>

        <div className="relative max-w-sm space-y-6">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Tudo para o seu evento, em um só lugar.
          </h2>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-start gap-2.5">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} BuffetHub
        </p>
      </aside>

      <div className="flex flex-col">
        <div className="p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao início
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
