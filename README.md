# BuffetHub

Marketplace para contratação de buffets, catering e fornecedores de eventos —
web (Next.js), mobile (Expo) e backend (Supabase/PostgreSQL).

> **Estado atual do repositório.** Este repositório contém a **fundação
> arquitetural verificada** (Fase 1 do roadmap): monorepo configurado, schema do
> banco com RLS, e pacotes compartilhados de domínio, validação e utilitários
> com testes reais. Os apps `web` e `mobile` e os módulos de negócio das fases
> seguintes são adicionados sobre esta base, na ordem do [roadmap](#roadmap). O
> que já está implementado foi validado com `typecheck`, testes unitários, lint
> e aplicação real das migrations em Postgres. Veja [O que está pronto](#o-que-já-está-pronto-e-verificado).

## Stack

| Camada     | Tecnologias                                                                            |
| ---------- | -------------------------------------------------------------------------------------- |
| Monorepo   | pnpm workspaces, Turborepo, TypeScript estrito, ESLint, Prettier                       |
| Web        | Next.js (App Router), React, Tailwind, shadcn/ui, React Hook Form, Zod, TanStack Query |
| Mobile     | React Native, Expo, Expo Router, NativeWind, Zod, TanStack Query                       |
| Backend    | Supabase (Postgres, Auth, Storage, Realtime), RLS, Edge Functions                      |
| Pagamentos | Mercado Pago (PIX/cartão), camada desacoplada para outros provedores                   |
| E-mail     | Resend + React Email                                                                   |
| Infra      | Vercel (web), EAS (mobile), Sentry, Upstash Redis                                      |

## Requisitos

- Node.js >= 20
- pnpm >= 9 (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker (para o Supabase local)
- Supabase CLI (`npm i -g supabase` ou via `npx supabase`)

## Instalação

```bash
git clone <repo> buffethub && cd buffethub
pnpm install
cp .env.example .env          # preencha os valores (ver .env.example)
```

## Supabase local, migrations e seed

```bash
pnpm db:start                 # sobe Postgres/Auth/Storage locais (Docker)
pnpm db:reset                 # aplica migrations + seed.sql
pnpm db:types                 # gera tipos TS do schema (packages/database)
```

Para validar as migrations **sem Docker** (usado no CI), rodamos um Postgres em
processo (PGlite) que aplica todas as migrations e confere schema, enums e RLS:

```bash
pnpm db:verify
```

## Execução

```bash
pnpm dev            # tudo (turbo)
pnpm dev:web        # apenas web
pnpm dev:mobile     # apenas mobile (Expo)
```

## Testes e verificação

```bash
pnpm typecheck      # TypeScript em todos os pacotes
pnpm test           # testes unitários (Vitest)
pnpm lint           # ESLint
pnpm db:verify      # migrations em Postgres real
pnpm check          # lint + typecheck + test + build
```

## O que já está pronto (e verificado)

Executado nesta base com sucesso: **`typecheck` (0 erros), 47 testes unitários,
`lint` (0 avisos) e aplicação das migrations em Postgres real (24 tabelas, RLS
em todas, 49 políticas)**.

- **Monorepo**: pnpm + Turborepo, TS estrito compartilhado, ESLint flat config, Prettier.
- **`packages/domain`** — enums de domínio como fonte única de verdade (papéis, status de pedido/pagamento/proposta/etc.), espelhados pelos enums SQL.
- **`packages/utils`** — dinheiro em centavos (sem float), formatação BRL/datas pt-BR, máscaras (CPF/CNPJ/CEP/telefone), cálculo de comissão com invariante _bruto = plataforma + gateway + líquido_. **31 testes.**
- **`packages/validation`** — validadores reais de CPF/CNPJ (dígitos verificadores) e schemas Zod (auth, cadastro de fornecedor, endereço) com mensagens em pt-BR, compartilháveis entre web/mobile/backend. **16 testes.**
- **`supabase/migrations`** — 5 migrations cobrindo identidade (perfis, papéis, endereços, consentimentos LGPD, dispositivos, sessões), fornecedores (empresa, equipe, documentos, áreas, horários, dados bancários, verificação) e catálogo (categorias, serviços, mídia, cardápios, pacotes), com enums, constraints, índices, triggers de `updated_at`, soft delete e **RLS completa** por meio de funções `SECURITY DEFINER` (sem recursão de políticas).
- **`supabase/seed.sql`** — categorias base idempotentes.
- **`scripts/verify-migrations.mjs`** — gate que aplica migrations e confere integridade.

## Roadmap

Fases sobre esta fundação (detalhe em `docs/ARCHITECTURE.md`):

1. **Fundação** ✅ — monorepo, banco, papéis, RLS, validação, utils, CI.
2. Empresas e catálogo (UI de cadastro, verificação, página pública).
3. Busca e descoberta (filtros, geolocalização, SEO).
4. Eventos e orçamentos (agenda, disponibilidade, notificações).
5. Propostas e chat (versões, comparação, Realtime, anexos).
6. Pedidos e pagamentos (checkout, PIX/cartão, webhooks, ledger, reembolso).
7. Assinaturas (planos, limites, cupons, destaques).
8. Avaliações e suporte (moderação, chamados, disputas).
9. Aplicativo mobile (cliente, empresa, push, deep links).
10. Produção (segurança, performance, observabilidade, E2E, deploy).

## Estrutura

```
buffethub/
├── apps/            # web (Next.js) e mobile (Expo) — adicionados nas fases 2+
├── packages/
│   ├── domain/      # enums e tipos de domínio (fonte única)
│   ├── utils/       # dinheiro, formatação, comissão
│   ├── validation/  # validadores BR + schemas Zod
│   └── typescript-config/
├── supabase/
│   ├── migrations/  # schema versionado (SQL)
│   ├── seed.sql
│   └── config.toml
├── docs/            # ARCHITECTURE, DATABASE, SECURITY, ...
└── scripts/         # verify-migrations, utilitários
```

## Documentação

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — decisões e camadas.
- [`docs/DATABASE.md`](docs/DATABASE.md) — modelo de dados e convenções.
- [`docs/SECURITY.md`](docs/SECURITY.md) — RLS, RBAC, ameaças e mitigação.

## Licença

Proprietário — todos os direitos reservados (ajuste conforme necessário).
