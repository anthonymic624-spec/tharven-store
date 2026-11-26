import { ArrowRight, Mail, MessageCircle } from 'lucide-react';
import {
  BRAND_LOGO,
  BRAND_NAME,
  BRAND_SLOGAN,
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
  onNavigate: (route: AppRoute) => void;
  onSelectProduct: (productId: string) => void;
  onQuickAdd: (product: Product) => void;
}

export function HomeView({
  products,
  onNavigate,
  onSelectProduct,
  onQuickAdd,
}: HomeViewProps) {
  const shirtImage =
    products.find((p) => p.id === 'shirt')?.images[0] ??
    '/assets/aistudio/f174dc1c-0dfb-413f-88f6-e3a273eb35b9_28f937c9.jpeg';
  const shortsImage =
    products.find((p) => p.id === 'shorts')?.images[0] ??
    '/assets/aistudio/748666a7-eb13-4d73-b369-e7cd7f9836d0_9ef2d481.jpeg';

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="border-b border-ink/10 bg-obsidian text-cream">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              <div className="mb-8 flex items-center gap-4">
                <img
                  src={BRAND_LOGO}
                  alt="THARVEN official crest"
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 border border-gold/40 object-cover sm:h-20 sm:w-20"
                />
                <div>
                  <p className="font-display text-xs font-semibold tracking-[0.26em] text-gold uppercase">
                    {BRAND_NAME} Official Store
                  </p>
                  <p className="mt-1 text-sm text-sand/75">
                    Contemporary Apparel &amp; Statement Accessories
                  </p>
                </div>
              </div>

              <h1
                className="max-w-2xl font-display font-bold tracking-tight text-cream"
                style={{
                  fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)',
                  lineHeight: 1.05,
                  textWrap: 'balance',
                }}
              >
                {BRAND_SLOGAN}
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-sand/85 sm:text-lg">
                Bold silhouettes, heavyweight presence, and sculpted gold-toned
                detailing. Crafted for a generation that moves with certainty.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="inline-flex min-h-[44px] items-center gap-2.5 bg-gold px-7 py-3 text-sm font-bold tracking-wide text-obsidian transition-colors duration-150 hover:bg-gold/90"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('support')}
                  className="inline-flex min-h-[44px] items-center border-b border-gold/60 px-1 py-2 text-sm font-medium text-sand transition-colors hover:border-gold hover:text-gold"
                >
                  Track an Order
                </button>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-cream/10 pt-6 text-xs text-sand/75">
              <div>
                <p className="font-semibold text-cream">Collection</p>
                <p className="mt-1">Apparel &amp; Hardware</p>
              </div>
              <div>
                <p className="font-semibold text-cream">Currency</p>
                <p className="mt-1 font-mono tabular-nums">Nigerian Naira (₦)</p>
              </div>
              <div>
                <p className="font-semibold text-cream">Customer Care</p>
                <p className="mt-1">WhatsApp &amp; Email</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:col-span-5">
            <button
              type="button"
              onClick={() => onSelectProduct('shirt')}
              className="group relative overflow-hidden border border-gold/25 bg-charcoal text-left lg:h-full"
            >
              <img
                src={shirtImage}
                alt="THARVEN Shirt"
                referrerPolicy="no-referrer"
                className="h-full min-h-[260px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/90 via-obsidian/50 to-transparent p-4">
                <p className="text-xs text-gold">Apparel</p>
                <p className="font-display text-base font-semibold text-cream">
                  Shirt · <span className="font-mono tabular-nums">₦50,000</span>
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectProduct('shorts')}
              className="group relative overflow-hidden border border-gold/25 bg-charcoal text-left lg:h-full"
            >
              <img
                src={shortsImage}
                alt="THARVEN Shorts"
                referrerPolicy="no-referrer"
                className="h-full min-h-[260px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/90 via-obsidian/50 to-transparent p-4">
                <p className="text-xs text-gold">Apparel</p>
                <p className="font-display text-base font-semibold text-cream">
                  Shorts · <span className="font-mono tabular-nums">₦60,000</span>
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Featured Collection Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-deep uppercase">
              Featured Pieces
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              The Core Collection
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-2 self-start text-sm font-semibold text-ink underline decoration-gold underline-offset-4 transition-colors hover:text-gold-deep sm:self-auto"
          >
            <span>Explore Full Shop</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const requiresOptionChoice =
              product.sizes.length > 0 || product.colors.length > 0;
            const outOfStock = product.stock !== null && product.stock <= 0;

            return (
              <article
                key={product.id}
                className="group flex flex-col border border-ink/10 bg-cream transition-transform duration-200 hover:-translate-y-0.5"
              >
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

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{product.category}</span>
                      {product.stock !== null && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {product.stock > 0
                              ? `${product.stock} in stock`
                              : 'Out of stock'}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-bold text-ink">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product.id)}
                        className="text-left hover:text-gold-deep"
                      >
                        {product.name}
                      </button>
                    </h3>
                    <p className="mt-1 font-mono text-base font-semibold text-ink tabular-nums">
                      {formatNaira(product.priceNgn)}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product.id)}
                      className="min-h-[40px] border border-ink/20 bg-beige px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-sand"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      disabled={outOfStock}
                      onClick={() =>
                        requiresOptionChoice
                          ? onSelectProduct(product.id)
                          : onQuickAdd(product)
                      }
                      className="min-h-[40px] bg-obsidian px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {outOfStock
                        ? 'Sold Out'
                        : requiresOptionChoice
                          ? 'Select Options'
                          : 'Add to Bag'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3. Brand Ethos & Customer Support */}
      <section className="border-t border-ink/10 bg-sand/60">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-deep uppercase">
              Brand Identity
            </p>
            <h2 className="mt-2 max-w-xl font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Beyond apparel—built to wear with conviction.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              THARVEN merges sharp streetwear silhouettes with heritage crest
              detailing in obsidian black, burnished gold, and warm sand tones.
              Every release is curated directly from our studio with manual
              payment verification and responsive personal support.
            </p>
          </div>

          <div className="flex flex-col justify-between border border-ink/12 bg-cream p-6 lg:col-span-5">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Direct Customer Care
              </h3>
              <p className="mt-1 text-sm text-muted">
                Questions about sizing, delivery, or your Moniepoint transfer?
                Reach our team directly.
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-ink/10 pb-2.5">
                  <dt className="text-muted">WhatsApp</dt>
                  <dd className="font-mono font-medium text-ink">
                    {CONTACT_WHATSAPP_DISPLAY}
                  </dd>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <dt className="text-muted">Email</dt>
                  <dd className="truncate font-medium text-ink">
                    {CONTACT_EMAIL}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={CONTACT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 bg-obsidian px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-charcoal"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>WhatsApp Care</span>
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 border border-ink/20 bg-beige px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
