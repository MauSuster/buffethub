import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

const groups: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: 'Descobrir',
    links: [
      { label: 'Explorar fornecedores', href: '/busca' },
      { label: 'Categorias', href: '/categorias' },
    ],
  },
  {
    title: 'Fornecedores',
    links: [
      { label: 'Anuncie seu negócio', href: '/cadastrar' },
      { label: 'Área do fornecedor', href: '/painel/meu-negocio' },
    ],
  },
  {
    title: 'Conta',
    links: [
      { label: 'Entrar', href: '/entrar' },
      { label: 'Criar conta', href: '/cadastrar' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            O marketplace para contratar buffets e serviços de eventos com confiança — do
            orçamento ao grande dia.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.title} className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{group.title}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} BuffetHub. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
