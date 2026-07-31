'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { providerRegistrationSchema, type ProviderRegistrationInput } from '@buffethub/validation';
import { slugify } from '@buffethub/utils';
import type { TablesInsert } from '@buffethub/database';
import { createClient } from '@/lib/supabase/server';
import { ensureProfile, getSessionUser } from '@/lib/data/session';
import type { ActionState } from './types';

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

export async function registerProviderAction(
  input: ProviderRegistrationInput,
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) {
    return { status: 'error', message: 'Você precisa estar autenticado.' };
  }

  const parsed = providerRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Verifique os campos destacados.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  await ensureProfile(user);
  const supabase = await createClient();

  const documentType = data.document.length === 11 ? 'CPF' : 'CNPJ';
  const slug = `${slugify(data.tradeName).slice(0, 90)}-${randomSuffix()}`;

  const providerInsert: TablesInsert<'providers'> = {
    owner_id: user.id,
    legal_name: data.legalName,
    trade_name: data.tradeName,
    slug,
    document: data.document,
    document_type: documentType,
    state_registration: data.stateRegistration ?? null,
    business_email: data.businessEmail,
    phone: data.phone,
    whatsapp: data.whatsapp ?? null,
    website: data.website ? data.website : null,
    instagram: data.instagram ?? null,
    description: data.description,
    founded_year: data.foundedYear ?? null,
    employee_count: data.employeeCount ?? null,
    service_radius_km: data.serviceRadiusKm ?? null,
    min_capacity: data.minCapacity ?? null,
    max_capacity: data.maxCapacity ?? null,
    status: 'PENDING_REVIEW',
    cep: data.address.cep,
    street: data.address.street,
    number: data.address.number,
    complement: data.address.complement ?? null,
    district: data.address.district,
    city: data.address.city,
    state: data.address.state,
  };

  const { data: created, error: providerError } = await supabase
    .from('providers')
    .insert(providerInsert)
    .select('id')
    .single();

  if (providerError || !created) {
    if (providerError?.code === '23505') {
      return {
        status: 'error',
        message: 'Já existe um cadastro com este documento.',
        fieldErrors: { document: ['Documento já cadastrado'] },
      };
    }
    return { status: 'error', message: 'Não foi possível criar o cadastro. Tente novamente.' };
  }

  const providerId = created.id;

  const { error: memberError } = await supabase.from('provider_members').insert({
    provider_id: providerId,
    user_id: user.id,
    role: 'PROVIDER_OWNER',
  });
  if (memberError) {
    return { status: 'error', message: 'Cadastro criado, mas houve um erro ao vincular o dono.' };
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', data.categorySlugs);

  if (categories && categories.length > 0) {
    const links = categories.map((category, index) => ({
      provider_id: providerId,
      category_id: category.id,
      is_primary: index === 0,
    }));
    await supabase.from('provider_categories').insert(links);
  }

  revalidatePath('/painel', 'layout');
  redirect('/painel/meu-negocio');
}
