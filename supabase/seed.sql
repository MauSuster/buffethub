-- =============================================================================
-- Seed idempotente — categorias base
-- =============================================================================
-- Executado por `supabase db reset`. Seguro para reexecução (ON CONFLICT).
-- O seed de usuários/fornecedores de exemplo depende do Supabase Auth Admin API
-- e é feito por script Node (ver docs/OPERATIONS.md), não por SQL puro.

insert into public.categories (slug, name, sort_order) values
  ('buffet-completo',      'Buffet completo',        10),
  ('catering',             'Catering',               20),
  ('buffet-infantil',      'Buffet infantil',        30),
  ('buffet-casamento',     'Buffet para casamento',  40),
  ('buffet-corporativo',   'Buffet corporativo',     50),
  ('coffee-break',         'Coffee break',           60),
  ('churrasco',            'Churrasco',              70),
  ('confeitaria',          'Confeitaria',            80),
  ('doces',                'Doces',                  90),
  ('bolos',                'Bolos',                 100),
  ('bebidas',              'Bebidas',               110),
  ('bartender',            'Bartender',             120),
  ('chef-particular',      'Chef particular',       130),
  ('garcons',              'Garçons',               140),
  ('food-truck',           'Food truck',            150),
  ('espaco-eventos',       'Espaço para eventos',   160),
  ('decoracao',            'Decoração',             170),
  ('fotografia',           'Fotografia',            180),
  ('filmagem',             'Filmagem',              190),
  ('dj',                   'DJ',                    200),
  ('musica-ao-vivo',       'Música ao vivo',        210),
  ('cerimonial',           'Cerimonial',            220),
  ('seguranca',            'Segurança',             230),
  ('limpeza',              'Limpeza',               240),
  ('recreacao-infantil',   'Recreação infantil',    250),
  ('locacao-equipamentos', 'Locação de equipamentos', 260)
on conflict (slug) do update
  set name = excluded.name, sort_order = excluded.sort_order;
