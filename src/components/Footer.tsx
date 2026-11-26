import {
  BRAND_LOGO,
  BRAND_NAME,
  BRAND_SLOGAN,
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_DISPLAY,
  CONTACT_WHATSAPP_URL,
} from '../brand.ts';
import type { AppRoute } from './Navbar.tsx';

export function Footer({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <footer className="border-t border-gold/20 bg-obsidian text-sand">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={BRAND_LOGO}
              alt="THARVEN logo"
              referrerPolicy="no-referrer"
              className="h-10 w-10 border border-gold/40 object-cover"
            />
            <span className="font-display text-lg font-bold tracking-[0.18em] text-gold">
              {BRAND_NAME}
            </span>
          </div>
          <p className="mt-3 text-xs tracking-wider text-sand/80">
            {BRAND_SLOGAN}
          </p>
        </div>

        <div>
          <h2 className="font-display text-xs font-semibold tracking-wider text-gold uppercase">
            Navigation
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(
              [
                ['home', 'Home'],
                ['shop', 'Shop'],
                ['delivery', 'Delivery'],
                ['support', 'Support & Order Lookup'],
                ['admin', 'Admin'],
              ] as const
            ).map(([route, label]) => (
              <li key={route}>
                <button
                  type="button"
                  onClick={() => onNavigate(route)}
                  className="text-sand/80 transition-colors hover:text-gold"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xs font-semibold tracking-wider text-gold uppercase">
            Customer Care
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={CONTACT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sand/85 transition-colors hover:text-gold"
              >
                WhatsApp: {CONTACT_WHATSAPP_DISPLAY}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sand/85 transition-colors hover:text-gold"
              >
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 px-4 py-5 text-center text-xs text-sand/60">
        © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
