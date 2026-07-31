#!/usr/bin/env node
/**
 * Aplica todas as migrations em um Postgres real (PGlite/WASM), simulando o
 * schema `auth` do Supabase, e valida integridade do schema, enums e RLS.
 * Serve como gate de CI: sai com código != 0 em qualquer falha.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'supabase', 'migrations');

// Shim do que o Supabase provê nativamente (schema auth + auth.uid()).
const AUTH_SHIM = `
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique
  );
  create or replace function auth.uid() returns uuid
    language sql stable as $$ select nullif(current_setting('app.current_user_id', true), '')::uuid $$;
`;

// Enums críticos e seus rótulos esperados (devem casar com packages/domain).
const EXPECTED_ENUMS = {
  user_role: [
    'CUSTOMER',
    'PROVIDER_OWNER',
    'PROVIDER_MANAGER',
    'PROVIDER_EMPLOYEE',
    'EVENT_PLANNER',
    'SUPPORT',
    'FINANCIAL',
    'MODERATOR',
    'ADMIN',
    'SUPER_ADMIN',
  ],
  order_status: [
    'PENDING_PAYMENT',
    'PARTIALLY_PAID',
    'PAID',
    'CONFIRMED',
    'IN_PREPARATION',
    'READY',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
  ],
  payment_status: [
    'CREATED',
    'PENDING',
    'AUTHORIZED',
    'PAID',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
    'CHARGEBACK',
  ],
};

function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

async function main() {
  const db = new PGlite();
  await db.exec(AUTH_SHIM);

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) fail('Nenhuma migration encontrada.');

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    try {
      await db.exec(sql);
      console.log(`  ✓ aplicada: ${file}`);
    } catch (error) {
      fail(`Falha ao aplicar ${file}:\n${error.message}`);
    }
  }

  // 1) Contagem de tabelas em public
  const tables = await db.query(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`,
  );
  const tableNames = tables.rows.map((r) => r.tablename);
  console.log(`\n  Tabelas em public: ${tableNames.length}`);

  // 2) Enums conferem com o domínio
  for (const [enumName, expected] of Object.entries(EXPECTED_ENUMS)) {
    const res = await db.query(
      `select e.enumlabel as label
         from pg_enum e join pg_type t on t.oid = e.enumtypid
        where t.typname = $1
        order by e.enumsortorder`,
      [enumName],
    );
    const labels = res.rows.map((r) => r.label);
    if (JSON.stringify(labels) !== JSON.stringify(expected)) {
      fail(`Enum ${enumName} divergente.\n  esperado: ${expected}\n  obtido:   ${labels}`);
    }
    console.log(`  ✓ enum ${enumName} (${labels.length} rótulos)`);
  }

  // 3) RLS habilitado em TODAS as tabelas de public
  const rls = await db.query(
    `select c.relname, c.relrowsecurity
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'`,
  );
  const withoutRls = rls.rows.filter((r) => !r.relrowsecurity).map((r) => r.relname);
  if (withoutRls.length > 0) {
    fail(`Tabelas sem RLS habilitado: ${withoutRls.join(', ')}`);
  }
  console.log(`  ✓ RLS habilitado em todas as ${rls.rows.length} tabelas`);

  // 4) Existência de políticas
  const policies = await db.query(
    `select count(*)::int as n from pg_policies where schemaname = 'public'`,
  );
  const policyCount = policies.rows[0].n;
  if (policyCount < tableNames.length) {
    fail(`Poucas políticas RLS (${policyCount}) para ${tableNames.length} tabelas.`);
  }
  console.log(`  ✓ ${policyCount} políticas RLS definidas`);

  // 5) Funções auxiliares presentes
  const fns = await db.query(
    `select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and proname in
      ('is_staff','can_manage_provider','is_provider_member','service_is_public')`,
  );
  if (fns.rows.length < 4) fail('Funções auxiliares de RLS ausentes.');
  console.log(`  ✓ funções auxiliares de RLS presentes`);

  await db.close();
  console.log('\n✅ Migrations válidas: schema, enums e RLS conferidos.');
}

main().catch((error) => fail(error.stack ?? String(error)));
