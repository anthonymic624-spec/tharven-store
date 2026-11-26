import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CONTACT_WHATSAPP_URL,
  PAYMENT_DETAILS,
  formatNaira,
} from '../brand.ts';
import type { Product } from '../types.ts';
import { ProductMedia } from './ProductMedia.tsx';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onBack: () => void;
  onSelectProduct: (productId: string) => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    selectedSize: string | null,
    selectedColor: string | null,
  ) => void;
}

export function ProductDetailView({
  product,
  allProducts,
  wishlistIds,
  onToggleWishlist,
  onBack,
  onSelectProduct,
  onAddToCart,
}: ProductDetailViewProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes[0] ?? null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors[0] ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setActiveImageIdx(0);
    setSelectedSize(product.sizes[0] ?? null);
    setSelectedColor(product.colors[0] ?? null);
    setQuantity(1);
    setValidationError(null);
  }, [product]);

  const outOfStock = product.stock !== null && product.stock <= 0;
  const maxQuantity =
    product.stock !== null ? Math.max(1, Math.min(50, product.stock)) : 50;
  const isSaved = wishlistIds.includes(product.id);
  const relatedProducts = allProducts.filter((p) => p.id !== product.id);

  const handleAdd = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      setValidationError('Please select a size before adding to bag.');
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      setValidationError('Please select a color before adding to bag.');
      return;
    }
    setValidationError(null);
    onAddToCart(product, quantity, selectedSize, selectedColor);
  };

  return (
    <section className="mx-auto max-w-7xl bg-white px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[40px] items-center gap-2 text-xs font-bold tracking-[0.14em] text-muted uppercase transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to Collection</span>
      </button>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left: Sticky Gallery */}
        <div className="lg:col-span-7">
          <div className="border border-black/10 bg-surface">
            <ProductMedia
              src={product.images[activeImageIdx] ?? product.images[0]}
              alt={product.name}
              productName={product.name}
              aspectClassName="aspect-[4/5]"
            />
          </div>

          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={imgUrl}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`View ${product.name} photograph ${idx + 1}`}
                  className={`overflow-hidden border transition-colors ${
                    idx === activeImageIdx
                      ? 'border-gold ring-1 ring-gold'
                      : 'border-black/12 hover:border-black'
                  }`}
                >
                  <ProductMedia
                    src={imgUrl}
                    alt={`${product.name} view ${idx + 1}`}
                    productName={product.name}
                    aspectClassName="aspect-square"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{product.category}</span>
                {product.isNewArrival && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-gold">New Arrival</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className="inline-flex min-h-[38px] items-center gap-1.5 border border-black/15 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-black"
              >
                <Heart
                  className={`h-3.5 w-3.5 ${isSaved ? 'fill-ink text-ink' : ''}`}
                  aria-hidden="true"
                />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-3 font-mono text-2xl font-bold text-ink tabular-nums">
              {formatNaira(product.priceNgn)}
            </p>

            {product.stock !== null && (
              <p className="mt-2 text-xs font-medium text-muted">
                Availability:{' '}
                <span className="font-semibold text-ink">
                  {product.stock > 0
                    ? `${product.stock} unit(s) available`
                    : 'Currently out of stock'}
                </span>
              </p>
            )}

            <p className="mt-5 border-t border-black/10 pt-5 text-sm leading-relaxed text-muted sm:text-base">
              {product.description}
            </p>

            {/* Size Selector (only displayed when admin has configured sizes) */}
            {product.sizes.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-bold tracking-[0.14em] text-ink uppercase">
                  Select Size
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const active = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-h-[42px] min-w-[48px] px-4 py-2 text-xs font-bold transition-colors ${
                          active
                            ? 'bg-ink text-white'
                            : 'border border-black/20 bg-white text-ink hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selector (only displayed when admin has configured colors) */}
            {product.colors.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-bold tracking-[0.14em] text-ink uppercase">
                  Select Color
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const active = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`min-h-[42px] px-4 py-2 text-xs font-bold transition-colors ${
                          active
                            ? 'bg-ink text-white'
                            : 'border border-black/20 bg-white text-ink hover:border-black'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="mt-6">
              <p className="text-xs font-bold tracking-[0.14em] text-ink uppercase">
                Quantity
              </p>
              <div className="mt-2.5 inline-flex items-center border border-black/20 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="inline-flex h-11 w-11 items-center justify-center text-ink hover:bg-surface"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="min-w-[3rem] text-center font-mono text-sm font-bold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(maxQuantity, q + 1))
                  }
                  aria-label="Increase quantity"
                  className="inline-flex h-11 w-11 items-center justify-center text-ink hover:bg-surface"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {validationError && (
              <p
                role="alert"
                className="mt-4 border border-red-700/30 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-900"
              >
                {validationError}
              </p>
            )}

            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAdd}
              className="mt-7 flex min-h-[50px] w-full items-center justify-center gap-2.5 bg-ink px-6 py-3.5 text-xs font-bold tracking-[0.16em] text-white uppercase transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ShoppingBag
                className="h-4 w-4 text-gold-soft"
                aria-hidden="true"
              />
              <span>
                {outOfStock
                  ? 'Sold Out'
                  : `Add to Bag · ${formatNaira(product.priceNgn * quantity)}`}
              </span>
            </button>

            <div className="mt-6 space-y-2.5 border-t border-black/10 pt-5 text-xs text-muted">
              <p>
                Payment via manual {PAYMENT_DETAILS.provider} bank transfer at
                checkout ({PAYMENT_DETAILS.accountName}).
              </p>
              <a
                href={CONTACT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-gold underline-offset-4 hover:text-gold"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Ask about sizing or fit on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products (Strictly from the 4 official products) */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 border-t border-black/10 pt-14">
          <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
            Complete the Silhouette
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-ink">
            More From THARVEN
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {relatedProducts.map((rel) => (
              <article
                key={rel.id}
                className="group flex flex-col border border-black/10 bg-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                <button
                  type="button"
                  onClick={() => onSelectProduct(rel.id)}
                  className="block w-full text-left"
                >
                  <ProductMedia
                    src={rel.images[0]}
                    alt={rel.name}
                    productName={rel.name}
                    aspectClassName="aspect-[4/5]"
                  />
                </button>
                <div className="p-5">
                  <p className="text-xs text-muted">{rel.category}</p>
                  <h3 className="mt-1 font-display text-base font-bold text-ink">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(rel.id)}
                      className="text-left hover:text-gold"
                    >
                      {rel.name}
                    </button>
                  </h3>
                  <p className="mt-1 font-mono text-sm font-bold text-ink tabular-nums">
                    {formatNaira(rel.priceNgn)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
