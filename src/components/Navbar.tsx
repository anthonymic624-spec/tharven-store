import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { BRAND_LOGO, BRAND_NAME } from '../brand.ts';

export type AppRoute =
  | 'home'
  | 'shop'
  | 'product'
  | 'checkout'
  | 'confirmation'
  | 'delivery'
  | 'support'
  | 'admin';

interface NavbarProps {
  currentRoute: AppRoute;
  cartCount: number;
  onNavigate: (route: AppRoute) => void;
  onOpenCart: () => void;
}

const NAV_ITEMS: Array<{ route: AppRoute; label: string }> = [
  { route: 'home', label: 'Home' },
  { route: 'shop', label: 'Shop' },
  { route: 'delivery', label: 'Delivery' },
  { route: 'support', label: 'Support' },
  { route: 'admin', label: 'Admin' },
];

export function Navbar({
  currentRoute,
  cartCount,
  onNavigate,
  onOpenCart,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (route: AppRoute) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-obsidian text-cream">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark & Uploaded Crest */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleNav('home');
          }}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap focus-visible:outline-gold"
        >
          <img
            src={BRAND_LOGO}
            alt="THARVEN logo"
            referrerPolicy="no-referrer"
            className="h-9 w-9 shrink-0 rounded-sm border border-gold/40 object-cover"
          />
          <span className="font-display text-lg font-bold tracking-[0.18em] text-gold whitespace-nowrap shrink-0">
            {BRAND_NAME}
          </span>
        </a>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 md:flex"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentRoute === item.route ||
              (item.route === 'shop' && currentRoute === 'product');
            return (
              <a
                key={item.route}
                href={`#${item.route}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.route);
                }}
                className={`whitespace-nowrap shrink-0 border-b-2 py-1 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'border-gold text-gold'
                    : 'border-transparent text-sand/85 hover:border-gold/50 hover:text-cream'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action (Bag) + Mobile Menu Trigger */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap bg-gold px-4 py-2 text-sm font-semibold text-obsidian transition-colors duration-150 hover:bg-gold/90"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">Bag ({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-cream/20 text-cream md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-cream/10 bg-charcoal px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                currentRoute === item.route ||
                (item.route === 'shop' && currentRoute === 'product');
              return (
                <a
                  key={item.route}
                  href={`#${item.route}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item.route);
                  }}
                  className={`flex min-h-[44px] items-center px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-obsidian text-gold'
                      : 'text-sand hover:bg-obsidian/60 hover:text-cream'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
