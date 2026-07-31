import 'server-only';
import type { Tables } from '@buffethub/database';
import { createClient } from '@/lib/supabase/server';

export async function getCategories(): Promise<Tables<'categories'>[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<Tables<'categories'> | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function getServiceCategories(): Promise<Tables<'service_categories'>[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
