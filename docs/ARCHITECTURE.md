# Arquitetura

## Visão geral

BuffetHub é um monorepo com três alvos de execução (web, mobile, backend) que
compartilham regras de negócio, validação e tipos através de pacotes internos.
O objetivo é uma única fonte de verdade para domínio e validação, evitando
divergência entre plataformas.

```
                ┌──────────────┐     ┌──────────────┐
   Cliente ───▶ │  apps/web    │     │ apps/mobile  │ ◀── Cliente/Empresa
                │  (Next.js)   │     │  (Expo)      │
                └──────┬───────┘     └──────┬───────┘
                       │  usam os mesmos pacotes │
             ┌─────────┴─────────────────────────┴─────────┐
             │  packages: domain · validation · utils · ui │
             └─────────────────────┬───────────────────────┘
                                   │
                          ┌────────┴────────┐
                          │    Supabase     │
                          │ Postgres + RLS  │
                          │ Auth · Storage  │
                          │ Realtime · Edge │
                          └────────┬────────┘
                                   │ webhooks assinados
                          ┌────────┴────────┐
                          │  Mercado Pago   │
                          └─────────────────┘
```

## Princípios

- **TypeScript estrito em tudo** (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`).
- **Regras de negócio centralizadas** em pacotes, fora dos componentes visuais.
- **Validação única (Zod)** compartilhada por web, mobile e backend. O cliente
  nunca é a única linha de defesa — toda operação sensível é revalidada no servidor.
- **Dinheiro sempre em centavos inteiros** — nunca `float`; conversão só na borda.
- **Segurança por padrão**: RLS ativa, service role só no servidor, webhooks com
  assinatura e idempotência, menor privilégio.

## Pacotes compartilhados

| Pacote                  | Responsabilidade                                                    |
| ----------------------- | ------------------------------------------------------------------- |
| `@buffethub/domain`     | Enums e tipos de domínio (fonte única, espelhada pelos enums SQL).  |
| `@buffethub/utils`      | Dinheiro (centavos), formatação pt-BR, máscaras, comissões.         |
| `@buffethub/validation` | Validadores BR (CPF/CNPJ) e schemas Zod com mensagens em português. |
| `@buffethub/ui`         | Componentes visuais reutilizáveis (adicionado na fase 2).           |
| `@buffethub/database`   | Tipos gerados do schema + repositórios tipados (fase 2).            |

## Camada por domínio (a expandir nas fases 2+)

Cada feature de negócio segue a mesma anatomia, para previsibilidade:

```
features/<dominio>/
├── types.ts        # tipos do domínio
├── schemas.ts      # Zod (reexporta de @buffethub/validation)
├── repository.ts   # acesso a dados (Supabase), sem regra de negócio
├── service.ts      # regra de negócio, transações
├── actions.ts      # Server Actions / Route Handlers (borda)
├── errors.ts       # erros tipados (códigos padronizados)
└── __tests__/
```

Erros usam códigos padronizados (`AUTH_REQUIRED`, `FORBIDDEN`, `VALIDATION_ERROR`,
`NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `PAYMENT_FAILED`, `PROVIDER_NOT_APPROVED`,
`DATE_UNAVAILABLE`, `QUOTE_EXPIRED`, `PROPOSAL_EXPIRED`).

## Fluxos críticos (resumo)

- **Contratação**: orçamento → proposta (versionada e imutável após aceite) →
  pedido com _snapshot_ da proposta/empresa/regras → pagamento → confirmação por
  webhook. O pedido nunca é marcado como pago pelo retorno do frontend.
- **Disponibilidade**: reserva usa transação + restrição no banco para impedir
  dupla reserva; a disponibilidade é revalidada imediatamente antes de contratar.
- **Financeiro**: toda movimentação é registrada em _ledger_ imutável; a
  comissão respeita a invariante _bruto = plataforma + gateway + líquido_.

## Ambientes

`local` · `development` · `staging` · `production`. Segredos por ambiente; nunca
no repositório. Deploy: web na Vercel, banco no Supabase, mobile via EAS.
