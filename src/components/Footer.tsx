import { Mail, MessageCircle } from 'lucide-react';
import {
  BRAND_LOGO,
  BRAND_NAME,
  BRAND_SLOGAN,
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_DISPLAY,
  CONTACT_WHATSAPP_URL,
  PAYMENT_DETAILS,
} from '../brand.ts';
import type { SocialLinks } from '../types.ts';
import type { AppRoute } from './Navbar.tsx';

interface FooterProps {
  social: SocialLinks;
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ social, onNavigate }: FooterProps) {
  const activeSocials = [
    { label: 'Instagram', url: social.instagram },
    { label: 'TikTok', url: social.tiktok },
    { label: 'X', url: social.x },
  ].filter((item) => item.url.trim().length > 0);

  return (
    <footer className="border-t border-black/10 bg-white text-ink">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3.5">
              <img
                src={BRAND_LOGO}
                alt="THARVEN official logo"
                referrerPolicy="no-referrer"
                className="h-12 w-12 border border-black/15 object-cover"
              />
              <div>
                <p className="font-display text-xl font-extrabold tracking-[0.16em] text-ink">
                  {BRAND_NAME}
                </p>
                <p className="mt-0.5 text-xs font-medium tracking-wide text-gold">
                  {BRAND_SLOGAN}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Minimalist luxury streetwear and signature hardware priced in
              Nigerian Naira (₦), crafted for confident everyday expression.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-bold tracking-[0.16em] text-ink uppercase">
              Storefront
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="transition-colors hover:text-ink"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="transition-colors hover:text-ink"
                >
                  Shop Official Collection
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('new-arrivals')}
                  className="transition-colors hover:text-ink"
                >
                  New Arrivals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('wishlist')}
                  className="transition-colors hover:text-ink"
                >
                  Saved Pieces
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('track-order')}
                  className="transition-colors hover:text-ink"
                >
                  Track Your Order
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="text-xs font-bold tracking-[0.16em] text-ink uppercase">
              Customer Care &amp; Payment
            </p>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <a
                href={CONTACT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 font-medium text-ink transition-colors hover:text-gold"
              >
                <MessageCircle className="h-4 w-4 text-gold" aria-hidden="true" />
                <span>WhatsApp: {CONTACT_WHATSAPP_DISPLAY}</span>
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-2.5 font-medium text-ink transition-colors hover:text-gold"
              >
                <Mail className="h-4 w-4 text-gold" aria-hidden="true" />
                <span>{CONTACT_EMAIL}</span>
              </a>
              <p className="pt-1 text-xs leading-relaxed text-muted">
                Manual Transfers: {PAYMENT_DETAILS.provider} ·{' '}
                <span className="font-mono text-ink">
                  {PAYMENT_DETAILS.accountNumber}
                </span>{' '}
                ({PAYMENT_DETAILS.accountName})
              </p>

              {activeSocials.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-2">
                  {activeSocials.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-b border-black/20 pb-0.5 text-xs font-semibold text-ink hover:border-gold hover:text-gold"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-6 text-xs text-muted sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="hover:text-ink"
            >
              Customer Support
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="hover:text-ink"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
