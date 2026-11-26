import {
  Check,
  Globe,
  Lock,
  LogOut,
  Mail,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_DETAILS,
  PAYMENT_STATUS_OPTIONS,
  formatNaira,
} from '../brand.ts';
import type {
  AdminAuthStatus,
  CustomerInquiry,
  DeliveryConfig,
  DeliveryRule,
  NewsletterSubscriber,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  SocialLinks,
} from '../types.ts';

interface AdminViewProps {
  onStorefrontUpdated: () => void;
}

type AdminTab = 'orders' | 'products' | 'settings' | 'publishing';

export function AdminView({ onStorefrontUpdated }: AdminViewProps) {
  const [token, setToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
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
  const [newsletter, setNewsletter] = useState<NewsletterSubscriber[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [orderFilter, setOrderFilter] = useState<'all' | PaymentStatus>('all');
  const [orderSearch, setOrderSearch] = useState('');

  const checkAuthStatus = useCallback(async (currentToken: string | null) => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/status', {
        headers: currentToken
          ? { Authorization: `Bearer ${currentToken}` }
          : undefined,
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (!res.ok || !contentType.includes('application/json')) {
        setAuthError(
          'Admin server endpoints are unavailable on static hosting. Deploy the Node.js server to manage backend orders and uploads.',
        );
        return;
      }
      const data = (await res.json()) as AdminAuthStatus;
      setAuthStatus(data);
      if (!data.authenticated && currentToken) {
        setToken(null);
      }
    } catch {
      setAuthError('Unable to check admin status.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuthStatus(token);
  }, [checkAuthStatus, token]);

  const loadAdminData = useCallback(async (activeToken: string) => {
    setDataLoading(true);
    setErrorMsg(null);
    try {
      const headers = { Authorization: `Bearer ${activeToken}` };
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/products', { headers }),
      ]);
      if (ordersRes.status === 401 || productsRes.status === 401) {
        setToken(null);
        return;
      }
      const ordersJson = (await ordersRes.json()) as { orders: Order[] };
      const adminJson = (await productsRes.json()) as {
        products: Product[];
        delivery: DeliveryConfig;
        social?: SocialLinks;
        newsletter?: NewsletterSubscriber[];
        inquiries?: CustomerInquiry[];
      };
      setOrders(ordersJson.orders ?? []);
      setProducts(adminJson.products ?? []);
      if (adminJson.delivery) setDelivery(adminJson.delivery);
      if (adminJson.social) setSocial(adminJson.social);
      setNewsletter(adminJson.newsletter ?? []);
      setInquiries(adminJson.inquiries ?? []);
    } catch {
      setErrorMsg('Failed to load admin records.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token && authStatus?.authenticated) {
      void loadAdminData(token);
    }
  }, [token, authStatus?.authenticated, loadAdminData]);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3200);
  };

  const handleSetup = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passwordInput.length < 8) {
      setAuthError('Choose a password with at least 8 characters.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error ?? 'Setup failed.');
        return;
      }
      setPasswordInput('');
      setConfirmPasswordInput('');
      setToken(data.token);
    } catch {
      setAuthError('Network error during setup.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!passwordInput) {
      setAuthError('Enter your admin password.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error ?? 'Login failed.');
        return;
      }
      setPasswordInput('');
      setToken(data.token);
    } catch {
      setAuthError('Network error signing in.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = () => {
    setToken(null);
    setOrders([]);
    setProducts([]);
  };

  const handleUpdateOrder = async (
    orderRef: string,
    patch: {
      paymentStatus?: PaymentStatus;
      orderStatus?: OrderStatus;
      adminNotes?: string;
    },
  ) => {
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderRef)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(patch),
        },
      );
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setErrorMsg(data.error ?? 'Could not update order.');
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o.orderRef === orderRef ? data.order! : o)),
      );
      showToast(`Updated order ${orderRef}`);
    } catch {
      setErrorMsg('Network error updating order.');
    }
  };

  const handleSaveProduct = async (product: Product) => {
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceNgn: product.priceNgn,
            category: product.category,
            description: product.description,
            sizes: product.sizes,
            colors: product.colors,
            stock: product.stock,
            active: product.active,
            isFeatured: product.isFeatured,
            isNewArrival: product.isNewArrival,
            images: product.images,
          }),
        },
      );
      const data = (await res.json()) as { product?: Product; error?: string };
      if (!res.ok || !data.product) {
        setErrorMsg(data.error ?? 'Failed to save product.');
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? data.product! : p)),
      );
      onStorefrontUpdated();
      showToast(`Saved ${product.name}`);
    } catch {
      setErrorMsg('Network error saving product.');
    }
  };

  const handleUploadProductImage = async (productId: string, file: File) => {
    if (!token) return;
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ filename: file.name, dataUrl }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          setErrorMsg(data.error ?? 'Upload failed.');
          return;
        }
        const targetProduct = products.find((p) => p.id === productId);
        if (!targetProduct) return;
        await handleSaveProduct({
          ...targetProduct,
          images: [...targetProduct.images, data.url],
        });
      } catch {
        setErrorMsg('Network error uploading image.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDelivery = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/delivery', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(delivery),
      });
      const data = (await res.json()) as {
        delivery?: DeliveryConfig;
        error?: string;
      };
      if (!res.ok || !data.delivery) {
        setErrorMsg(data.error ?? 'Failed to update delivery settings.');
        return;
      }
      setDelivery(data.delivery);
      onStorefrontUpdated();
      showToast('Delivery settings saved');
    } catch {
      setErrorMsg('Network error saving delivery settings.');
    }
  };

  const handleSaveSocial = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/social', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(social),
      });
      const data = (await res.json()) as {
        social?: SocialLinks;
        error?: string;
      };
      if (!res.ok || !data.social) {
        setErrorMsg(data.error ?? 'Failed to update social links.');
        return;
      }
      setSocial(data.social);
      onStorefrontUpdated();
      showToast('Social media links saved');
    } catch {
      setErrorMsg('Network error saving social links.');
    }
  };

  if (authLoading) {
    return (
      <section className="mx-auto max-w-md bg-white px-4 py-16 text-center">
        <div className="border border-black/15 bg-white p-8 text-sm text-muted">
          Checking admin session...
        </div>
      </section>
    );
  }

  if (!token || !authStatus?.authenticated) {
    const isSetup = Boolean(authStatus?.requiresSetup);
    return (
      <section className="mx-auto max-w-md bg-white px-4 py-16">
        <div className="border border-black/15 bg-white p-8">
          <div className="flex items-center gap-2 text-gold">
            <Lock className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">
              THARVEN Admin
            </span>
          </div>

          <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">
            {isSetup ? 'Set Admin Password' : 'Admin Sign In'}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {isSetup
              ? 'First-run setup: create a secure admin password (at least 8 characters) to protect customer orders, Moniepoint verification, and inventory.'
              : 'Enter your store admin password to verify Moniepoint transfers and manage the four official THARVEN products.'}
          </p>

          <form
            onSubmit={isSetup ? handleSetup : handleLogin}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold tracking-wider text-ink uppercase"
              >
                {isSetup ? 'New Admin Password' : 'Password'}
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoComplete={isSetup ? 'new-password' : 'current-password'}
                className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
              />
            </div>

            {isSetup && (
              <div>
                <label
                  htmlFor="admin-password-confirm"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  Confirm Password
                </label>
                <input
                  id="admin-password-confirm"
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  autoComplete="new-password"
                  className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>
            )}

            {authError && (
              <p
                role="alert"
                className="border border-red-700/30 bg-red-50 px-3 py-2 text-xs font-medium text-red-900"
              >
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="min-h-[46px] w-full bg-ink px-5 py-2.5 text-xs font-bold tracking-[0.14em] text-white uppercase hover:bg-neutral-800 disabled:opacity-50"
            >
              {authSubmitting
                ? 'Please wait...'
                : isSetup
                  ? 'Save Password & Enter Admin'
                  : 'Sign In'}
            </button>
          </form>
        </div>
      </section>
    );
  }

  const paidRevenue = orders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + o.totalNgn, 0);
  const awaitingOrders = orders.filter(
    (o) => o.paymentStatus === 'Awaiting Verification',
  );
  const awaitingAmount = awaitingOrders.reduce((sum, o) => sum + o.totalNgn, 0);

  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.paymentStatus !== orderFilter) return false;
    const q = orderSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      o.orderRef.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      o.transactionReference.toLowerCase().includes(q)
    );
  });

  return (
    <section className="mx-auto max-w-7xl bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
            Private Management
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-ink">
            THARVEN Admin Dashboard
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex min-h-[40px] items-center gap-2 border border-black/20 bg-white px-4 py-2 text-xs font-bold tracking-wider text-ink uppercase hover:border-black"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Sales Summary KPI Strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-black/10 bg-white p-5">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">
            Total Orders
          </p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-ink tabular-nums">
            {orders.length}
          </p>
          <p className="mt-1 text-xs text-muted">Recorded in backend store</p>
        </div>

        <div className="border border-black/10 bg-white p-5">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">
            Verified Revenue (Paid)
          </p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-ink tabular-nums">
            {formatNaira(paidRevenue)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Confirmed Moniepoint transfers
          </p>
        </div>

        <div className="border border-black/10 bg-white p-5">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">
            Awaiting Verification
          </p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-gold tabular-nums">
            {awaitingOrders.length} ({formatNaira(awaitingAmount)})
          </p>
          <p className="mt-1 text-xs text-muted">
            Pending manual Moniepoint check
          </p>
        </div>

        <div className="border border-black/10 bg-white p-5">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">
            Subscribers &amp; Inquiries
          </p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-ink tabular-nums">
            {newsletter.length} / {inquiries.length}
          </p>
          <p className="mt-1 text-xs text-muted">
            Newsletter list / Support messages
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-black/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`inline-flex min-h-[40px] items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase ${
            activeTab === 'orders'
              ? 'bg-ink text-white'
              : 'border border-black/15 bg-white text-ink hover:border-black'
          }`}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span className="tabular-nums">Orders ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`inline-flex min-h-[40px] items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase ${
            activeTab === 'products'
              ? 'bg-ink text-white'
              : 'border border-black/15 bg-white text-ink hover:border-black'
          }`}
        >
          <Package className="h-4 w-4" aria-hidden="true" />
          <span>4 Official Products</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`inline-flex min-h-[40px] items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase ${
            activeTab === 'settings'
              ? 'bg-ink text-white'
              : 'border border-black/15 bg-white text-ink hover:border-black'
          }`}
        >
          <Truck className="h-4 w-4" aria-hidden="true" />
          <span>Delivery, Social &amp; Leads</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('publishing')}
          className={`inline-flex min-h-[40px] items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider uppercase ${
            activeTab === 'publishing'
              ? 'bg-ink text-white'
              : 'border border-black/15 bg-white text-ink hover:border-black'
          }`}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span>Publishing Guide</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="mt-4 flex items-center gap-2 border border-gold bg-white px-4 py-3 text-xs font-bold text-ink">
          <Check className="h-4 w-4 text-gold" aria-hidden="true" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mt-4 border border-red-700/30 bg-red-50 px-4 py-3 text-xs font-medium text-red-900"
        >
          {errorMsg}
        </div>
      )}

      {dataLoading ? (
        <div className="py-12 text-center text-sm text-muted">
          Loading admin records...
        </div>
      ) : activeTab === 'orders' ? (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(['all', ...PAYMENT_STATUS_OPTIONS] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setOrderFilter(status)}
                  className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold ${
                    orderFilter === status
                      ? 'bg-ink text-white'
                      : 'border border-black/15 bg-white text-ink hover:border-black'
                  }`}
                >
                  {status === 'all' ? 'All Orders' : status}
                </button>
              ))}
            </div>

            <input
              type="search"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search ref, customer, phone, or Moniepoint ID..."
              className="min-h-[40px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black sm:w-80"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="border border-black/10 bg-surface/50 p-10 text-center text-sm text-muted">
              No orders match the current filter.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <AdminOrderCard
                  key={order.orderRef}
                  order={order}
                  onUpdate={handleUpdateOrder}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'products' ? (
        <div className="mt-6 space-y-4">
          <p className="text-xs text-muted">
            THARVEN catalogue is locked to the four official products. Update
            prices, photos, sizes, colors, stock, and visibility below.
          </p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {products.map((product) => (
              <AdminProductEditor
                key={product.id}
                product={product}
                onSave={handleSaveProduct}
                onUploadImage={(file) =>
                  handleUploadProductImage(product.id, file)
                }
              />
            ))}
          </div>
        </div>
      ) : activeTab === 'settings' ? (
        <div className="mt-6 space-y-8">
          {/* Delivery Rules */}
          <form
            onSubmit={handleSaveDelivery}
            className="space-y-6 border border-black/10 bg-white p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  Delivery Zones &amp; Fees
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Enable configured delivery zones to let customers pick a zone
                  and fee during checkout.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={delivery.configured}
                  onChange={(e) =>
                    setDelivery((prev) => ({
                      ...prev,
                      configured: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-black"
                />
                <span>Configured</span>
              </label>
            </div>

            <div>
              <label
                htmlFor="delivery-notes"
                className="block text-xs font-bold tracking-wider text-ink uppercase"
              >
                General Delivery Policy / Notes
              </label>
              <textarea
                id="delivery-notes"
                rows={2}
                value={delivery.generalNotes}
                onChange={(e) =>
                  setDelivery((prev) => ({
                    ...prev,
                    generalNotes: e.target.value,
                  }))
                }
                placeholder="Optional dispatch schedule or delivery timeline"
                className="mt-1.5 w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-wider text-ink uppercase">
                  Delivery Zones (₦)
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setDelivery((prev) => ({
                      ...prev,
                      rules: [
                        ...prev.rules,
                        {
                          id: `zone_${Date.now()}`,
                          zone: '',
                          feeNgn: 0,
                          notes: '',
                        },
                      ],
                    }))
                  }
                  className="inline-flex min-h-[36px] items-center gap-1.5 border border-black/20 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-black"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add Zone</span>
                </button>
              </div>

              {delivery.rules.length === 0 ? (
                <p className="mt-3 text-xs text-muted">
                  No delivery zones added yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {delivery.rules.map((rule, idx) => (
                    <div
                      key={rule.id}
                      className="grid grid-cols-1 gap-3 border border-black/10 bg-surface/50 p-4 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-muted uppercase">
                          Zone / State
                        </label>
                        <input
                          type="text"
                          value={rule.zone}
                          onChange={(e) =>
                            updateDeliveryRule(setDelivery, idx, {
                              zone: e.target.value,
                            })
                          }
                          placeholder="e.g. Lagos"
                          className="mt-1 min-h-[38px] w-full border border-black/20 bg-white px-3 py-1.5 text-sm text-ink"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-muted uppercase">
                          Fee (₦)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={rule.feeNgn}
                          onChange={(e) =>
                            updateDeliveryRule(setDelivery, idx, {
                              feeNgn: Number(e.target.value) || 0,
                            })
                          }
                          className="mt-1 min-h-[38px] w-full border border-black/20 bg-white px-3 py-1.5 font-mono text-sm text-ink"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-muted uppercase">
                          Timeline Note
                        </label>
                        <input
                          type="text"
                          value={rule.notes}
                          onChange={(e) =>
                            updateDeliveryRule(setDelivery, idx, {
                              notes: e.target.value,
                            })
                          }
                          placeholder="e.g. 1–2 business days"
                          className="mt-1 min-h-[38px] w-full border border-black/20 bg-white px-3 py-1.5 text-sm text-ink"
                        />
                      </div>
                      <div className="flex items-end sm:col-span-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDelivery((prev) => ({
                              ...prev,
                              rules: prev.rules.filter((_, i) => i !== idx),
                            }))
                          }
                          aria-label="Remove delivery zone"
                          className="inline-flex h-[38px] w-full items-center justify-center border border-black/20 bg-white text-muted hover:text-ink"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="min-h-[44px] bg-ink px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase hover:bg-neutral-800"
            >
              Save Delivery Settings
            </button>
          </form>

          {/* Official Social Links */}
          <form
            onSubmit={handleSaveSocial}
            className="space-y-4 border border-black/10 bg-white p-6 sm:p-8"
          >
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                Official Social Media Accounts
              </h2>
              <p className="mt-1 text-xs text-muted">
                Leave blank until ready. Links only appear in the storefront
                footer when an official URL is saved here.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold tracking-wider text-ink uppercase">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={social.instagram}
                  onChange={(e) =>
                    setSocial((prev) => ({
                      ...prev,
                      instagram: e.target.value,
                    }))
                  }
                  placeholder="https://instagram.com/..."
                  className="mt-1.5 min-h-[40px] w-full border border-black/20 bg-white px-3 py-1.5 text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-wider text-ink uppercase">
                  TikTok URL
                </label>
                <input
                  type="url"
                  value={social.tiktok}
                  onChange={(e) =>
                    setSocial((prev) => ({ ...prev, tiktok: e.target.value }))
                  }
                  placeholder="https://tiktok.com/@..."
                  className="mt-1.5 min-h-[40px] w-full border border-black/20 bg-white px-3 py-1.5 text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-wider text-ink uppercase">
                  X (Twitter) URL
                </label>
                <input
                  type="url"
                  value={social.x}
                  onChange={(e) =>
                    setSocial((prev) => ({ ...prev, x: e.target.value }))
                  }
                  placeholder="https://x.com/..."
                  className="mt-1.5 min-h-[40px] w-full border border-black/20 bg-white px-3 py-1.5 text-sm text-ink"
                />
              </div>
            </div>

            <button
              type="submit"
              className="min-h-[44px] bg-ink px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase hover:bg-neutral-800"
            >
              Save Social Links
            </button>
          </form>

          {/* Newsletter & Inquiries */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border border-black/10 bg-white p-6">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-ink">
                  Newsletter Subscribers ({newsletter.length})
                </h2>
              </div>
              {newsletter.length === 0 ? (
                <p className="mt-3 text-xs text-muted">
                  No subscribers yet.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-black/10 text-sm">
                  {newsletter.map((sub) => (
                    <li
                      key={sub.email}
                      className="flex items-center justify-between py-2.5"
                    >
                      <span className="font-medium text-ink">{sub.email}</span>
                      <span className="text-xs text-muted">
                        {new Date(sub.consentedAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-black/10 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-ink">
                Customer Support Messages ({inquiries.length})
              </h2>
              {inquiries.length === 0 ? (
                <p className="mt-3 text-xs text-muted">
                  No customer messages yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {inquiries.map((inq) => (
                    <li
                      key={inq.id}
                      className="border border-black/10 bg-surface/40 p-3.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink">{inq.name}</span>
                        <span className="text-muted">
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-0.5 text-muted">
                        {inq.email}
                        {inq.phone ? ` · ${inq.phone}` : ''}
                      </p>
                      <p className="mt-2 text-sm text-ink">{inq.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Publishing Guide Tab */
        <div className="mt-6 space-y-6 border border-black/10 bg-white p-6 sm:p-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
              Production Deployment Checklist
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-ink">
              Publishing THARVEN Publicly
            </h2>
            <p className="mt-2 text-sm text-muted">
              THARVEN uses a full-stack React + Express Node.js backend so
              orders, stock, uploaded photos, and admin authentication are
              validated securely on the server.
            </p>
          </div>

          <ol className="space-y-4 border-t border-black/10 pt-5 text-sm leading-relaxed">
            <li>
              <strong className="text-ink">
                1. Download Source Code:
              </strong>{' '}
              Export or clone the project folder containing{' '}
              <code className="font-mono text-xs">package.json</code>,{' '}
              <code className="font-mono text-xs">server.ts</code>,{' '}
              <code className="font-mono text-xs">server/</code>,{' '}
              <code className="font-mono text-xs">src/</code>, and{' '}
              <code className="font-mono text-xs">public/</code>.
            </li>
            <li>
              <strong className="text-ink">
                2. Configure Backend &amp; Persistent Storage:
              </strong>{' '}
              Deploy on a Node.js web service (e.g., Render, Railway, Fly.io, or
              a VPS) with a persistent disk mounted at{' '}
              <code className="font-mono text-xs">./data</code> so{' '}
              <code className="font-mono text-xs">data/store.json</code> and
              uploaded images in{' '}
              <code className="font-mono text-xs">data/uploads/</code> persist
              across restarts. (If hosting frontend on Netlify, deploy the
              Express API on Render/Railway and proxy{' '}
              <code className="font-mono text-xs">/api/*</code> via{' '}
              <code className="font-mono text-xs">netlify.toml</code>.)
            </li>
            <li>
              <strong className="text-ink">
                3. Set Secure Environment Variables:
              </strong>{' '}
              In your hosting dashboard, set{' '}
              <code className="font-mono text-xs">NODE_ENV=production</code>,{' '}
              <code className="font-mono text-xs">ADMIN_PASSWORD</code> (strong
              admin passphrase), and{' '}
              <code className="font-mono text-xs">SESSION_SECRET</code> (random
              32+ character string). Never commit secrets to Git.
            </li>
            <li>
              <strong className="text-ink">
                4. Build &amp; Start Commands:
              </strong>{' '}
              Run <code className="font-mono text-xs">npm install && npm run build</code>{' '}
              for the build step and{' '}
              <code className="font-mono text-xs">npm start</code> to launch the
              server on port 3000.
            </li>
            <li>
              <strong className="text-ink">
                5. Connect Custom Domain:
              </strong>{' '}
              Add your custom domain (e.g.{' '}
              <code className="font-mono text-xs">tharven.com</code>) in your
              hosting provider&apos;s Custom Domains settings and point your DNS{' '}
              <code className="font-mono text-xs">A</code> /{' '}
              <code className="font-mono text-xs">CNAME</code> records with
              automatic HTTPS/SSL enabled.
            </li>
            <li>
              <strong className="text-ink">
                6. Test End-to-End Orders &amp; Moniepoint Verification:
              </strong>{' '}
              Place a test order in Shop, confirm Moniepoint account{' '}
              <span className="font-mono font-bold">
                {PAYMENT_DETAILS.accountNumber} ({PAYMENT_DETAILS.accountName})
              </span>{' '}
              displays with Copy Account Number, submit a test reference, verify
              it lands as <strong>Awaiting Verification</strong> in Admin Orders,
              and confirm updating it to <strong>Paid</strong> updates Track
              Order.
            </li>
          </ol>
        </div>
      )}
    </section>
  );
}

function updateDeliveryRule(
  setDelivery: React.Dispatch<React.SetStateAction<DeliveryConfig>>,
  idx: number,
  patch: Partial<DeliveryRule>,
) {
  setDelivery((prev) => ({
    ...prev,
    rules: prev.rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
  }));
}

function AdminOrderCard({
  order,
  onUpdate,
}: {
  order: Order;
  onUpdate: (
    orderRef: string,
    patch: {
      paymentStatus?: PaymentStatus;
      orderStatus?: OrderStatus;
      adminNotes?: string;
    },
  ) => Promise<void>;
}) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    order.paymentStatus,
  );
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(
    order.orderStatus,
  );
  const [adminNotes, setAdminNotes] = useState(order.adminNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPaymentStatus(order.paymentStatus);
    setOrderStatus(order.orderStatus);
    setAdminNotes(order.adminNotes);
  }, [order]);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(order.orderRef, {
      paymentStatus,
      orderStatus,
      adminNotes,
    });
    setSaving(false);
  };

  const handleQuickVerify = async () => {
    setSaving(true);
    await onUpdate(order.orderRef, {
      paymentStatus: 'Paid',
      orderStatus: order.orderStatus === 'New Order' ? 'Processing' : order.orderStatus,
      adminNotes,
    });
    setSaving(false);
  };

  return (
    <article className="border border-black/12 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-mono font-bold text-ink">
              {order.orderRef}
            </span>
            <span aria-hidden="true">·</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
            <span aria-hidden="true">·</span>
            <span className="font-bold text-gold">{order.paymentStatus}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-ink">{order.orderStatus}</span>
          </div>
          <h3 className="mt-1 font-display text-lg font-extrabold text-ink">
            {order.customerName}
          </h3>
          <p className="text-xs text-muted">
            {order.customerPhone} · {order.customerEmail}
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono text-xl font-extrabold text-ink tabular-nums">
            {formatNaira(order.totalNgn)}
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted">
            Moniepoint Ref:{' '}
            <strong className="text-ink">{order.transactionReference}</strong>
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
              Purchased Items
            </p>
            <ul className="mt-1.5 space-y-1 text-sm">
              {order.items.map((item, idx) => (
                <li
                  key={`${item.productId}-${idx}`}
                  className="flex justify-between"
                >
                  <span>
                    {item.productName} × {item.quantity}
                    {(item.selectedSize || item.selectedColor) && (
                      <span className="ml-2 text-xs text-muted">
                        ({[item.selectedSize, item.selectedColor]
                          .filter(Boolean)
                          .join(', ')})
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-semibold tabular-nums">
                    {formatNaira(item.lineTotalNgn)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-black/10 pt-3 text-xs">
            <p className="font-bold tracking-wider text-muted uppercase">
              Delivery Information
            </p>
            <p className="mt-1 text-sm text-ink">
              {order.deliveryAddress}, {order.deliveryCity},{' '}
              {order.deliveryState}
            </p>
            {order.deliveryInstructions && (
              <p className="mt-1 text-muted">
                Instructions: {order.deliveryInstructions}
              </p>
            )}
            <p className="mt-1 text-muted">
              Delivery Fee:{' '}
              {order.deliveryZone
                ? `${order.deliveryZone} (${formatNaira(order.deliveryFeeNgn ?? 0)})`
                : 'Not configured'}
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-black/10 pt-4 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-muted uppercase">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="mt-1 min-h-[38px] w-full border border-black/20 bg-white px-3 py-1.5 text-sm text-ink"
            >
              {PAYMENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold tracking-wider text-muted uppercase">
              Order Status
            </label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
              className="mt-1 min-h-[38px] w-full border border-black/20 bg-white px-3 py-1.5 text-sm text-ink"
            >
              {ORDER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold tracking-wider text-muted uppercase">
              Admin Notes
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Optional verification or dispatch note"
              className="mt-1 min-h-[38px] w-full border border-black/20 bg-white px-3 py-1.5 text-sm text-ink"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {order.paymentStatus !== 'Paid' && (
              <button
                type="button"
                disabled={saving}
                onClick={handleQuickVerify}
                className="min-h-[40px] flex-1 border border-gold bg-white px-3 py-2 text-xs font-bold text-ink hover:bg-surface disabled:opacity-50"
              >
                Verify as Paid
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="min-h-[40px] flex-1 bg-ink px-4 py-2 text-xs font-bold text-white uppercase hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Update'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function AdminProductEditor({
  product,
  onSave,
  onUploadImage,
}: {
  product: Product;
  onSave: (product: Product) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
}) {
  const [priceNgn, setPriceNgn] = useState(product.priceNgn);
  const [description, setDescription] = useState(product.description);
  const [sizesInput, setSizesInput] = useState(product.sizes.join(', '));
  const [colorsInput, setColorsInput] = useState(product.colors.join(', '));
  const [trackStock, setTrackStock] = useState(product.stock !== null);
  const [stockCount, setStockCount] = useState(product.stock ?? 0);
  const [active, setActive] = useState(product.active);
  const [isNewArrival, setIsNewArrival] = useState(product.isNewArrival);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPriceNgn(product.priceNgn);
    setDescription(product.description);
    setSizesInput(product.sizes.join(', '));
    setColorsInput(product.colors.join(', '));
    setTrackStock(product.stock !== null);
    setStockCount(product.stock ?? 0);
    setActive(product.active);
    setIsNewArrival(product.isNewArrival);
  }, [product]);

  const parseList = (raw: string): string[] =>
    Array.from(
      new Set(
        raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      ...product,
      priceNgn: Math.max(100, Math.round(priceNgn)),
      description,
      sizes: parseList(sizesInput),
      colors: parseList(colorsInput),
      stock: trackStock ? Math.max(0, Math.floor(stockCount)) : null,
      active,
      isNewArrival,
    });
    setSaving(false);
  };

  return (
    <article className="border border-black/12 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <p className="text-xs text-muted">{product.category}</p>
          <h3 className="font-display text-lg font-extrabold text-ink">
            {product.name}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-ink">
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={isNewArrival}
              onChange={(e) => setIsNewArrival(e.target.checked)}
              className="h-4 w-4 accent-black"
            />
            <span>New Arrival</span>
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-black"
            />
            <span>Visible</span>
          </label>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold tracking-wider text-ink uppercase">
              Price (₦ Naira)
            </label>
            <input
              type="number"
              min={100}
              value={priceNgn}
              onChange={(e) => setPriceNgn(Number(e.target.value) || 0)}
              className="mt-1 min-h-[40px] w-full border border-black/20 bg-white px-3 py-1.5 font-mono text-sm font-bold text-ink"
            />
          </div>

          <div className="flex flex-col justify-end">
            <div className="flex flex-wrap items-center gap-3 border border-black/10 bg-surface/50 px-3 py-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={trackStock}
                  onChange={(e) => setTrackStock(e.target.checked)}
                  className="h-4 w-4 accent-black"
                />
                <span>Track Stock</span>
              </label>
              {trackStock && (
                <input
                  type="number"
                  min={0}
                  value={stockCount}
                  onChange={(e) => setStockCount(Number(e.target.value) || 0)}
                  className="min-h-[34px] w-24 border border-black/20 bg-white px-2.5 py-1 font-mono text-sm text-ink"
                />
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-ink uppercase">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm text-ink"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold tracking-wider text-ink uppercase">
              Sizes (comma-separated)
            </label>
            <input
              type="text"
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              placeholder="e.g. M, L, XL"
              className="mt-1 min-h-[40px] w-full border border-black/20 bg-white px-3 py-1.5 text-sm text-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-ink uppercase">
              Colors (comma-separated)
            </label>
            <input
              type="text"
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              placeholder="e.g. Black, White"
              className="mt-1 min-h-[40px] w-full border border-black/20 bg-white px-3 py-1.5 text-sm text-ink"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-ink uppercase">
              Product Photographs ({product.images.length})
            </span>
            <label className="inline-flex cursor-pointer items-center gap-1.5 border border-black/20 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-black">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  await onUploadImage(file);
                  setUploading(false);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {product.images.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {product.images.map((img, idx) => (
                <div
                  key={img}
                  className="relative h-16 w-16 overflow-hidden border border-black/15"
                >
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onSave({
                        ...product,
                        images: product.images.filter((url) => url !== img),
                      })
                    }
                    aria-label="Remove product image"
                    className="absolute top-0.5 right-0.5 bg-ink/85 p-1 text-white hover:bg-black"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="min-h-[42px] w-full bg-ink px-5 py-2 text-xs font-bold tracking-wider text-white uppercase hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : `Save ${product.name}`}
        </button>
      </div>
    </article>
  );
}
