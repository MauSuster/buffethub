-- ============================================================
-- Migration: cadastro das categorias de produtos e serviços
-- Arquivo: 0007_seed_service_categories.sql
-- ============================================================

BEGIN;

-- Extensão utilizada para geração de UUID.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Tabela de categorias
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL,
  slug text NOT NULL,

  description text,
  icon text,

  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT service_categories_name_not_blank
    CHECK (length(trim(name)) >= 2),

  CONSTRAINT service_categories_slug_not_blank
    CHECK (length(trim(slug)) >= 2),

  CONSTRAINT service_categories_sort_order_non_negative
    CHECK (sort_order >= 0)
);

-- ============================================================
-- Índices e restrições únicas
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
  service_categories_slug_unique_idx
ON public.service_categories (lower(slug));

CREATE UNIQUE INDEX IF NOT EXISTS
  service_categories_name_unique_idx
ON public.service_categories (lower(name));

CREATE INDEX IF NOT EXISTS
  service_categories_active_sort_idx
ON public.service_categories (
  is_active,
  sort_order,
  name
);

-- ============================================================
-- Função para atualizar updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  set_service_categories_updated_at
ON public.service_categories;

CREATE TRIGGER set_service_categories_updated_at
BEFORE UPDATE ON public.service_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Categorias iniciais
-- ============================================================

INSERT INTO public.service_categories (
  name,
  slug,
  description,
  icon,
  sort_order,
  is_active
)
VALUES
  (
    'Buffet completo',
    'buffet-completo',
    'Serviços completos de buffet para festas, casamentos, eventos corporativos e comemorações.',
    'utensils',
    10,
    true
  ),
  (
    'Buffet infantil',
    'buffet-infantil',
    'Buffets especializados em festas infantis, aniversários e eventos para crianças.',
    'party-popper',
    20,
    true
  ),
  (
    'Casamentos',
    'casamentos',
    'Serviços de buffet, alimentação e estrutura para casamentos e cerimônias.',
    'heart',
    30,
    true
  ),
  (
    'Eventos corporativos',
    'eventos-corporativos',
    'Coffee breaks, confraternizações, congressos, treinamentos e eventos empresariais.',
    'briefcase-business',
    40,
    true
  ),
  (
    'Coffee break',
    'coffee-break',
    'Cafés, lanches, bebidas e refeições rápidas para reuniões, cursos e eventos.',
    'coffee',
    50,
    true
  ),
  (
    'Coquetel',
    'coquetel',
    'Canapés, finger foods, bebidas e serviços para recepções e confraternizações.',
    'martini',
    60,
    true
  ),
  (
    'Churrasco',
    'churrasco',
    'Churrasqueiros, carnes, acompanhamentos e estrutura completa para churrascos.',
    'flame',
    70,
    true
  ),
  (
    'Doces e sobremesas',
    'doces-e-sobremesas',
    'Doces finos, brigadeiros, sobremesas, mesas de doces e lembranças comestíveis.',
    'candy',
    80,
    true
  ),
  (
    'Bolos',
    'bolos',
    'Bolos personalizados para aniversários, casamentos, eventos e comemorações.',
    'cake-slice',
    90,
    true
  ),
  (
    'Salgados',
    'salgados',
    'Salgados fritos, assados, porções e kits para festas e eventos.',
    'sandwich',
    100,
    true
  ),
  (
    'Bebidas',
    'bebidas',
    'Fornecimento de bebidas alcoólicas e não alcoólicas para eventos.',
    'cup-soda',
    110,
    true
  ),
  (
    'Bartender e bar',
    'bartender-e-bar',
    'Bartenders, drinks, coquetéis, bar móvel e estrutura de atendimento.',
    'wine',
    120,
    true
  ),
  (
    'Food truck',
    'food-truck',
    'Food trucks, carrinhos gastronômicos e alimentação móvel para eventos.',
    'truck',
    130,
    true
  ),
  (
    'Chef em domicílio',
    'chef-em-domicilio',
    'Chefs particulares para jantares, confraternizações e experiências gastronômicas.',
    'chef-hat',
    140,
    true
  ),
  (
    'Marmitas e refeições',
    'marmitas-e-refeicoes',
    'Marmitas, refeições individuais, pratos executivos e alimentação para equipes.',
    'package',
    150,
    true
  ),
  (
    'Decoração',
    'decoracao',
    'Decoração de festas, mesas temáticas, cenografia e ambientação de eventos.',
    'sparkles',
    160,
    true
  ),
  (
    'Fotografia e filmagem',
    'fotografia-e-filmagem',
    'Fotógrafos, videomakers, cobertura audiovisual e produção de conteúdo.',
    'camera',
    170,
    true
  ),
  (
    'Música e entretenimento',
    'musica-e-entretenimento',
    'DJs, bandas, músicos, recreação, atrações e entretenimento para eventos.',
    'music',
    180,
    true
  ),
  (
    'Locação de equipamentos',
    'locacao-de-equipamentos',
    'Locação de mesas, cadeiras, utensílios, som, iluminação e equipamentos.',
    'warehouse',
    190,
    true
  ),
  (
    'Espaços para eventos',
    'espacos-para-eventos',
    'Salões, chácaras, sítios, espaços corporativos e locais para celebrações.',
    'building-2',
    200,
    true
  ),
  (
    'Assessoria e cerimonial',
    'assessoria-e-cerimonial',
    'Planejamento, organização, assessoria e cerimonial para eventos.',
    'clipboard-check',
    210,
    true
  ),
  (
    'Garçons e equipe',
    'garcons-e-equipe',
    'Garçons, copeiros, recepcionistas, auxiliares e equipes de apoio.',
    'users',
    220,
    true
  ),
  (
    'Outros serviços',
    'outros-servicos',
    'Produtos e serviços para eventos que não se enquadram nas demais categorias.',
    'layout-grid',
    999,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- Relacionamento com services
-- ============================================================

-- Cria category_id caso a coluna ainda não exista.
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS category_id uuid;

-- Remove uma possível FK antiga com o mesmo nome antes de recriar.
ALTER TABLE public.services
DROP CONSTRAINT IF EXISTS services_category_id_fkey;

ALTER TABLE public.services
ADD CONSTRAINT services_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES public.service_categories(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS services_category_id_idx
ON public.services(category_id);

-- ============================================================
-- Preenchimento de serviços antigos sem categoria
-- ============================================================

UPDATE public.services
SET category_id = (
  SELECT id
  FROM public.service_categories
  WHERE slug = 'outros-servicos'
  LIMIT 1
)
WHERE category_id IS NULL;

-- category_id passa a ser obrigatório depois da atualização.
ALTER TABLE public.services
ALTER COLUMN category_id SET NOT NULL;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
  "Categorias de serviços podem ser visualizadas publicamente"
ON public.service_categories;

CREATE POLICY
  "Categorias de serviços podem ser visualizadas publicamente"
ON public.service_categories
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Modificações ficam bloqueadas para usuários comuns.
-- Novas categorias devem ser cadastradas por migrations,
-- service role ou painel administrativo autorizado.

COMMIT;