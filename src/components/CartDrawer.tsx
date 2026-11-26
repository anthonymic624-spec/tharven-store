import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
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
  onCheckout: () => void;
}

export function CartDrawer({
  open,
  items,
  products,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const enriched = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { item, product } : null;
    })
    .filter((entry): entry is { item: CartItem; product: Product } =>
      Boolean(entry),
    );

  const subtotalNgn = enriched.reduce(
    (sum, { item, product }) => sum + product.priceNgn * item.quantity,
    0,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-obsidian/70 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-ink/15 bg-cream text-ink shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-gold-deep" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold tracking-tight">
              Your Bag
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center border border-ink/15 text-ink transition-colors hover:bg-sand"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {enriched.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <p className="font-display text-lg font-semibold text-ink">
                Your bag is empty
              </p>
              <p className="mt-2 max-w-xs text-sm text-muted">
                Explore the THARVEN collection to add shirts, shorts, or
                accessories.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 bg-obsidian px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-charcoal"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {enriched.map(({ item, product }) => (
                <li key={item.key} className="flex gap-4 py-5 first:pt-0">
                  <div className="w-20 shrink-0">
                    <ProductMedia
                      src={product.images[0]}
                      alt={product.name}
                      productName={product.name}
                      aspectClassName="aspect-[4/5]"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-base font-semibold text-ink">
                          {product.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.key)}
                          aria-label={`Remove ${product.name}`}
                          className="p-1 text-muted transition-colors hover:text-ink"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-0.5 font-mono text-sm font-medium text-ink tabular-nums">
                        {formatNaira(product.priceNgn)}
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

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-ink/20 bg-beige">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, -1)}
                          aria-label={`Decrease quantity of ${product.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center text-ink hover:bg-sand"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2rem] text-center font-mono text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, 1)}
                          aria-label={`Increase quantity of ${product.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center text-ink hover:bg-sand"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                        {formatNaira(product.priceNgn * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {enriched.length > 0 && (
          <div className="border-t border-ink/15 bg-beige px-6 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-mono text-lg font-bold text-ink tabular-nums">
                {formatNaira(subtotalNgn)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Delivery fees are calculated at checkout if configured.
            </p>
            <button
              type="button"
              onClick={onCheckout}
              className="mt-4 w-full bg-obsidian py-3.5 text-sm font-semibold text-gold transition-colors hover:bg-charcoal"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
