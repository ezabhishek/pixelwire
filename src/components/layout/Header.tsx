import { Bookmark, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IconButton } from '@/components/ui/IconButton';
import { Brand, Logo } from '@/components/ui/Logo';
import { useBookmarkCount } from '@/store/library';
import { SearchBar } from './SearchBar';

interface HeaderProps {
  isDesktop: boolean;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  onMenuClick: () => void;
}

export function Header({ isDesktop, sidebarCollapsed, mobileNavOpen, onMenuClick }: HeaderProps) {
  const bookmarkCount = useBookmarkCount();

  const menuLabel = isDesktop ? (sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar') : 'Open menu';
  const MenuIcon = isDesktop ? (sidebarCollapsed ? PanelLeftOpen : PanelLeftClose) : Menu;

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-header items-center gap-2 border-b border-line bg-canvas/85 px-3 backdrop-blur-md sm:gap-3 sm:px-4">
      <IconButton
        label={menuLabel}
        onClick={onMenuClick}
        aria-expanded={isDesktop ? !sidebarCollapsed : mobileNavOpen}
      >
        <MenuIcon aria-hidden className="size-5" />
      </IconButton>

      <Link to="/" aria-label="Pixel Wires home" className="shrink-0 rounded-lg">
        <Logo className="sm:hidden" />
        <Brand className="hidden sm:flex" />
      </Link>

      <div className="flex min-w-0 flex-1 justify-center px-1 sm:px-4">
        <SearchBar />
      </div>

      <Link
        to="/bookmarks"
        aria-label={`Bookmarks (${bookmarkCount})`}
        title="Bookmarks"
        className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
      >
        <Bookmark aria-hidden className="size-5" />
        {bookmarkCount > 0 && (
          <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-bookmark px-1 text-[0.625rem] font-bold leading-4 text-ink-inverse tabular-nums">
            {bookmarkCount > 99 ? '99+' : bookmarkCount}
          </span>
        )}
      </Link>
    </header>
  );
}
