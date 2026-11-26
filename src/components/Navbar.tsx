import { Heart, Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { BRAND_LOGO, BRAND_NAME } from '../brand.ts';

export type AppRoute =
  | 'home'
  | 'shop'
  | 'new-arrivals'
  | 'product'
  | 'wishlist'
  | 'checkout'
  | 'confirmation'
  | 'track-order'
  | 'contact'
  | 'admin';

interface NavbarProps {
  currentRoute: AppRoute;
  cartCount: number;
  wishlistCount: number;
  onNavigate: (route: AppRoute) => void;
  onOpenCart: () => void;
}

const NAV_LINKS: { route: AppRoute; label: string }[] = [
  { route: 'home', label: 'Home' },
  { route: 'shop', label: 'Shop' },
  { route: 'new-arrivals', label: 'New Arrivals' },
  { route: 'track-order', label: 'Track Order' },
  { route: 'contact', label: 'Contact' },
];

export function Navbar({
  currentRoute,
  cartCount,
  wishlistCount,
  onNavigate,
  onOpenCart,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (route: AppRoute) => {
    setMobileOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark + Crest */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex shrink-0 items-center gap-3 text-left whitespace-nowrap"
          aria-label="THARVEN Home"
        >
          <img
            src={BRAND_LOGO}
            alt="THARVEN logo"
            referrerPolicy="no-referrer"
            className="h-9 w-9 border border-black/15 object-cover"
          />
          <span className="font-display text-xl font-extrabold tracking-[0.16em] text-ink">
            {BRAND_NAME}
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden items-center gap-7 md:flex"
        >
          {NAV_LINKS.map((item) => {
            const active =
              currentRoute === item.route ||
              (item.route === 'shop' && currentRoute === 'product');
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleNav(item.route)}
                className={`relative shrink-0 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-gold transition-opacity duration-150 ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Bag & Mobile Toggle */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => handleNav('wishlist')}
            aria-label={`Saved pieces (${wishlistCount})`}
            className={`relative hidden min-h-[40px] min-w-[40px] items-center justify-center border px-2.5 transition-colors sm:inline-flex ${
              currentRoute === 'wishlist'
                ? 'border-gold text-ink'
                : 'border-black/12 text-ink hover:border-black/35'
            }`}
          >
            <Heart
              className={`h-4 w-4 ${wishlistCount > 0 ? 'fill-ink text-ink' : ''}`}
              aria-hidden="true"
            />
            {wishlistCount > 0 && (
              <span className="ml-1.5 font-mono text-xs font-semibold tabular-nums">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex min-h-[40px] shrink-0 items-center gap-2 bg-ink px-4 py-2 text-xs font-bold tracking-wide text-white whitespace-nowrap transition-colors duration-150 hover:bg-neutral-800"
          >
            <ShoppingBag className="h-4 w-4 text-gold-soft" aria-hidden="true" />
            <span className="tabular-nums">Bag ({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center border border-black/15 text-ink md:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="border-t border-black/10 bg-white px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => {
              const active = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleNav(item.route)}
                  className={`flex min-h-[44px] items-center justify-between border-b border-black/5 px-2 text-left text-sm font-medium ${
                    active ? 'font-bold text-ink' : 'text-muted'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 bg-gold" aria-hidden="true" />
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleNav('wishlist')}
              className="flex min-h-[44px] items-center justify-between border-b border-black/5 px-2 text-left text-sm font-medium text-muted"
            >
              <span>Saved Pieces</span>
              <span className="font-mono text-xs tabular-nums">
                {wishlistCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className="flex min-h-[44px] items-center px-2 text-left text-xs font-semibold tracking-wider text-muted uppercase"
            >
              Admin Dashboard
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
