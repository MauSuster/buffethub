# Segurança

## RLS (Row Level Security)

RLS está habilitada em **todas** as tabelas de `public`. As decisões de
visibilidade são centralizadas em funções `SECURITY DEFINER` (executam como
dono, ignorando RLS) para **evitar recursão de políticas** — o anti-padrão em que
uma policy de A consulta B, cuja policy consulta A.

Funções auxiliares (`supabase/migrations/0005_rls.sql`):

- `is_staff()` — usuário pertence à equipe interna (SUPPORT/FINANCIAL/MODERATOR/ADMIN/SUPER_ADMIN).
- `is_provider_member(provider)` / `can_manage_provider(provider)` — vínculo e
  permissão do usuário com um fornecedor (membro vs. dono/gerente).
- `provider_is_public` / `service_is_public` / `menu_is_public` / `package_is_public`
  — visibilidade pública (aprovado + publicado + não removido).

Resumo das regras:

| Recurso                    | Leitura                                             | Escrita                          |
| -------------------------- | --------------------------------------------------- | -------------------------------- |
| `profiles`                 | próprio + staff                                     | próprio                          |
| `addresses`/`user_devices` | próprio                                             | próprio                          |
| `user_consents`            | próprio + staff                                     | inserção pelo próprio (imutável) |
| `providers`                | aprovados (público) + membros + staff               | dono/gerente + staff             |
| `provider_documents`       | membros + staff (privado)                           | dono/gerente; staff revisa       |
| `provider_bank_accounts`   | dono/gerente + staff (sensível)                     | dono/gerente                     |
| `services`/`packages`      | publicados de fornecedor aprovado + membros + staff | dono/gerente                     |
| `categories`               | ativas (público)                                    | staff                            |

O `service_role` do Supabase tem `BYPASSRLS`: o **painel administrativo opera
pelo servidor com service role**, nunca expondo essa chave ao browser.

## RBAC

Papéis de plataforma em `user_roles`; papéis de fornecedor em `provider_members`.
Operações sensíveis verificam papel/permissão no servidor além da RLS.

## Ameaças principais e mitigação

| Ameaça                                    | Mitigação                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Vazamento entre inquilinos (fornecedores) | RLS por `provider_id` via funções `SECURITY DEFINER`; testes de RLS.                                  |
| Exposição de dados sensíveis              | Documentos/dados bancários em buckets privados + RLS restrita; URLs assinadas.                        |
| Chave admin no cliente                    | `service_role` apenas no servidor; frontend usa `anon key` + RLS.                                     |
| Fraude de pagamento                       | Nunca confiar no retorno do frontend; confirmar por webhook assinado + idempotência; ledger imutável. |
| Reprocessamento de webhook                | Tabela de eventos de webhook + chave de idempotência.                                                 |
| Dupla reserva                             | Transação + restrição no banco.                                                                       |
| XSS / injeção                             | Sanitização, saída escapada, validação de MIME/tamanho em uploads, Zod no servidor.                   |
| Enumeração de usuários                    | Respostas genéricas em login/recuperação; rate limit + CAPTCHA em ações públicas.                     |
| Força bruta                               | Rate limit (Upstash) e bloqueio temporário após tentativas excessivas.                                |
| SQL injection                             | Acesso via cliente parametrizado do Supabase; sem SQL concatenado.                                    |

## Segredos e conformidade

- Segredos só em variáveis de ambiente do servidor; `.env` fora do versionamento.
- Nunca registrar (log) senhas, tokens, dados completos de cartão, documentos ou
  segredos.
- LGPD: consentimentos versionados e imutáveis, exportação e exclusão/anonimização
  de dados, retenção de registros financeiros obrigatórios (ver `docs/LGPD.md`).
