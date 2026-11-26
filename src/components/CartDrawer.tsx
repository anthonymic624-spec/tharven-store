import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatNaira } from '../brand.ts';
import type { CartItem, Product } from '../types.ts';
import { ProductMedia } from './ProductMedia.tsx';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  products: Product[];
  onClose: () => void;
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

export function CartDrawer({
  open,
  items,
  products,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onContinueShopping,
  onCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const resolved = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        ...item,
        product,
        lineTotal: product.priceNgn * item.quantity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const subtotal = resolved.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalUnits = resolved.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div className="flex h-full w-full max-w-md flex-col bg-white text-ink shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-ink" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">
              Your Bag ({totalUnits})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
            className="inline-flex h-10 w-10 items-center justify-center border border-black/12 text-ink transition-colors hover:border-black"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {resolved.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center border border-black/10 bg-surface">
                <ShoppingBag className="h-7 w-7 text-gold" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-ink">
                Your bag is empty
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                Explore the four official THARVEN pieces and add your selections
                to begin checkout.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onContinueShopping();
                }}
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 bg-ink px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-neutral-800"
              >
                <span>Explore Collection</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-black/10">
              {resolved.map((item) => (
                <li key={item.key} className="flex gap-4 py-5 first:pt-0">
                  <div className="w-20 shrink-0 border border-black/10">
                    <ProductMedia
                      src={item.product.images[0]}
                      alt={item.product.name}
                      productName={item.product.name}
                      aspectClassName="aspect-[4/5]"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-sm font-bold text-ink">
                          {item.product.name}
                        </h3>
                        <p className="mt-0.5 font-mono text-xs text-muted tabular-nums">
                          {formatNaira(item.product.priceNgn)} each
                        </p>
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="mt-1 text-xs text-muted">
                            {[
                              item.selectedSize
                                ? `Size: ${item.selectedSize}`
                                : null,
                              item.selectedColor
                                ? `Color: ${item.selectedColor}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.key)}
                        aria-label={`Remove ${item.product.name}`}
                        className="p-1.5 text-muted transition-colors hover:text-ink"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-black/15 bg-white">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, -1)}
                          aria-label={`Decrease quantity of ${item.product.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center text-ink hover:bg-surface"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span className="min-w-[2rem] text-center font-mono text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, 1)}
                          aria-label={`Increase quantity of ${item.product.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center text-ink hover:bg-surface"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <p className="font-mono text-sm font-bold text-ink tabular-nums">
                        {formatNaira(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {resolved.length > 0 && (
          <div className="border-t border-black/10 bg-white px-6 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-mono text-lg font-bold text-ink tabular-nums">
                {formatNaira(subtotal)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Delivery options and Moniepoint transfer details are shown at
              checkout.
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onCheckout}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 bg-ink px-5 py-3 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-neutral-800"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4 text-gold-soft" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onContinueShopping();
                }}
                className="min-h-[40px] w-full border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-black"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
