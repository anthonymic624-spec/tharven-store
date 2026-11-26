import { useCallback, useEffect, useState } from 'react';
import { BRAND_NAME, BRAND_SLOGAN } from './brand.ts';
import { AdminView } from './components/AdminView.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutView } from './components/CheckoutView.tsx';
import { Footer } from './components/Footer.tsx';
import { HomeView } from './components/HomeView.tsx';
import { Navbar, type AppRoute } from './components/Navbar.tsx';
import { OrderConfirmationView } from './components/OrderConfirmationView.tsx';
import { ProductDetailView } from './components/ProductDetailView.tsx';
import { ShopView } from './components/ShopView.tsx';
import {
  ContactSupportView,
  TrackOrderView,
} from './components/TrackOrderContactViews.tsx';
import type {
  CartItem,
  DeliveryConfig,
  Order,
  Product,
  SocialLinks,
  StorefrontPublicData,
} from './types.ts';

const CART_STORAGE_KEY = 'tharven_luxury_cart_v1';
const WISHLIST_STORAGE_KEY = 'tharven_luxury_wishlist_v1';

function loadInitialCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as CartItem).key === 'string' &&
        typeof (item as CartItem).productId === 'string' &&
        typeof (item as CartItem).quantity === 'number' &&
        (item as CartItem).quantity > 0,
    );
  } catch {
    return [];
  }
}

function loadInitialWishlist(): string[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [selectedProductId, setSelectedProductId] =
    useState<string>('heritage-polo');
  const [products, setProducts] = useState<Product[]>([]);
  const [delivery, setDelivery] = useState<DeliveryConfig>({
    configured: false,
    generalNotes: '',
    rules: [],
  });
  const [social, setSocial] = useState<SocialLinks>({
    instagram: '',
    tiktok: '',
    x: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(loadInitialCart);
  const [wishlistIds, setWishlistIds] =
    useState<string[]>(loadInitialWishlist);
  const [cartOpen, setCartOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const fetchStorefront = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/storefront');
      if (!res.ok) {
        throw new Error('Failed to load storefront data.');
      }
      const data = (await res.json()) as StorefrontPublicData;
      setProducts(data.products ?? []);
      if (data.delivery) setDelivery(data.delivery);
      if (data.social) setSocial(data.social);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to connect to store.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStorefront();
  }, [fetchStorefront]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(wishlistIds),
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [wishlistIds]);

  useEffect(() => {
    const syncFromHash = () => {
      const raw = window.location.hash.replace(/^#/, '');
      if (!raw) return;
      if (raw.startsWith('product/')) {
        const id = raw.slice('product/'.length);
        if (id) {
          setSelectedProductId(id);
          setRoute('product');
          return;
        }
      }
      const validRoutes: AppRoute[] = [
        'home',
        'shop',
        'new-arrivals',
        'wishlist',
        'checkout',
        'track-order',
        'contact',
        'admin',
      ];
      if (validRoutes.includes(raw as AppRoute)) {
        setRoute(raw as AppRoute);
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) ?? products[0];

  // Dynamic SEO page titles per view
  useEffect(() => {
    const titles: Record<AppRoute, string> = {
      home: `${BRAND_NAME} — ${BRAND_SLOGAN}`,
      shop: `Shop Official Collection — ${BRAND_NAME}`,
      'new-arrivals': `New Arrivals — ${BRAND_NAME}`,
      wishlist: `Saved Pieces — ${BRAND_NAME}`,
      product: selectedProduct
        ? `${selectedProduct.name} — ${BRAND_NAME}`
        : `Product — ${BRAND_NAME}`,
      checkout: `Checkout — ${BRAND_NAME}`,
      confirmation: `Order Confirmation — ${BRAND_NAME}`,
      'track-order': `Track Your Order — ${BRAND_NAME}`,
      contact: `Contact & Customer Care — ${BRAND_NAME}`,
      admin: `Admin Dashboard — ${BRAND_NAME}`,
    };
    document.title = titles[route];
  }, [route, selectedProduct]);

  const navigate = useCallback((nextRoute: AppRoute, productId?: string) => {
    if (nextRoute === 'product' && productId) {
      setSelectedProductId(productId);
      window.location.hash = `product/${productId}`;
    } else {
      window.location.hash = nextRoute;
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectProduct = (productId: string) => {
    navigate('product', productId);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleAddToCart = (
    product: Product,
    quantity: number,
    selectedSize: string | null,
    selectedColor: string | null,
  ) => {
    const key = `${product.id}__${selectedSize ?? 'none'}__${selectedColor ?? 'none'}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? { ...item, quantity: Math.min(50, item.quantity + quantity) }
            : item,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          quantity,
          selectedSize,
          selectedColor,
        },
      ];
    });
    setCartOpen(true);
  };

  const handleQuickAdd = (product: Product) => {
    handleAddToCart(product, 1, null, null);
  };

  const handleUpdateQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key
            ? { ...item, quantity: Math.min(50, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveItem = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const handleOrderCreated = (order: Order) => {
    setLastOrder(order);
    setCart([]);
    setRoute('confirmation');
    window.location.hash = 'confirmation';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void fetchStorefront();
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <Navbar
        currentRoute={route}
        cartCount={cartCount}
        wishlistCount={wishlistIds.length}
        onNavigate={(r) => navigate(r)}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="flex-1 bg-white">
        {route === 'home' && (
          <HomeView
            products={products}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onNavigate={(r) => navigate(r)}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {route === 'shop' && (
          <ShopView
            key="shop-all"
            products={products}
            wishlistIds={wishlistIds}
            initialFilter="all"
            loading={loading}
            error={error}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {route === 'new-arrivals' && (
          <ShopView
            key="shop-new"
            products={products}
            wishlistIds={wishlistIds}
            initialFilter="new-arrivals"
            loading={loading}
            error={error}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {route === 'wishlist' && (
          <ShopView
            key="shop-saved"
            products={products}
            wishlistIds={wishlistIds}
            initialFilter="saved"
            loading={loading}
            error={error}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {route === 'product' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            allProducts={products}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onBack={() => navigate('shop')}
            onSelectProduct={handleSelectProduct}
            onAddToCart={handleAddToCart}
          />
        )}

        {route === 'checkout' && (
          <CheckoutView
            items={cart}
            products={products}
            delivery={delivery}
            onBackToShop={() => navigate('shop')}
            onOrderCreated={handleOrderCreated}
          />
        )}

        {route === 'confirmation' && lastOrder && (
          <OrderConfirmationView
            order={lastOrder}
            onContinueShopping={() => navigate('shop')}
            onTrackOrder={() => navigate('track-order')}
          />
        )}

        {route === 'confirmation' && !lastOrder && (
          <TrackOrderView delivery={delivery} />
        )}

        {route === 'track-order' && <TrackOrderView delivery={delivery} />}

        {route === 'contact' && <ContactSupportView />}

        {route === 'admin' && (
          <AdminView onStorefrontUpdated={fetchStorefront} />
        )}
      </main>

      <Footer social={social} onNavigate={(r) => navigate(r)} />

      <CartDrawer
        open={cartOpen}
        items={cart}
        products={products}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onContinueShopping={() => navigate('shop')}
        onCheckout={() => {
          setCartOpen(false);
          navigate('checkout');
        }}
      />
    </div>
  );
}
