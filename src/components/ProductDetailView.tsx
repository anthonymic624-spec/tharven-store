import { ArrowLeft, Check, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatNaira } from '../brand.ts';
import type { Product } from '../types.ts';
import { ProductMedia } from './ProductMedia.tsx';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    selectedSize: string | null,
    selectedColor: string | null,
  ) => void;
}

export function ProductDetailView({
  product,
  onBack,
  onAddToCart,
}: ProductDetailViewProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes[0] ?? null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors[0] ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedSize(product.sizes[0] ?? null);
    setSelectedColor(product.colors[0] ?? null);
    setQuantity(1);
    setErrorMsg(null);
    setJustAdded(false);
  }, [product]);

  const outOfStock = product.stock !== null && product.stock <= 0;
  const maxQty =
    product.stock !== null ? Math.max(1, Math.min(product.stock, 50)) : 50;

  const handleAdd = () => {
    setErrorMsg(null);
    if (product.sizes.length > 0 && !selectedSize) {
      setErrorMsg('Please select a size.');
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      setErrorMsg('Please select a color.');
      return;
    }
    if (product.stock !== null && product.stock <= 0) {
      setErrorMsg('This product is currently out of stock.');
      return;
    }
    if (product.stock !== null && quantity > product.stock) {
      setErrorMsg(`Only ${product.stock} unit(s) currently in stock.`);
      return;
    }

    onAddToCart(product, quantity, selectedSize, selectedColor);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex min-h-[40px] items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to Shop</span>
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left: Sticky Multi-Image Gallery */}
        <div className="lg:col-span-7">
          <div className="border border-ink/10 bg-cream">
            <ProductMedia
              src={product.images[activeImageIndex]}
              alt={`${product.name} view ${activeImageIndex + 1}`}
              productName={product.name}
              aspectClassName="aspect-[4/5]"
            />
          </div>

          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {product.images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View image ${idx + 1} of ${product.name}`}
                  className={`overflow-hidden border-2 transition-colors ${
                    idx === activeImageIndex
                      ? 'border-gold'
                      : 'border-ink/15 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5">
          <div className="border border-ink/12 bg-cream p-6 sm:p-8 lg:sticky lg:top-24">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-deep uppercase">
              {product.category}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
              {product.name}
            </h1>
            <p className="mt-2 font-mono text-2xl font-bold text-ink tabular-nums">
              {formatNaira(product.priceNgn)}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              {product.description}
            </p>

            <div className="mt-6 space-y-5 border-t border-ink/10 pt-6">
              {/* Stock status */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted">Availability</span>
                <span className="font-semibold text-ink">
                  {product.stock === null
                    ? 'Stock managed by store'
                    : product.stock > 0
                      ? `${product.stock} in stock`
                      : 'Out of stock'}
                </span>
              </div>

              {/* Sizes (rendered only when configured by Admin) */}
              {product.sizes.length > 0 ? (
                <div>
                  <span className="block text-xs font-semibold text-ink uppercase">
                    Size
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-h-[40px] min-w-[44px] border px-3.5 py-2 text-xs font-semibold transition-colors ${
                          selectedSize === size
                            ? 'border-obsidian bg-obsidian text-gold'
                            : 'border-ink/20 bg-beige text-ink hover:bg-sand'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Sizes have not been configured for this piece yet.
                </p>
              )}

              {/* Colors (rendered only when configured by Admin) */}
              {product.colors.length > 0 ? (
                <div>
                  <span className="block text-xs font-semibold text-ink uppercase">
                    Color
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`min-h-[40px] border px-3.5 py-2 text-xs font-semibold transition-colors ${
                          selectedColor === color
                            ? 'border-obsidian bg-obsidian text-gold'
                            : 'border-ink/20 bg-beige text-ink hover:bg-sand'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Colors have not been configured for this piece yet.
                </p>
              )}

              {/* Quantity */}
              <div>
                <span className="block text-xs font-semibold text-ink uppercase">
                  Quantity
                </span>
                <div className="mt-2 inline-flex items-center border border-ink/20 bg-beige">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="inline-flex h-10 w-10 items-center justify-center text-ink hover:bg-sand"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[3rem] text-center font-mono text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    aria-label="Increase quantity"
                    className="inline-flex h-10 w-10 items-center justify-center text-ink hover:bg-sand"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p
                  role="alert"
                  className="border border-red-800/30 bg-red-50 px-3 py-2 text-xs font-medium text-red-900"
                >
                  {errorMsg}
                </p>
              )}

              <button
                type="button"
                disabled={outOfStock}
                onClick={handleAdd}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 bg-obsidian px-6 py-3.5 text-sm font-bold text-gold transition-colors hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50"
              >
                {justAdded ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Added to Bag</span>
                  </>
                ) : outOfStock ? (
                  <span>Out of Stock</span>
                ) : (
                  <span>
                    Add to Bag · {formatNaira(product.priceNgn * quantity)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
