import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatNaira } from '../brand.ts';
import type { Product, ProductCategory } from '../types.ts';
import { ProductMedia } from './ProductMedia.tsx';

interface ShopViewProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onSelectProduct: (productId: string) => void;
  onQuickAdd: (product: Product) => void;
}

type CategoryFilter = 'All' | ProductCategory;
type SortMode = 'featured' | 'price-asc' | 'price-desc';

export function ShopView({
  products,
  loading,
  error,
  onSelectProduct,
  onQuickAdd,
}: ShopViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [sortMode, setSortMode] = useState<SortMode>('featured');

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    });

    if (sortMode === 'price-asc') {
      return [...list].sort((a, b) => a.priceNgn - b.priceNgn);
    }
    if (sortMode === 'price-desc') {
      return [...list].sort((a, b) => b.priceNgn - a.priceNgn);
    }
    return list;
  }, [products, searchQuery, category, sortMode]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-ink/10 pb-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-gold-deep uppercase">
          Catalog
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Shop THARVEN
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Select any piece to view available sizes, colors, and product gallery
          photos.
        </p>

        {/* Search, Category Filter & Sort Toolbar */}
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'Apparel', 'Accessories'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`min-h-[40px] px-4 py-2 text-xs font-semibold transition-colors ${
                  category === cat
                    ? 'bg-obsidian text-gold'
                    : 'border border-ink/15 bg-cream text-ink hover:bg-sand'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:w-64">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pieces..."
                aria-label="Search products"
                className="min-h-[40px] w-full border border-ink/20 bg-cream py-2 pr-3 pl-9 text-sm text-ink placeholder:text-muted/70"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="h-4 w-4 text-muted"
                aria-hidden="true"
              />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                aria-label="Sort products"
                className="min-h-[40px] border border-ink/20 bg-cream px-3 py-2 text-sm text-ink"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-96 animate-pulse border border-ink/10 bg-sand/50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="my-12 border border-ink/20 bg-cream p-6 text-center">
          <p className="font-semibold text-ink">Unable to load products</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="my-12 border border-ink/15 bg-cream p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            No matching pieces found
          </p>
          <p className="mt-1 text-sm text-muted">
            Try clearing your search or switching category filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCategory('All');
            }}
            className="mt-4 bg-obsidian px-5 py-2 text-xs font-semibold text-gold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => {
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
                      {product.images.length > 1 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{product.images.length} photos</span>
                        </>
                      )}
                      {product.stock !== null && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {product.stock > 0
                              ? `${product.stock} left`
                              : 'Out of stock'}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="mt-1.5 font-display text-lg font-bold text-ink">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product.id)}
                        className="text-left hover:text-gold-deep"
                      >
                        {product.name}
                      </button>
                    </h2>

                    <p className="mt-1 font-mono text-base font-semibold text-ink tabular-nums">
                      {formatNaira(product.priceNgn)}
                    </p>

                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product.id)}
                      className="min-h-[40px] border border-ink/20 bg-beige px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-sand"
                    >
                      View Details
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
                          ? 'Choose Options'
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
