import {
  Beef,
  Building2,
  CakeSlice,
  Camera,
  Coffee,
  Flower2,
  IceCream,
  Music,
  PartyPopper,
  Salad,
  Sparkles,
  Truck,
  Utensils,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from 'lucide-react';

const RULES: Array<{ match: string[]; icon: LucideIcon }> = [
  { match: ['churrasc', 'carne', 'bbq'], icon: Beef },
  { match: ['doce', 'bolo', 'confeit'], icon: CakeSlice },
  { match: ['sorvete', 'gelato'], icon: IceCream },
  { match: ['bebida', 'drink', 'bar', 'coquet'], icon: Wine },
  { match: ['cafe', 'coffee', 'brunch'], icon: Coffee },
  { match: ['salgad', 'finger', 'coquetel'], icon: Utensils },
  { match: ['veget', 'saudav', 'salada', 'veg'], icon: Salad },
  { match: ['decor', 'cenograf'], icon: Flower2 },
  { match: ['foto', 'filmag', 'video'], icon: Camera },
  { match: ['music', 'dj', 'som', 'banda'], icon: Music },
  { match: ['espaco', 'salao', 'local', 'locac', 'buffet'], icon: Building2 },
  { match: ['food', 'truck', 'transp'], icon: Truck },
  { match: ['festa', 'kids', 'infantil', 'anima'], icon: PartyPopper },
  { match: ['premium', 'gourmet', 'especial'], icon: Sparkles },
];

export function categoryIcon(slug: string): LucideIcon {
  const key = slug.toLowerCase();
  for (const rule of RULES) {
    if (rule.match.some((needle) => key.includes(needle))) return rule.icon;
  }
  return UtensilsCrossed;
}

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = categoryIcon(slug);
  return <Icon className={className} aria-hidden />;
}
