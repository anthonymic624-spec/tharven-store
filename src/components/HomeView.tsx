import { ArrowRight, Check, Heart, Mail, MessageCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  BRAND_LOGO,
  BRAND_NAME,
  BRAND_SLOGAN,
  BRAND_TAGLINE,
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_DISPLAY,
  CONTACT_WHATSAPP_URL,
  formatNaira,
} from '../brand.ts';
import type { Product } from '../types.ts';
import type { AppRoute } from './Navbar.tsx';
import { ProductMedia } from './ProductMedia.tsx';

interface HomeViewProps {
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onNavigate: (route: AppRoute) => void;
  onSelectProduct: (productId: string) => void;
  onQuickAdd: (product: Product) => void;
}

const NEWSLETTER_KEY = 'tharven_newsletter_v1';

export function HomeView({
  products,
  wishlistIds,
  onToggleWishlist,
  onNavigate,
  onSelectProduct,
  onQuickAdd,
}: HomeViewProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  const polo = products.find((p) => p.id === 'heritage-polo') ?? products[0];
  const shorts =
    products.find((p) => p.id === 'signature-leather-shorts') ?? products[1];
  const newArrivals = products.filter((p) => p.isNewArrival);

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNewsletterStatus(null);
    const trimmed = newsletterEmail.trim().toLowerCase();
    if (!newsletterConsent) {
      setNewsletterStatus({
        type: 'error',
        text: 'Please confirm consent to receive THARVEN release updates.',
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setNewsletterStatus({
        type: 'error',
        text: 'Please enter a valid email address.',
      });
      return;
    }

    setNewsletterSubmitting(true);
    try {
      const raw = window.localStorage.getItem(NEWSLETTER_KEY);
      const list: { email: string; consentedAt: string }[] = raw
        ? (JSON.parse(raw) as { email: string; consentedAt: string }[])
        : [];
      if (!list.some((item) => item.email === trimmed)) {
        list.unshift({
          email: trimmed,
          consentedAt: new Date().toISOString(),
        });
        window.localStorage.setItem(NEWSLETTER_KEY, JSON.stringify(list));
      }
    } catch {
      // Ignore storage quota issues
    }

    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          consent: newsletterConsent,
        }),
      });
    } catch {
      // Static hosting mode handles subscription locally
    }

    setNewsletterEmail('');
    setNewsletterConsent(false);
    setNewsletterStatus({
      type: 'success',
      text: 'You are subscribed to official THARVEN release updates.',
    });
    setNewsletterSubmitting(false);
  };

  return (
    <div className="bg-white text-ink">
      {/* 1. Pure White Luxury Editorial Hero */}
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-12 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <div className="mb-8 flex items-center gap-4">
                <img
                  src={BRAND_LOGO}
                  alt="THARVEN official crest"
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 border border-gold/50 object-cover sm:h-20 sm:w-20"
                />
                <div>
                  <p className="font-display text-xs font-bold tracking-[0.26em] text-gold uppercase">
                    {BRAND_NAME} · Official House
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted">
                    {BRAND_TAGLINE}
                  </p>
                </div>
              </div>

              <h1
                className="max-w-xl font-display font-extrabold tracking-tight text-ink"
                style={{
                  fontSize: 'clamp(2.35rem, 4.4vw, 3.85rem)',
                  lineHeight: 1.03,
                  textWrap: 'balance',
                }}
              >
                {BRAND_SLOGAN}
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
                Clean silhouettes, heavyweight structure, and restrained gold
                insignia. Designed for a generation that leads without noise.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="inline-flex min-h-[48px] items-center gap-3 bg-ink px-8 py-3.5 text-xs font-bold tracking-[0.16em] text-white uppercase transition-colors duration-150 hover:bg-neutral-800"
                >
                  <span>Shop Now</span>
                  <ArrowRight
                    className="h-4 w-4 text-gold-soft"
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('new-arrivals')}
                  className="inline-flex min-h-[44px] items-center border-b border-black/30 px-1 py-2 text-xs font-bold tracking-[0.14em] text-ink uppercase transition-colors hover:border-gold hover:text-gold"
                >
                  View New Arrivals
                </button>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-black/10 pt-6 text-xs">
              <div>
                <p className="font-semibold text-ink">Official Release</p>
                <p className="mt-1 text-muted tabular-nums">
                  {products.length} Signature Pieces
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink">Currency</p>
                <p className="mt-1 font-mono text-muted tabular-nums">
                  Nigerian Naira (₦)
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink">Checkout</p>
                <p className="mt-1 text-muted">Moniepoint &amp; WhatsApp</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 lg:col-span-6">
            {polo && (
              <button
                type="button"
                onClick={() => onSelectProduct(polo.id)}
                className="group relative overflow-hidden border border-black/10 bg-surface text-left lg:h-full"
              >
                <img
                  src={polo.images[0]}
                  alt={polo.name}
                  referrerPolicy="no-referrer"
                  className="h-full min-h-[280px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-gold-soft uppercase">
                    {polo.category}
                  </p>
                  <p className="mt-0.5 font-display text-sm font-bold text-white sm:text-base">
                    {polo.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-medium text-white/90 tabular-nums">
                    {formatNaira(polo.priceNgn)}
                  </p>
                </div>
              </button>
            )}

            {shorts && (
              <button
                type="button"
                onClick={() => onSelectProduct(shorts.id)}
                className="group relative overflow-hidden border border-black/10 bg-surface text-left lg:h-full"
              >
                <img
                  src={shorts.images[0]}
                  alt={shorts.name}
                  referrerPolicy="no-referrer"
                  className="h-full min-h-[280px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-gold-soft uppercase">
                    {shorts.category}
                  </p>
                  <p className="mt-0.5 font-display text-sm font-bold text-white sm:text-base">
                    {shorts.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-medium text-white/90 tabular-nums">
                    {formatNaira(shorts.priceNgn)}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Featured Collection Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
              Featured Collection
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              The THARVEN Catalogue
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-2 self-start text-xs font-bold tracking-[0.14em] text-ink uppercase underline decoration-gold underline-offset-4 transition-colors hover:text-gold sm:self-auto"
          >
            <span>Open Full Shop</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const requiresOptionChoice =
              product.sizes.length > 0 || product.colors.length > 0;
            const outOfStock = product.stock !== null && product.stock <= 0;
            const isSaved = wishlistIds.includes(product.id);

            return (
              <article
                key={product.id}
                className="group flex flex-col border border-black/10 bg-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product.id)}
                    className="block w-full text-left"
                  >
                    <ProductMedia
                      src={product.images[0]}
                      alt={product.name}
                      productName={product.name}
                      aspectClassName="aspect-[4/5]"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    aria-label={
                      isSaved
                        ? `Remove ${product.name} from wishlist`
                        : `Save ${product.name} to wishlist`
                    }
                    className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center border border-black/10 bg-white/95 text-ink transition-colors hover:border-black"
                  >
                    <Heart
                      className={`h-4 w-4 ${isSaved ? 'fill-ink text-ink' : 'text-ink'}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{product.category}</span>
                      {product.isNewArrival && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-gold">
                            New Arrival
                          </span>
                        </>
                      )}
                      {product.sizes.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{product.sizes.join(' / ')}</span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-2 font-display text-base font-bold text-ink">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product.id)}
                        className="text-left transition-colors hover:text-gold"
                      >
                        {product.name}
                      </button>
                    </h3>
                    <p className="mt-1.5 font-mono text-base font-bold text-ink tabular-nums">
                      {formatNaira(product.priceNgn)}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product.id)}
                      className="min-h-[40px] border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-black"
                    >
                      View Piece
                    </button>
                    <button
                      type="button"
                      disabled={outOfStock}
                      onClick={() =>
                        requiresOptionChoice
                          ? onSelectProduct(product.id)
                          : onQuickAdd(product)
                      }
                      className="min-h-[40px] bg-ink px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {outOfStock
                        ? 'Sold Out'
                        : requiresOptionChoice
                          ? 'Select Size'
                          : 'Add to Bag'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3. New Arrivals & Brand Editorial Banner */}
      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 gap-10 border border-black/10 bg-surface/50 p-6 sm:p-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
                Brand Introduction · New Arrivals
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Crafted for modern presence.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                THARVEN stands at the intersection of Gen Z street culture and
                tailored luxury restraint. Every piece across our apparel and
                accessories line is finished with crisp contrast lines, durable
                fabrics, and signature THARVEN gold and metallic hardware.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('new-arrivals')}
                  className="inline-flex min-h-[44px] items-center gap-2 bg-ink px-6 py-2.5 text-xs font-bold tracking-[0.14em] text-white uppercase hover:bg-neutral-800"
                >
                  <span>Explore New Arrivals</span>
                  <ArrowRight
                    className="h-4 w-4 text-gold-soft"
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('track-order')}
                  className="inline-flex min-h-[44px] items-center border border-black/20 bg-white px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-ink uppercase hover:border-black"
                >
                  Order Lookup
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
              {newArrivals.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectProduct(item.id)}
                  className="group flex flex-col border border-black/10 bg-white text-left transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <ProductMedia
                    src={item.images[0]}
                    alt={item.name}
                    productName={item.name}
                    aspectClassName="aspect-square"
                  />
                  <div className="p-3.5">
                    <p className="truncate font-display text-xs font-bold text-ink">
                      {item.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-semibold text-gold tabular-nums">
                      {formatNaira(item.priceNgn)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Customer Care & Newsletter Signup with Consent */}
      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="border border-black/10 bg-white p-6 sm:p-8 lg:col-span-6">
            <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
              Customer Care
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">
              Direct Studio Assistance
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Need help with sizing, delivery details, or confirming your
              Moniepoint transfer? Connect directly with THARVEN support.
            </p>

            <dl className="mt-6 space-y-3 border-t border-black/10 pt-5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">WhatsApp</dt>
                <dd className="font-mono font-semibold text-ink">
                  {CONTACT_WHATSAPP_DISPLAY}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Email</dt>
                <dd className="truncate font-medium text-ink">
                  {CONTACT_EMAIL}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={CONTACT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 bg-ink px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase hover:bg-neutral-800"
              >
                <MessageCircle
                  className="h-4 w-4 text-gold-soft"
                  aria-hidden="true"
                />
                <span>WhatsApp Support</span>
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-black/20 bg-white px-5 py-2.5 text-xs font-bold tracking-wider text-ink uppercase hover:border-black"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>Email Us</span>
              </a>
            </div>
          </div>

          <div className="border border-black/10 bg-white p-6 sm:p-8 lg:col-span-6">
            <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
              Private Dispatch
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">
              Join the THARVEN List
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Receive notifications on official restocks and future capsule
              announcements.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="home-newsletter-email"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  Email Address
                </label>
                <input
                  id="home-newsletter-email"
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted">
                <input
                  type="checkbox"
                  checked={newsletterConsent}
                  onChange={(e) => setNewsletterConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-black"
                />
                <span>
                  I consent to receive official release updates and editorial
                  emails from THARVEN.
                </span>
              </label>

              {newsletterStatus && (
                <div
                  role={newsletterStatus.type === 'error' ? 'alert' : 'status'}
                  className={`flex items-center gap-2 border px-3.5 py-2.5 text-xs font-medium ${
                    newsletterStatus.type === 'success'
                      ? 'border-gold/50 bg-surface text-ink'
                      : 'border-red-700/30 bg-red-50 text-red-900'
                  }`}
                >
                  {newsletterStatus.type === 'success' && (
                    <Check className="h-4 w-4 text-gold" aria-hidden="true" />
                  )}
                  <span>{newsletterStatus.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={newsletterSubmitting}
                className="min-h-[44px] w-full bg-ink px-5 py-2.5 text-xs font-bold tracking-[0.14em] text-white uppercase transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {newsletterSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
