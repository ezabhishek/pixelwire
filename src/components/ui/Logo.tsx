import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8 shrink-0', className)}>
      <rect width="32" height="32" rx="8" fill="#121722" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke="#232a3a" />
      <rect x="6" y="6" width="6" height="6" rx="1.5" fill="#2dd4bf" />
      <rect x="20" y="20" width="6" height="6" rx="1.5" fill="#a78bfa" />
      <path d="M12 9h5a3 3 0 0 1 3 3v8" fill="none" stroke="#e6e9ef" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <Logo />
      <span className="text-[0.95rem] font-semibold tracking-tight text-ink">
        Pixel<span className="text-accent">Wires</span>
      </span>
    </span>
  );
}
