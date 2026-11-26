import { Heart, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatNaira } from '../brand.ts';
import type { Product } from '../types.ts';
import { ProductMedia } from './ProductMedia.tsx';

export type ShopFilterMode =
  | 'all'
  | 'Apparel'
  | 'Accessories'
  | 'new-arrivals'
  | 'saved';

interface ShopViewProps {
  products: Product[];
  wishlistIds: string[];
  initialFilter?: ShopFilterMode;
  loading: boolean;
  error: string | null;
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (productId: string) => void;
  onQuickAdd: (product: Product) => void;
}

export function ShopView({
  products,
  wishlistIds,
  initialFilter = 'all',
  loading,
  error,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd,
}: ShopViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<ShopFilterMode>(initialFilter);
  const [sortOrder, setSortOrder] = useState<
    'featured' | 'price-asc' | 'price-desc'
  >('featured');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((product) => {
      if (filterMode === 'Apparel' && product.category !== 'Apparel') {
        return false;
      }
      if (filterMode === 'Accessories' && product.category !== 'Accessories') {
        return false;
      }
      if (filterMode === 'new-arrivals' && !product.isNewArrival) {
        return false;
      }
      if (filterMode === 'saved' && !wishlistIds.includes(product.id)) {
        return false;
      }
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q)
      );
    });

    if (sortOrder === 'price-asc') {
      return [...list].sort((a, b) => a.priceNgn - b.priceNgn);
    }
    if (sortOrder === 'price-desc') {
      return [...list].sort((a, b) => b.priceNgn - a.priceNgn);
    }
    return list;
  }, [products, filterMode, searchQuery, sortOrder, wishlistIds]);

  const pageHeading =
    filterMode === 'new-arrivals'
      ? 'New Arrivals'
      : filterMode === 'saved'
        ? 'Saved Pieces'
        : 'Official Collection';

  const filterTabs: { value: ShopFilterMode; label: string }[] = [
    { value: 'all', label: 'All Pieces' },
    { value: 'Apparel', label: 'Apparel' },
    { value: 'Accessories', label: 'Accessories' },
    { value: 'new-arrivals', label: 'New Arrivals' },
    { value: 'saved', label: `Saved (${wishlistIds.length})` },
  ];

  return (
    <section className="mx-auto max-w-7xl bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="border-b border-black/10 pb-8">
        <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
          THARVEN Catalogue
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {pageHeading}
          </h1>
          <p className="font-mono text-xs text-muted tabular-nums">
            Showing {filteredProducts.length} of {products.length} official
            pieces
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const active = filterMode === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilterMode(tab.value)}
                className={`min-h-[40px] px-4 py-2 text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-ink text-white'
                    : 'border border-black/15 bg-white text-ink hover:border-black'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search THARVEN pieces..."
              aria-label="Search products"
              className="min-h-[42px] w-full border border-black/20 bg-white pr-3.5 pl-10 text-sm text-ink focus:border-black sm:w-64"
            />
          </div>

          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(
                e.target.value as 'featured' | 'price-asc' | 'price-desc',
              )
            }
            aria-label="Sort products"
            className="min-h-[42px] border border-black/20 bg-white px-3.5 py-2 text-xs font-bold tracking-wider text-ink uppercase focus:border-black"
          >
            <option value="featured">Featured Order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted">
          Loading THARVEN collection...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mt-8 border border-red-700/30 bg-red-50 p-6 text-sm text-red-900"
        >
          {error}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mt-10 border border-black/10 bg-surface/50 p-12 text-center">
          <h2 className="font-display text-xl font-bold text-ink">
            No matching pieces found
          </h2>
          <p className="mt-2 text-sm text-muted">
            {filterMode === 'saved'
              ? 'You have not saved any pieces to your wishlist yet.'
              : 'Try adjusting your search or filter to view the full THARVEN collection.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterMode('all');
              setSearchQuery('');
            }}
            className="mt-5 min-h-[42px] bg-ink px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase hover:bg-neutral-800"
          >
            View All Pieces
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
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
                      {product.stock !== null && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {product.stock > 0
                              ? `${product.stock} in stock`
                              : 'Sold out'}
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="mt-2 font-display text-base font-bold text-ink">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product.id)}
                        className="text-left transition-colors hover:text-gold"
                      >
                        {product.name}
                      </button>
                    </h2>
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
                      className="min-h-[40px] bg-ink px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-45"
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
      )}
    </section>
  );
}
