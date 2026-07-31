# Banco de dados

PostgreSQL via Supabase. Schema versionado em `supabase/migrations` (aplicadas em
ordem lexicográfica). `gen_random_uuid()` é nativo do PostgreSQL 13+.

## Convenções

- **PK** `uuid` com `default gen_random_uuid()` (exceto `profiles.id`, que é a PK
  compartilhada com `auth.users`).
- **Timestamps**: `created_at`/`updated_at timestamptz not null default now()`.
  `updated_at` é mantido pelo trigger `public.set_updated_at()`.
- **Soft delete**: coluna `deleted_at timestamptz` onde a retenção importa;
  índices únicos usam `where deleted_at is null` (o valor só é único entre vivos).
- **Enums**: tipos `CREATE TYPE ... AS ENUM`, espelhando `packages/domain`. O
  `scripts/verify-migrations.mjs` falha se divergirem.
- **Dinheiro**: colunas `..._cents bigint` com `check (>= 0)`. Nunca `float`.
- **Documentos/telefone/CEP**: armazenados só com dígitos; validados por `check`
  regex no banco e por Zod na aplicação.
- **Índices**: criados para FKs, slugs, status, datas, cidade/estado, geo
  (lat/long) e ordenações comuns. PostGIS pode substituir lat/long em produção
  para busca por raio.

## Migrations (estado atual)

| Arquivo                       | Conteúdo                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0001_init_enums_and_helpers` | `set_updated_at()` e todos os enums de domínio.                                                                                                                          |
| `0002_identity`               | `profiles`, `user_roles`, `addresses`, `user_consents`, `user_devices`, `user_sessions`.                                                                                 |
| `0003_providers`              | `providers`, `provider_members`, `provider_documents`, `provider_service_areas`, `provider_business_hours`, `provider_bank_accounts`, `provider_verifications`.          |
| `0004_catalog`                | `categories`, `subcategories`, `provider_categories`, `services`, `service_media`, `service_items`, `menus`, `menu_sections`, `menu_items`, `packages`, `package_items`. |
| `0005_rls`                    | Funções auxiliares `SECURITY DEFINER` + RLS de todas as tabelas acima.                                                                                                   |

Verificado: 24 tabelas, RLS habilitada em todas, 49 políticas.

## Próximas migrations (fases seguintes)

Eventos e orçamentos (`customer_events`, `quote_requests`, `proposals`, versões e
itens), agenda (`availability_rules`, `availability_blocks`, `bookings` com
restrição anti-dupla-reserva), chat (`conversations`, `messages`, `message_reads`),
pedidos (`orders`, `order_snapshots`, `order_status_history`), pagamentos e
financeiro (`payments`, `payment_webhooks`, `refunds`, `commissions`, `payouts`,
`financial_ledger`), assinaturas, avaliações, favoritos, cupons, notificações,
suporte/disputas, conteúdo e `audit_logs`.

## Integridade e transações

- Reservas e operações financeiras rodam em transação; a dupla reserva é impedida
  por restrição no banco (índice de exclusão por janela/serviço), não apenas por
  checagem na aplicação.
- Propostas aceitas tornam-se imutáveis; mudanças geram nova versão/aditivo.
- Registros financeiros obrigatórios não são apagados — anonimização quando
  aplicável (LGPD).
