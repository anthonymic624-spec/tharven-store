import { useCallback, useEffect, useState } from 'react';
import { AdminView } from './components/AdminView.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutView } from './components/CheckoutView.tsx';
import {
  DeliveryView,
  SupportView,
} from './components/DeliverySupportViews.tsx';
import { Footer } from './components/Footer.tsx';
import { HomeView } from './components/HomeView.tsx';
import { Navbar, type AppRoute } from './components/Navbar.tsx';
import { OrderConfirmationView } from './components/OrderConfirmationView.tsx';
import { ProductDetailView } from './components/ProductDetailView.tsx';
import { ShopView } from './components/ShopView.tsx';
import type {
  CartItem,
  DeliveryConfig,
  Order,
  Product,
  StorefrontPublicData,
} from './types.ts';

const CART_STORAGE_KEY = 'tharven_cart_v1';

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

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [selectedProductId, setSelectedProductId] = useState<string>('shirt');
  const [products, setProducts] = useState<Product[]>([]);
  const [delivery, setDelivery] = useState<DeliveryConfig>({
    configured: false,
    generalNotes: '',
    rules: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(loadInitialCart);
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
      if (data.delivery) {
        setDelivery(data.delivery);
      }
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
        'checkout',
        'delivery',
        'support',
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
  const selectedProduct =
    products.find((p) => p.id === selectedProductId) ?? products[0];

  return (
    <div className="flex min-h-screen flex-col bg-beige text-ink">
      <Navbar
        currentRoute={route}
        cartCount={cartCount}
        onNavigate={(r) => navigate(r)}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="flex-1">
        {route === 'home' && (
          <HomeView
            products={products}
            onNavigate={(r) => navigate(r)}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {route === 'shop' && (
          <ShopView
            products={products}
            loading={loading}
            error={error}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {route === 'product' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onBack={() => navigate('shop')}
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
          />
        )}

        {route === 'confirmation' && !lastOrder && (
          <SupportView />
        )}

        {route === 'delivery' && <DeliveryView delivery={delivery} />}

        {route === 'support' && <SupportView />}

        {route === 'admin' && (
          <AdminView onStorefrontUpdated={fetchStorefront} />
        )}
      </main>

      <Footer onNavigate={(r) => navigate(r)} />

      <CartDrawer
        open={cartOpen}
        items={cart}
        products={products}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          setCartOpen(false);
          navigate('checkout');
        }}
      />
    </div>
  );
}
