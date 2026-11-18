import { SOURCE_IDS, SOURCES } from '@/config/sources';
import { cn } from '@/lib/cn';
import { usePreferences } from '@/store/preferences';

export function SourceFilter({ compact = false }: { compact?: boolean }) {
  const enabled = usePreferences((state) => state.enabledSources);
  const toggleSource = usePreferences((state) => state.toggleSource);

  return (
    <ul className="space-y-1">
      {SOURCE_IDS.map((id) => {
        const meta = SOURCES[id];
        const on = enabled.includes(id);
        const locked = on && enabled.length === 1;
        const hint = locked ? `${meta.name} (at least one source stays on)` : `${on ? 'Hide' : 'Show'} ${meta.name}`;

        return (
          <li key={id}>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={meta.name}
              aria-disabled={locked}
              title={hint}
              onClick={() => toggleSource(id)}
              className={cn(
                'group flex h-10 w-full items-center gap-3 rounded-lg text-sm transition-colors',
                compact ? 'justify-center' : 'px-3',
                on ? 'text-ink' : 'text-ink-subtle',
                locked ? 'cursor-default' : 'hover:bg-surface-hover',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'inline-flex size-6 shrink-0 items-center justify-center rounded-md border text-[0.6rem] font-bold transition-opacity',
                  'border-line bg-surface-raised',
                  meta.textClass,
                  !on && 'opacity-40',
                )}
              >
                {meta.shortName}
              </span>
              {!compact && (
                <>
                  <span className="flex-1 truncate text-left">{meta.name}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                      on ? 'bg-accent' : 'bg-surface-active',
                      locked && 'opacity-60',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-0 top-0.5 size-4 rounded-full bg-ink shadow transition-[translate]',
                        on ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
                      )}
                    />
                  </span>
                </>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
