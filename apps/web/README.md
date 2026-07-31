# BuffetHub — App Web (`@buffethub/web`)

Frontend Next.js 15 (App Router, React 19) conectado ao Supabase (auth + dados),
consumindo os pacotes compartilhados do monorepo (`@buffethub/domain`,
`@buffethub/utils`, `@buffethub/validation`, `@buffethub/database`).

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **React 19**
- **Supabase** via `@supabase/ssr` (cliente browser, server e middleware de sessão)
- **Tailwind CSS 3** com design tokens próprios + fontes self-hosted (`@fontsource`)
- **react-hook-form** + **zod** (via os schemas de `@buffethub/validation`)
- Validação de env com **@t3-oss/env-nextjs**

## Configuração

1. Copie `.env.example` para `.env.local` e preencha:

   ```bash
   cp .env.example .env.local
   ```

   | Variável                        | Descrição                                        |
   | ------------------------------- | ------------------------------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase (Settings → API)         |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave `anon` pública                             |
   | `NEXT_PUBLIC_APP_URL`           | URL pública do app (auth e-mails, OpenGraph)     |

2. Rode as migrations/seed do diretório `supabase/` na raiz do monorepo (ver
   README raiz) para ter as tabelas e categorias.

3. Gere os tipos do banco a partir do schema real (opcional, recomendado):

   ```bash
   pnpm db:types   # supabase gen types → packages/database/src/types.ts
   ```

   Enquanto não há um banco vivo, `packages/database/src/types.ts` é escrito à
   mão espelhando as migrations.

## Scripts

```bash
pnpm --filter @buffethub/web dev         # desenvolvimento (http://localhost:3000)
pnpm --filter @buffethub/web build       # build de produção
pnpm --filter @buffethub/web typecheck   # tsc --noEmit
pnpm --filter @buffethub/web lint        # eslint
```

## O que está implementado

- **Auth completa**: cadastro (com consentimentos LGPD), login, logout,
  recuperação e redefinição de senha, callback de e-mail (`/auth/callback`),
  e middleware que renova a sessão e protege `/painel`.
- **Cadastro de fornecedor**: formulário multi-seção (dados da empresa,
  categorias, atendimento, endereço) validado com `providerRegistrationSchema`,
  gravando em `providers` + `provider_members` (dono) + `provider_categories`.
- **Descoberta pública**: home, busca com filtros (texto, categoria, cidade,
  UF), listagem de categorias e página pública do fornecedor com serviços.
- **Painel do fornecedor**: visão geral com status do cadastro e página
  "Meu negócio" (formulário ou resumo do fornecedor conforme o estado).

### Camadas

```
src/
  app/                # rotas (grupos: (marketing), (auth), (app))
  components/         # UI (ui/*), formulários (forms/*), header/footer, cards
  lib/
    supabase/         # clientes browser/server + middleware de sessão
    data/             # acesso a dados tipado (session, categories, providers)
    actions/          # Server Actions (auth, provider) + tipos de resultado
  env.ts              # validação de variáveis de ambiente
  middleware.ts       # renovação de sessão + proteção de rotas
```

## Notas de arquitetura

- Os pacotes do monorepo são exportados como **código-fonte TS** com specifiers
  ESM `.js`; o `next.config.mjs` usa `transpilePackages` + `extensionAlias`
  (`.js` → `.ts`) para o webpack resolvê-los.
- Páginas que leem dados usam `export const dynamic = 'force-dynamic'` e
  degradam graciosamente (retornam listas vazias) se o Supabase não responder.
- `@supabase/ssr@0.6.x` importa tipos de `@supabase/supabase-js/dist/module/lib/types`,
  layout presente no `supabase-js@2.48.x` (por isso essa versão está fixada).

## Verificação

`typecheck`, `lint` e `build` de produção passam. O runtime real contra o
Supabase (login, gravações, RLS ao vivo) **não** foi exercitado neste ambiente
por não haver credenciais/instância — apenas a compilação e a checagem de tipos.
