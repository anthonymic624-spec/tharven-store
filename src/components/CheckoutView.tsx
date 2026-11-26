import {
  ArrowLeft,
  Check,
  Copy,
  Lock,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import {
  PAYMENT_DETAILS,
  buildWhatsAppOrderUrl,
  formatNaira,
} from '../brand.ts';
import type {
  CartItem,
  DeliveryConfig,
  Order,
  OrderItem,
  Product,
} from '../types.ts';
import { ProductMedia } from './ProductMedia.tsx';

interface CheckoutViewProps {
  items: CartItem[];
  products: Product[];
  delivery: DeliveryConfig;
  onBackToShop: () => void;
  onOrderCreated: (order: Order) => void;
}

function generateLocalOrderRef(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `THV-${y}${m}${d}-${suffix}`;
}

export function CheckoutView({
  items,
  products,
  delivery,
  onBackToShop,
  onOrderCreated,
}: CheckoutViewProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliveryRuleId, setDeliveryRuleId] = useState<string>(
    delivery.configured && delivery.rules[0] ? delivery.rules[0].id : '',
  );
  const [paymentConfirmedMethod, setPaymentConfirmedMethod] = useState(true);
  const [transactionReference, setTransactionReference] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedItems = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;
          return {
            ...item,
            product,
            lineTotal: product.priceNgn * item.quantity,
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [items, products],
  );

  const subtotalNgn = resolvedItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  const hasDeliveryZones = delivery.configured && delivery.rules.length > 0;
  const selectedRule = hasDeliveryZones
    ? (delivery.rules.find((r) => r.id === deliveryRuleId) ?? delivery.rules[0])
    : null;
  const deliveryFeeNgn = selectedRule ? selectedRule.feeNgn : 0;
  const totalNgn = subtotalNgn + deliveryFeeNgn;

  const whatsappCheckoutUrl = useMemo(() => {
    const lines = resolvedItems.map((item) => {
      const variant = [item.selectedSize, item.selectedColor]
        .filter(Boolean)
        .join(' / ');
      return `• ${item.product.name}${variant ? ` (${variant})` : ''} × ${item.quantity} — ${formatNaira(item.lineTotal)}`;
    });

    const msg = [
      'Hello THARVEN, I would like to place an order:',
      '',
      ...lines,
      '',
      `Total: ${formatNaira(totalNgn)}`,
      customerName.trim() ? `Name: ${customerName.trim()}` : null,
      customerPhone.trim() ? `Phone: ${customerPhone.trim()}` : null,
      customerEmail.trim() ? `Email: ${customerEmail.trim()}` : null,
      deliveryAddress.trim() || deliveryCity.trim() || deliveryState.trim()
        ? `Delivery: ${[deliveryAddress.trim(), deliveryCity.trim(), deliveryState.trim()].filter(Boolean).join(', ')}`
        : null,
      deliveryInstructions.trim()
        ? `Notes: ${deliveryInstructions.trim()}`
        : null,
      transactionReference.trim()
        ? `Moniepoint Ref: ${transactionReference.trim()}`
        : `Payment Method: ${PAYMENT_DETAILS.provider} (${PAYMENT_DETAILS.accountNumber} · ${PAYMENT_DETAILS.accountName})`,
    ]
      .filter((line): line is string => line !== null)
      .join('\n');

    return buildWhatsAppOrderUrl(msg);
  }, [
    resolvedItems,
    totalNgn,
    customerName,
    customerPhone,
    customerEmail,
    deliveryAddress,
    deliveryCity,
    deliveryState,
    deliveryInstructions,
    transactionReference,
  ]);

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_DETAILS.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    } catch {
      setCopiedAccount(false);
    }
  };

  if (resolvedItems.length === 0) {
    return (
      <section className="mx-auto max-w-2xl bg-white px-4 py-16 text-center sm:px-6">
        <div className="border border-black/10 bg-white p-10">
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Your bag is empty
          </h1>
          <p className="mt-2 text-sm text-muted">
            Add at least one THARVEN piece before proceeding to checkout.
          </p>
          <button
            type="button"
            onClick={onBackToShop}
            className="mt-6 min-h-[44px] bg-ink px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase hover:bg-neutral-800"
          >
            Return to Shop
          </button>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!paymentConfirmedMethod) {
      setError('Please select Manual Moniepoint Bank Transfer to continue.');
      return;
    }

    const name = customerName.trim();
    const phone = customerPhone.trim();
    const email = customerEmail.trim();
    const address = deliveryAddress.trim();
    const city = deliveryCity.trim();
    const state = deliveryState.trim();
    const txRef = transactionReference.trim();

    if (name.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (phone.replace(/[^\d]/g, '').length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (address.length < 5) {
      setError('Please enter your full delivery street address.');
      return;
    }
    if (state.length < 2 || city.length < 2) {
      setError('Please enter both your delivery state and city.');
      return;
    }
    if (txRef.length < 4) {
      setError(
        'Please enter your Moniepoint transaction reference (or use Direct WhatsApp Checkout below).',
      );
      return;
    }

    setSubmitting(true);

    const nowIso = new Date().toISOString();
    const orderItems: OrderItem[] = resolvedItems.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      unitPriceNgn: item.product.priceNgn,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      lineTotalNgn: item.lineTotal,
    }));

    const localOrder: Order = {
      orderRef: generateLocalOrderRef(),
      createdAt: nowIso,
      updatedAt: nowIso,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      deliveryAddress: address,
      deliveryCity: city,
      deliveryState: state,
      deliveryInstructions: deliveryInstructions.trim(),
      deliveryZone: selectedRule ? selectedRule.zone : null,
      deliveryFeeNgn: selectedRule ? selectedRule.feeNgn : null,
      subtotalNgn,
      totalNgn,
      paymentMethod: 'Moniepoint Bank Transfer',
      transactionReference: txRef,
      paymentStatus: 'Awaiting Verification',
      orderStatus: 'New Order',
      adminNotes: '',
      items: orderItems,
    };

    // Optional silent backend sync if Express server is running; works 100% locally on Netlify
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          deliveryAddress: address,
          deliveryCity: city,
          deliveryState: state,
          deliveryInstructions: deliveryInstructions.trim(),
          deliveryRuleId: selectedRule?.id ?? '',
          transactionReference: txRef,
          items: resolvedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })),
        }),
      });
      const contentType = response.headers.get('content-type') ?? '';
      if (response.ok && contentType.includes('application/json')) {
        const data = (await response.json()) as { order?: Order };
        if (data.order) {
          setSubmitting(false);
          onOrderCreated(data.order);
          return;
        }
      }
    } catch {
      // Static hosting mode proceeds cleanly with local order record
    }

    setSubmitting(false);
    onOrderCreated(localOrder);
  };

  return (
    <section className="mx-auto max-w-7xl bg-white px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <button
        type="button"
        onClick={onBackToShop}
        className="inline-flex min-h-[40px] items-center gap-2 text-xs font-bold tracking-[0.14em] text-muted uppercase hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to Shop</span>
      </button>

      <div className="mt-6 border-b border-black/10 pb-6">
        <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
          Checkout &amp; Manual Verification
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
          Complete Your Order
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12"
      >
        {/* Left Column: Customer Delivery Details + Moniepoint Transfer */}
        <div className="space-y-8 lg:col-span-7">
          <div className="border border-black/10 bg-white p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-ink">
              1. Customer &amp; Delivery Information
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  Full Name *
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  Phone Number *
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-email"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  Email Address *
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-address"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  Delivery Address *
                </label>
                <input
                  id="checkout-address"
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House number, street name, landmark"
                  className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-state"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  State *
                </label>
                <input
                  id="checkout-state"
                  type="text"
                  required
                  value={deliveryState}
                  onChange={(e) => setDeliveryState(e.target.value)}
                  placeholder="e.g. Lagos"
                  className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-city"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  City *
                </label>
                <input
                  id="checkout-city"
                  type="text"
                  required
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  placeholder="e.g. Lekki / Ikeja"
                  className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>

              {hasDeliveryZones && (
                <div className="sm:col-span-2">
                  <label
                    htmlFor="checkout-zone"
                    className="block text-xs font-bold tracking-wider text-ink uppercase"
                  >
                    Delivery Zone *
                  </label>
                  <select
                    id="checkout-zone"
                    value={selectedRule?.id ?? ''}
                    onChange={(e) => setDeliveryRuleId(e.target.value)}
                    className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                  >
                    {delivery.rules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.zone} — {formatNaira(rule.feeNgn)}
                        {rule.notes ? ` (${rule.notes})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-instructions"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  Additional Delivery Instructions (Optional)
                </label>
                <textarea
                  id="checkout-instructions"
                  rows={2}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Preferred drop-off note or contact time"
                  className="mt-1.5 w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* 2. Official Moniepoint Payment Details */}
          <div className="border border-black/15 bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">
                2. Moniepoint Bank Transfer
              </h2>
              <span className="text-xs font-bold tracking-wider text-gold uppercase">
                Manual Verification
              </span>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-3 border border-black/15 bg-surface/60 px-4 py-3 text-sm font-semibold text-ink">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentConfirmedMethod}
                onChange={() => setPaymentConfirmedMethod(true)}
                className="h-4 w-4 accent-black"
              />
              <span>Manual Moniepoint Transfer</span>
            </label>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              Transfer the exact total of{' '}
              <strong className="font-mono text-ink tabular-nums">
                {formatNaira(totalNgn)}
              </strong>{' '}
              to the official THARVEN Moniepoint account below, then enter your
              transaction reference or complete your order via WhatsApp.
            </p>

            <div className="mt-5 border border-black/15 bg-surface p-5">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
                  <dt className="text-muted">Payment Provider</dt>
                  <dd className="font-bold text-ink">
                    {PAYMENT_DETAILS.provider}
                  </dd>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
                  <div>
                    <dt className="text-muted">Account Number</dt>
                    <dd className="mt-0.5 font-mono text-xl font-extrabold tracking-wider text-ink tabular-nums">
                      {PAYMENT_DETAILS.accountNumber}
                    </dd>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="inline-flex min-h-[40px] items-center gap-2 bg-ink px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-neutral-800"
                  >
                    {copiedAccount ? (
                      <>
                        <Check
                          className="h-3.5 w-3.5 text-gold-soft"
                          aria-hidden="true"
                        />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy
                          className="h-3.5 w-3.5 text-gold-soft"
                          aria-hidden="true"
                        />
                        <span>Copy Account Number</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <dt className="text-muted">Account Name</dt>
                  <dd className="font-bold text-ink">
                    {PAYMENT_DETAILS.accountName}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-5">
              <label
                htmlFor="checkout-txref"
                className="block text-xs font-bold tracking-wider text-ink uppercase"
              >
                Moniepoint Transaction Reference *
              </label>
              <input
                id="checkout-txref"
                type="text"
                required
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="Enter transfer session ID or payment reference"
                className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 font-mono text-sm text-ink focus:border-black"
              />
              <p className="mt-1.5 text-xs text-muted">
                Your order enters{' '}
                <strong className="text-ink">Awaiting Verification</strong> until
                verified directly in Moniepoint.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary + Submit + Direct WhatsApp Checkout */}
        <aside className="lg:col-span-5">
          <div className="border border-black/15 bg-white p-6 sm:p-8 lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-bold text-ink">
              Order Summary
            </h2>

            <ul className="mt-5 divide-y divide-black/10">
              {resolvedItems.map((item) => (
                <li key={item.key} className="flex gap-3.5 py-4 first:pt-0">
                  <div className="w-16 shrink-0 border border-black/10">
                    <ProductMedia
                      src={item.product.images[0]}
                      alt={item.product.name}
                      productName={item.product.name}
                      aspectClassName="aspect-[4/5]"
                    />
                  </div>
                  <div className="flex flex-1 justify-between gap-2">
                    <div>
                      <p className="font-display text-sm font-bold text-ink">
                        {item.product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Qty {item.quantity}
                        {(item.selectedSize || item.selectedColor) &&
                          ` · ${[item.selectedSize, item.selectedColor]
                            .filter(Boolean)
                            .join(', ')}`}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-bold text-ink tabular-nums">
                      {formatNaira(item.lineTotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2.5 border-t border-black/10 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-mono font-semibold text-ink tabular-nums">
                  {formatNaira(subtotalNgn)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="font-mono text-ink tabular-nums">
                  {hasDeliveryZones
                    ? formatNaira(deliveryFeeNgn)
                    : 'Confirmed after verification'}
                </dd>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-3 text-base">
                <dt className="font-display font-extrabold text-ink">
                  Total Payable
                </dt>
                <dd className="font-mono text-xl font-extrabold text-ink tabular-nums">
                  {formatNaira(totalNgn)}
                </dd>
              </div>
            </dl>

            {error && (
              <div
                role="alert"
                className="mt-5 border border-red-700/30 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-900"
              >
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-[50px] w-full items-center justify-center gap-2 bg-ink px-6 py-3.5 text-xs font-bold tracking-[0.16em] text-white uppercase transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                <Lock className="h-4 w-4 text-gold-soft" aria-hidden="true" />
                <span>
                  {submitting
                    ? 'Submitting Order...'
                    : 'Confirm Order & Submit Reference'}
                </span>
              </button>

              <a
                href={whatsappCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] w-full items-center justify-center gap-2 border border-black/25 bg-white px-6 py-3 text-xs font-bold tracking-[0.14em] text-ink uppercase transition-colors hover:border-black"
              >
                <MessageCircle
                  className="h-4 w-4 text-gold"
                  aria-hidden="true"
                />
                <span>Checkout via WhatsApp</span>
              </a>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                aria-hidden="true"
              />
              <span>
                Orders are never marked paid automatically. Payment is verified
                manually via Moniepoint before dispatch.
              </span>
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}
