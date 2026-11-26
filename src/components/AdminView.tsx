import {
  Check,
  Lock,
  LogOut,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { formatNaira } from '../brand.ts';
import type {
  AdminAuthStatus,
  DeliveryConfig,
  DeliveryRule,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
} from '../types.ts';

interface AdminViewProps {
  onStorefrontUpdated: () => void;
}

type AdminTab = 'orders' | 'products' | 'delivery';

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  rejected: 'Rejected',
};

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
      const productsJson = (await productsRes.json()) as {
        products: Product[];
        delivery: DeliveryConfig;
      };
      setOrders(ordersJson.orders ?? []);
      setProducts(productsJson.products ?? []);
      if (productsJson.delivery) {
        setDelivery(productsJson.delivery);
      }
    } catch {
      setErrorMsg('Failed to load admin data.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token && authStatus?.authenticated) {
      void loadAdminData(token);
    }
  }, [token, authStatus?.authenticated, loadAdminData]);

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

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
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
            description: product.description,
            sizes: product.sizes,
            colors: product.colors,
            stock: product.stock,
            active: product.active,
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
        const updatedProduct: Product = {
          ...targetProduct,
          images: [...targetProduct.images, data.url],
        };
        await handleSaveProduct(updatedProduct);
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
        setErrorMsg(data.error ?? 'Failed to update delivery rules.');
        return;
      }
      setDelivery(data.delivery);
      onStorefrontUpdated();
      showToast('Delivery settings saved');
    } catch {
      setErrorMsg('Network error saving delivery settings.');
    }
  };

  if (authLoading) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="border border-ink/15 bg-cream p-8 text-sm text-muted">
          Checking admin session...
        </div>
      </section>
    );
  }

  if (!token || !authStatus?.authenticated) {
    const isSetup = Boolean(authStatus?.requiresSetup);
    return (
      <section className="mx-auto max-w-md px-4 py-16">
        <div className="border border-ink/15 bg-cream p-8">
          <div className="flex items-center gap-2.5 text-gold-deep">
            <Lock className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase">
              THARVEN Admin
            </span>
          </div>

          <h1 className="mt-2 font-display text-2xl font-bold text-ink">
            {isSetup ? 'Set Admin Password' : 'Admin Sign In'}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {isSetup
              ? 'First-run setup: create a secure password (at least 8 characters) to protect orders, stock, and delivery settings.'
              : 'Enter your store admin password to verify Moniepoint transfers and manage inventory.'}
          </p>

          <form
            onSubmit={isSetup ? handleSetup : handleLogin}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-ink uppercase"
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
                className="mt-1.5 min-h-[44px] w-full border border-ink/20 bg-beige px-3.5 py-2 text-sm text-ink"
              />
            </div>

            {isSetup && (
              <div>
                <label
                  htmlFor="admin-password-confirm"
                  className="block text-xs font-semibold text-ink uppercase"
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
                  className="mt-1.5 min-h-[44px] w-full border border-ink/20 bg-beige px-3.5 py-2 text-sm text-ink"
                />
              </div>
            )}

            {authError && (
              <p
                role="alert"
                className="border border-red-800/30 bg-red-50 px-3 py-2 text-xs font-medium text-red-900"
              >
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="min-h-[44px] w-full bg-obsidian px-5 py-2.5 text-sm font-bold text-gold transition-colors hover:bg-charcoal disabled:opacity-60"
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

  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.paymentStatus !== orderFilter) return false;
    const q = orderSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      o.orderRef.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.transactionReference.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q)
    );
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-deep uppercase">
            Private Management
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">
            THARVEN Admin
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex min-h-[40px] items-center gap-2 border border-ink/20 bg-cream px-4 py-2 text-xs font-semibold text-ink hover:bg-sand"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-ink/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`inline-flex min-h-[40px] items-center gap-2 px-4 py-2 text-xs font-semibold ${
            activeTab === 'orders'
              ? 'bg-obsidian text-gold'
              : 'border border-ink/15 bg-cream text-ink hover:bg-sand'
          }`}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span className="tabular-nums">Orders ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`inline-flex min-h-[40px] items-center gap-2 px-4 py-2 text-xs font-semibold ${
            activeTab === 'products'
              ? 'bg-obsidian text-gold'
              : 'border border-ink/15 bg-cream text-ink hover:bg-sand'
          }`}
        >
          <Package className="h-4 w-4" aria-hidden="true" />
          <span>Products &amp; Stock</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('delivery')}
          className={`inline-flex min-h-[40px] items-center gap-2 px-4 py-2 text-xs font-semibold ${
            activeTab === 'delivery'
              ? 'bg-obsidian text-gold'
              : 'border border-ink/15 bg-cream text-ink hover:bg-sand'
          }`}
        >
          <Truck className="h-4 w-4" aria-hidden="true" />
          <span>Delivery Rules</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="mt-4 flex items-center gap-2 border border-gold/40 bg-obsidian px-4 py-3 text-xs font-semibold text-gold">
          <Check className="h-4 w-4" aria-hidden="true" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mt-4 border border-red-800/30 bg-red-50 px-4 py-3 text-xs font-medium text-red-900"
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
              {(
                [
                  ['all', 'All'],
                  ['pending_verification', 'Pending Verification'],
                  ['verified', 'Verified'],
                  ['rejected', 'Rejected'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrderFilter(value)}
                  className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold ${
                    orderFilter === value
                      ? 'bg-obsidian text-gold'
                      : 'border border-ink/15 bg-cream text-ink hover:bg-sand'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              type="search"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search order ref, customer, or transfer ID..."
              className="min-h-[40px] w-full border border-ink/20 bg-cream px-3.5 py-2 text-sm text-ink sm:w-80"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="border border-ink/12 bg-cream p-10 text-center text-sm text-muted">
              No orders match the current view.
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
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
      ) : (
        <form
          onSubmit={handleSaveDelivery}
          className="mt-6 space-y-6 border border-ink/12 bg-cream p-6 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                Delivery Configuration
              </h2>
              <p className="mt-1 text-xs text-muted">
                Enable this only when your delivery zones, fees, and rules are
                ready to display to customers.
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
                className="h-4 w-4 accent-obsidian"
              />
              <span>Configured</span>
            </label>
          </div>

          <div>
            <label
              htmlFor="delivery-notes"
              className="block text-xs font-semibold text-ink uppercase"
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
              placeholder="Optional dispatch schedule or rider instructions"
              className="mt-1.5 w-full border border-ink/20 bg-beige px-3.5 py-2 text-sm text-ink"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-ink uppercase">
                Delivery Zones &amp; Fees (₦)
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
                className="inline-flex min-h-[36px] items-center gap-1.5 border border-ink/20 bg-beige px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add Zone</span>
              </button>
            </div>

            {delivery.rules.length === 0 ? (
              <p className="mt-3 text-xs text-muted">
                No delivery zones configured yet.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {delivery.rules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="grid grid-cols-1 gap-3 border border-ink/15 bg-beige p-4 sm:grid-cols-12"
                  >
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-muted uppercase">
                        Zone / Location
                      </label>
                      <input
                        type="text"
                        value={rule.zone}
                        onChange={(e) =>
                          updateDeliveryRule(setDelivery, idx, {
                            zone: e.target.value,
                          })
                        }
                        placeholder="e.g. Lagos Mainland"
                        className="mt-1 min-h-[38px] w-full border border-ink/20 bg-cream px-3 py-1.5 text-sm text-ink"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-muted uppercase">
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
                        className="mt-1 min-h-[38px] w-full border border-ink/20 bg-cream px-3 py-1.5 font-mono text-sm text-ink"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-muted uppercase">
                        Rule / Timeline Note
                      </label>
                      <input
                        type="text"
                        value={rule.notes}
                        onChange={(e) =>
                          updateDeliveryRule(setDelivery, idx, {
                            notes: e.target.value,
                          })
                        }
                        placeholder="e.g. Next-day dispatch"
                        className="mt-1 min-h-[38px] w-full border border-ink/20 bg-cream px-3 py-1.5 text-sm text-ink"
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
                        className="inline-flex h-[38px] w-full items-center justify-center border border-ink/20 bg-cream text-muted hover:text-ink"
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
            className="min-h-[44px] bg-obsidian px-6 py-2.5 text-sm font-bold text-gold hover:bg-charcoal"
          >
            Save Delivery Settings
          </button>
        </form>
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

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(order.orderRef, {
      paymentStatus,
      orderStatus,
      adminNotes,
    });
    setSaving(false);
  };

  return (
    <article className="border border-ink/12 bg-cream p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-mono font-bold text-ink">
              {order.orderRef}
            </span>
            <span aria-hidden="true">·</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-gold-deep">
              {PAYMENT_LABELS[order.paymentStatus]}
            </span>
          </div>
          <h3 className="mt-1 font-display text-lg font-bold text-ink">
            {order.customerName}
          </h3>
          <p className="text-xs text-muted">
            {order.customerPhone} · {order.customerEmail}
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono text-xl font-bold text-ink tabular-nums">
            {formatNaira(order.totalNgn)}
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted">
            Moniepoint Ref: <strong className="text-ink">{order.transactionReference}</strong>
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          <div>
            <p className="text-[11px] font-semibold text-muted uppercase">
              Items
            </p>
            <ul className="mt-1.5 space-y-1 text-sm">
              {order.items.map((item, idx) => (
                <li key={`${item.productId}-${idx}`} className="flex justify-between">
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
                  <span className="font-mono tabular-nums">
                    {formatNaira(item.lineTotalNgn)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-ink/10 pt-3 text-xs">
            <p className="font-semibold text-muted uppercase">
              Delivery Information
            </p>
            <p className="mt-1 text-sm text-ink">{order.deliveryAddress}</p>
            {order.deliveryInstructions && (
              <p className="mt-1 text-muted">
                Instructions: {order.deliveryInstructions}
              </p>
            )}
            <p className="mt-1 text-muted">
              Delivery:{' '}
              {order.deliveryZone
                ? `${order.deliveryZone} (${formatNaira(order.deliveryFeeNgn ?? 0)})`
                : 'Not configured'}
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-ink/10 pt-4 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase">
              Payment Verification
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="mt-1 min-h-[38px] w-full border border-ink/20 bg-beige px-3 py-1.5 text-sm text-ink"
            >
              <option value="pending_verification">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase">
              Order Fulfillment Status
            </label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
              className="mt-1 min-h-[38px] w-full border border-ink/20 bg-beige px-3 py-1.5 text-sm text-ink"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase">
              Internal Admin Notes
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Optional verification or dispatch note"
              className="mt-1 min-h-[38px] w-full border border-ink/20 bg-beige px-3 py-1.5 text-sm text-ink"
            />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="min-h-[40px] w-full bg-obsidian px-4 py-2 text-xs font-bold text-gold hover:bg-charcoal disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Order Update'}
          </button>
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
  const [description, setDescription] = useState(product.description);
  const [sizesInput, setSizesInput] = useState(product.sizes.join(', '));
  const [colorsInput, setColorsInput] = useState(product.colors.join(', '));
  const [trackStock, setTrackStock] = useState(product.stock !== null);
  const [stockCount, setStockCount] = useState(product.stock ?? 0);
  const [active, setActive] = useState(product.active);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setDescription(product.description);
    setSizesInput(product.sizes.join(', '));
    setColorsInput(product.colors.join(', '));
    setTrackStock(product.stock !== null);
    setStockCount(product.stock ?? 0);
    setActive(product.active);
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
      description,
      sizes: parseList(sizesInput),
      colors: parseList(colorsInput),
      stock: trackStock ? Math.max(0, Math.floor(stockCount)) : null,
      active,
    });
    setSaving(false);
  };

  return (
    <article className="border border-ink/12 bg-cream p-6">
      <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-4">
        <div>
          <p className="text-xs text-muted">{product.category}</p>
          <h3 className="font-display text-xl font-bold text-ink">
            {product.name}{' '}
            <span className="ml-2 font-mono text-base font-semibold text-gold-deep tabular-nums">
              {formatNaira(product.priceNgn)}
            </span>
          </h3>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-obsidian"
          />
          <span>Visible in Shop</span>
        </label>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink uppercase">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full border border-ink/20 bg-beige px-3 py-2 text-sm text-ink"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase">
              Sizes (comma-separated)
            </label>
            <input
              type="text"
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              placeholder="e.g. M, L, XL (leave blank if none)"
              className="mt-1 min-h-[40px] w-full border border-ink/20 bg-beige px-3 py-1.5 text-sm text-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink uppercase">
              Colors (comma-separated)
            </label>
            <input
              type="text"
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              placeholder="e.g. Black, White (leave blank if none)"
              className="mt-1 min-h-[40px] w-full border border-ink/20 bg-beige px-3 py-1.5 text-sm text-ink"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border border-ink/10 bg-beige p-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
            <input
              type="checkbox"
              checked={trackStock}
              onChange={(e) => setTrackStock(e.target.checked)}
              className="h-4 w-4 accent-obsidian"
            />
            <span>Enforce stock count</span>
          </label>
          {trackStock && (
            <input
              type="number"
              min={0}
              value={stockCount}
              onChange={(e) => setStockCount(Number(e.target.value) || 0)}
              className="min-h-[36px] w-28 border border-ink/20 bg-cream px-3 py-1 font-mono text-sm text-ink"
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink uppercase">
              Product Photos ({product.images.length})
            </span>
            <label className="inline-flex cursor-pointer items-center gap-1.5 border border-ink/20 bg-beige px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand">
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
                  className="relative h-16 w-16 overflow-hidden border border-ink/20"
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
                    className="absolute top-0.5 right-0.5 bg-obsidian/85 p-1 text-cream hover:text-gold"
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
          className="min-h-[42px] w-full bg-obsidian px-5 py-2 text-xs font-bold text-gold hover:bg-charcoal disabled:opacity-60"
        >
          {saving ? 'Saving...' : `Save ${product.name}`}
        </button>
      </div>
    </article>
  );
}
