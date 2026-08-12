import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $authSession, logout } from '../../../stores/authStore';
import { t } from '../../../i18n';
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { SquareButton } from '../ui/SquareButton';

export const Navbar: React.FC = () => {
  const session = useStore($authSession);
  const user = session.user;
  const role = session.role as 'farmer' | 'buyer' | 'admin';
  const lang = user?.preferredLanguage || 'en';

  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updatePath = () => setCurrentPath(window.location.pathname);
    updatePath();

    document.addEventListener('astro:page-load', updatePath);
    return () => document.removeEventListener('astro:page-load', updatePath);
  }, []);

  // Do not render full app navbar on auth / language selection pages
  if (currentPath === '/login' || currentPath === '/register' || currentPath === '/language-selection') {
    return null;
  }

  const getNavLinks = () => {
    if (role === 'buyer') {
      return [
        { label: t('nav.dashboard', lang),        href: '/buyer/dashboard' },
        { label: t('nav.marketplace', lang),      href: '/buyer/marketplace' },
        { label: t('nav.myOrders', lang),         href: '/buyer/orders' },
        { label: t('nav.farmerDirectory', lang),  href: '/buyer/farmers' },
      ];
    }
    if (role === 'admin') {
      return [
        { label: t('nav.dashboard', lang),        href: '/admin/dashboard' },
        { label: t('nav.verifications', lang),    href: '/admin/users' },
        { label: t('nav.moderation', lang),       href: '/admin/listings' },
        { label: t('nav.analytics', lang),        href: '/admin/analytics' },
      ];
    }
    // Default farmer links
    return [
      { label: t('nav.dashboard', lang),        href: '/farmer/dashboard' },
      { label: t('nav.smartCropPlanner', lang), href: '/farmer/crop-planner' },
      { label: t('nav.marketTrends', lang),     href: '/farmer/market' },
      { label: t('nav.myListings', lang),       href: '/farmer/listings' },
      { label: t('nav.orders', lang),           href: '/farmer/orders' },
    ];
  };

  const links = getNavLinks();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-[#ebebeb] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

        {/* Brand Text Only - No Logo */}
        <a href="/" className="flex items-center shrink-0 hover:opacity-80 transition-opacity">
          <span className="text-base font-bold text-[#171717] tracking-tight">
            {t('nav.brand', lang)}
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active =
              currentPath === l.href ||
              (l.href !== '/' && currentPath.startsWith(l.href)) ||
              (l.href === '/farmer/crop-planner' && currentPath === '/farmer/recommend');

            return (
              <a
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-all duration-150 ${
                  active
                    ? 'text-[#171717] font-semibold bg-[#f2f2f2] border border-[#ebebeb]'
                    : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa]'
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </div>

        {/* Right side controls */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <a
                href="/profile"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentPath === '/profile'
                    ? 'bg-[#f2f2f2] text-[#171717] font-semibold border border-[#ebebeb]'
                    : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa]'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5 text-[#0070f3]" />
                <span>{user.name.split(' ')[0]}</span>
              </a>
              <SquareButton
                variant="ghost"
                size="sm"
                onClick={() => logout(true)}
                icon={<LogOut className="w-3.5 h-3.5 text-[#666666]" />}
              >
                {t('nav.signOut', lang)}
              </SquareButton>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a href="/login">
                <SquareButton variant="ghost" size="sm">Sign In</SquareButton>
              </a>
              <a href="/register">
                <SquareButton variant="primary" size="sm">Create Account</SquareButton>
              </a>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-1.5 rounded-md text-[#171717] hover:bg-[#f2f2f2] transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden bg-white border-b border-[#ebebeb] px-4 py-4 space-y-3 shadow-lg">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3 py-2 rounded-md text-sm text-[#4d4d4d] hover:text-[#171717] hover:bg-[#f2f2f2] font-medium"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-[#ebebeb]">
            {user ? (
              <div className="flex items-center justify-between">
                <a href="/profile" className="text-sm font-medium text-[#171717] flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-[#0070f3]" />
                  <span>{user.name}</span>
                </a>
                <button
                  onClick={() => { logout(true); setOpen(false); }}
                  className="text-xs text-[#ee0000] hover:underline font-medium"
                >
                  {t('nav.signOut', lang)}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <a href="/login" className="w-full">
                  <button className="w-full py-2 text-center text-sm font-medium text-[#171717] bg-[#f4f4f4] rounded-md">
                    Sign In
                  </button>
                </a>
                <a href="/register" className="w-full">
                  <button className="w-full py-2 text-center text-sm font-medium text-white bg-[#171717] rounded-md">
                    Create Account
                  </button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
