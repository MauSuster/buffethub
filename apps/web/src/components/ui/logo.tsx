import Link from 'next/link';
import { PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight',
        className,
      )}
    >
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <PartyPopper className="h-4 w-4" />
      </span>
      <span>
        Buffet<span className="text-primary">Hub</span>
      </span>
    </Link>
  );
}
