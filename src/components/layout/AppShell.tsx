import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArticlePreview } from '@/components/preview/ArticlePreview';
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { usePreferences } from '@/store/preferences';
import { usePreview } from '@/store/preview';
import { Header } from './Header';
import { DesktopSidebar, MobileSidebar } from './Sidebar';

export function AppShell() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const collapsed = usePreferences((state) => state.sidebarCollapsed);
  const toggleSidebar = usePreferences((state) => state.toggleSidebar);
  const setSidebarCollapsed = usePreferences((state) => state.setSidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const closePreview = usePreview((state) => state.close);

  // A route change (link, Back button) closes any open overlay and starts at the top.
  useEffect(() => {
    setMobileOpen(false);
    closePreview();
    window.scrollTo({ top: 0 });
  }, [pathname, closePreview]);

  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const expandSidebar = useCallback(() => setSidebarCollapsed(false), [setSidebarCollapsed]);
  const onMenuClick = () => (isDesktop ? toggleSidebar() : setMobileOpen((open) => !open));

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-ink-inverse focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60]"
      >
        Skip to content
      </a>

      <Header
        isDesktop={isDesktop}
        sidebarCollapsed={collapsed}
        mobileNavOpen={mobileOpen}
        onMenuClick={onMenuClick}
      />

      {isDesktop ? (
        <DesktopSidebar collapsed={collapsed} onExpand={expandSidebar} />
      ) : (
        <MobileSidebar open={mobileOpen} onClose={closeMobile} />
      )}

      <main
        id="main"
        tabIndex={-1}
        className={cn(
          'pt-header transition-[padding] duration-200 ease-out focus-visible:outline-none',
          isDesktop && (collapsed ? 'pl-sidebar-collapsed' : 'pl-sidebar'),
        )}
      >
        <Outlet />
      </main>

      <ArticlePreview />
    </div>
  );
}
