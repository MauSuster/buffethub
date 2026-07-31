import 'server-only';
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@buffethub/database';
import { createClient } from '@/lib/supabase/server';

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Tables<'profiles'> | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
}

/**
 * Garante que exista uma linha em `profiles` para o usuário autenticado,
 * derivando nome/telefone dos metadados do cadastro. Idempotente. Substitui o
 * trigger `handle_new_user` até que ele seja adicionado como migration.
 */
export async function ensureProfile(user: User): Promise<void> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (existing) return;

  const metadata = user.user_metadata ?? {};
  const rawName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
  const fallbackName = user.email?.split('@')[0] ?? 'Novo usuário';
  const fullName = (rawName.length >= 3 ? rawName : fallbackName).slice(0, 120);
  const rawPhone = typeof metadata.phone === 'string' ? metadata.phone.replace(/\D+/g, '') : '';
  const phone = /^[0-9]{10,11}$/.test(rawPhone) ? rawPhone : null;

  await supabase.from('profiles').insert({ id: user.id, full_name: fullName, phone });
}

/** Fornecedor do qual o usuário é dono (um por dono nesta fase). */
export async function getMyProvider(userId: string): Promise<Tables<'providers'> | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('providers')
    .select('*')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}
