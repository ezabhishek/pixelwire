import { ArrowBigUp, Bookmark, Flame, Hash, Newspaper, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { SourceFilter } from '@/components/sidebar/SourceFilter';
import { TagFilter } from '@/components/sidebar/TagFilter';
import { IconButton } from '@/components/ui/IconButton';
import { Brand } from '@/components/ui/Logo';
import { useScrollLock } from '@/hooks/useScrollLock';
import { cn } from '@/lib/cn';
import { getFocusable, trapFocus } from '@/lib/dom';
import { useBookmarkCount } from '@/store/library';
import { usePreferences } from '@/store/preferences';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'My feed', icon: Newspaper, end: true },
  { to: '/popular', label: 'Popular', icon: Flame },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/upvoted', label: 'Upvoted', icon: ArrowBigUp },
];

function SidebarNav({ compact }: { compact: boolean }) {
  const bookmarkCount = useBookmarkCount();
  return (
    <nav aria-label="Main">
      <ul className="space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              aria-label={compact ? label : undefined}
              title={compact ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                  compact ? 'justify-center' : 'px-3',
                  isActive ? 'bg-surface-active text-ink' : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !compact && (
                    <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />
                  )}
                  <Icon aria-hidden className={cn('size-[1.15rem] shrink-0', isActive && 'text-accent')} />
                  {!compact && <span className="flex-1 truncate">{label}</span>}
                  {to === '/bookmarks' &&
                    bookmarkCount > 0 &&
                    (compact ? (
                      <span aria-hidden className="absolute right-3 top-2 size-1.5 rounded-full bg-bookmark" />
                    ) : (
                      <span className="rounded-md bg-surface-hover px-1.5 text-xs tabular-nums text-ink-subtle">
                        {bookmarkCount}
                      </span>
                    ))}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SidebarSection({ title, compact, children }: { title: string; compact: boolean; children: ReactNode }) {
  if (compact) {
    return (
      <section aria-label={title}>
        <div aria-hidden className="mx-2 my-4 border-t border-line" />
        {children}
      </section>
    );
  }
  return (
    <section aria-label={title} className="mt-7">
      <h2 className="mb-2 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-subtle">{title}</h2>
      {children}
    </section>
  );
}

function CompactTagsButton({ onExpand }: { onExpand: () => void }) {
  const count = usePreferences((state) => state.followedTags.length);
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={count > 0 ? `Tags (${count} followed). Expand sidebar to edit` : 'Tags. Expand sidebar to follow tags'}
      title="Tags"
      className="relative flex h-10 w-full items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
    >
      <Hash aria-hidden className="size-[1.15rem]" />
      {count > 0 && (
        <span className="absolute right-2.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold leading-4 text-ink-inverse">
          {count}
        </span>
      )}
    </button>
  );
}

export function SidebarContent({ compact, onExpand }: { compact: boolean; onExpand: () => void }) {
  return (
    <div className={cn('flex h-full flex-col overflow-y-auto overflow-x-hidden py-4', compact ? 'px-2' : 'px-3')}>
      <SidebarNav compact={compact} />
      <SidebarSection title="Sources" compact={compact}>
        <SourceFilter compact={compact} />
      </SidebarSection>
      <SidebarSection title="Tags" compact={compact}>
        {compact ? <CompactTagsButton onExpand={onExpand} /> : <TagFilter />}
      </SidebarSection>
      {!compact && (
        <p className="mt-auto px-3 pt-8 text-xs leading-relaxed text-ink-subtle">
          Posts come from{' '}
          <a href="https://dev.to" target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-ink">
            DEV
          </a>{' '}
          and{' '}
          <a
            href="https://news.ycombinator.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-muted hover:text-ink"
          >
            Hacker News
          </a>
          . Bookmarks and votes are saved in this browser.
        </p>
      )}
    </div>
  );
}

export function DesktopSidebar({ collapsed, onExpand }: { collapsed: boolean; onExpand: () => void }) {
  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        'fixed bottom-0 left-0 top-header z-30 border-r border-line bg-canvas transition-[width] duration-200 ease-out',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      <SidebarContent compact={collapsed} onExpand={onExpand} />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    getFocusable(panelRef.current)[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab') {
        trapFocus(event, panelRef.current);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-overlay" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] animate-drawer-left-in flex-col border-r border-line bg-canvas shadow-drawer"
      >
        <div className="flex h-header shrink-0 items-center justify-between border-b border-line px-3">
          <Brand />
          <IconButton label="Close menu" onClick={onClose}>
            <X aria-hidden className="size-5" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1">
          <SidebarContent compact={false} onExpand={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
