import * as React from 'react';
import { CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'default' | 'success' | 'error';

const styles: Record<AlertVariant, string> = {
  default: 'border-border bg-secondary/60 text-secondary-foreground',
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
};

const icons: Record<AlertVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: TriangleAlert,
};

export function Alert({
  variant = 'default',
  className,
  children,
}: {
  variant?: AlertVariant;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = icons[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm', styles[variant], className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
