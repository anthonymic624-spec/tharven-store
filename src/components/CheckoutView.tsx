import { Check, Copy, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PAYMENT_DETAILS, formatNaira } from '../brand.ts';
import type {
  CartItem,
  DeliveryConfig,
  Order,
  Product,
} from '../types.ts';

interface CheckoutViewProps {
  items: CartItem[];
  products: Product[];
  delivery: DeliveryConfig;
  onBackToShop: () => void;
  onOrderCreated: (order: Order) => void;
}

export function CheckoutView({
  items,
  products,
  delivery,
  onBackToShop,
  onOrderCreated,
}: CheckoutViewProps) {
  const enriched = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { item, product } : null;
    })
    .filter((entry): entry is { item: CartItem; product: Product } =>
      Boolean(entry),
    );

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState(
    delivery.configured && delivery.rules.length > 0 ? delivery.rules[0].id : '',
  );
  const [transactionReference, setTransactionReference] = useState('');

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subtotalNgn = enriched.reduce(
    (sum, { item, product }) => sum + product.priceNgn * item.quantity,
    0,
  );

  const activeRule =
    delivery.configured && delivery.rules.length > 0
      ? delivery.rules.find((r) => r.id === selectedRuleId) ?? delivery.rules[0]
      : null;

  const deliveryFeeNgn = activeRule ? activeRule.feeNgn : null;
  const totalNgn = subtotalNgn + (deliveryFeeNgn ?? 0);

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_DETAILS.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {
      setErrorMsg('Copy failed. Please copy account number 9115966747 manually.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (enriched.length === 0) {
      setErrorMsg('Your bag is empty.');
      return;
    }
    if (customerName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (customerPhone.replace(/[^\d]/g, '').length < 7) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customerEmail.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (deliveryAddress.trim().length < 5) {
      setErrorMsg('Please enter your complete delivery address.');
      return;
    }
    if (delivery.configured && delivery.rules.length > 0 && !activeRule) {
      setErrorMsg('Please choose a delivery option.');
      return;
    }
    if (transactionReference.trim().length < 4) {
      setErrorMsg(
        'Please enter your Moniepoint transfer transaction reference or payment ID.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          deliveryAddress: deliveryAddress.trim(),
          deliveryInstructions: deliveryInstructions.trim(),
          deliveryRuleId: activeRule?.id ?? '',
          transactionReference: transactionReference.trim(),
          items: enriched.map(({ item }) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })),
        }),
      });

      const data = (await response.json()) as { order?: Order; error?: string };
      if (!response.ok || !data.order) {
        setErrorMsg(data.error ?? 'Could not submit your order.');
        return;
      }

      onOrderCreated(data.order);
    } catch {
      setErrorMsg('Network error submitting your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (enriched.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <div className="border border-ink/15 bg-cream p-10">
          <h1 className="font-display text-2xl font-bold text-ink">
            Your bag is empty
          </h1>
          <p className="mt-2 text-sm text-muted">
            Add items to your bag before checking out.
          </p>
          <button
            type="button"
            onClick={onBackToShop}
            className="mt-6 bg-obsidian px-6 py-3 text-sm font-semibold text-gold"
          >
            Browse Shop
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-ink/10 pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-gold-deep uppercase">
          Checkout
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
          Complete Your Order
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12"
      >
        {/* Left: Customer, Delivery & Payment Transfer Details */}
        <div className="space-y-8 lg:col-span-7">
          {/* Customer Information */}
          <div className="border border-ink/12 bg-cream p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-ink">
              1. Customer &amp; Delivery Details
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-semibold text-ink uppercase"
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
                  className="mt-1.5 min-h-[44px] w-full border border-ink/20 bg-beige px-3.5 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-semibold text-ink uppercase"
                >
                  Phone Number *
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+234 ..."
                  className="mt-1.5 min-h-[44px] w-full border border-ink/20 bg-beige px-3.5 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-email"
                  className="block text-xs font-semibold text-ink uppercase"
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
                  className="mt-1.5 min-h-[44px] w-full border border-ink/20 bg-beige px-3.5 py-2 text-sm text-ink"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-address"
                  className="block text-xs font-semibold text-ink uppercase"
                >
                  Delivery Address *
                </label>
                <textarea
                  id="checkout-address"
                  required
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street, estate/landmark, city, and state"
                  className="mt-1.5 w-full border border-ink/20 bg-beige px-3.5 py-2.5 text-sm text-ink"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-instructions"
                  className="block text-xs font-semibold text-ink uppercase"
                >
                  Delivery Instructions (Optional)
                </label>
                <input
                  id="checkout-instructions"
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Gate code, preferred call window, or drop-off note"
                  className="mt-1.5 min-h-[44px] w-full border border-ink/20 bg-beige px-3.5 py-2 text-sm text-ink"
                />
              </div>
            </div>
          </div>

          {/* Delivery Fees & Rules */}
          <div className="border border-ink/12 bg-cream p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-ink">
              2. Delivery Option
            </h2>
            {delivery.configured && delivery.rules.length > 0 ? (
              <div className="mt-4 space-y-3">
                {delivery.generalNotes && (
                  <p className="text-xs text-muted">{delivery.generalNotes}</p>
                )}
                {delivery.rules.map((rule) => (
                  <label
                    key={rule.id}
                    className={`flex cursor-pointer items-start justify-between gap-4 border p-4 transition-colors ${
                      activeRule?.id === rule.id
                        ? 'border-obsidian bg-beige'
                        : 'border-ink/15 bg-cream hover:bg-beige/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deliveryRule"
                        checked={activeRule?.id === rule.id}
                        onChange={() => setSelectedRuleId(rule.id)}
                        className="mt-1 accent-obsidian"
                      />
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {rule.zone}
                        </p>
                        {rule.notes && (
                          <p className="mt-0.5 text-xs text-muted">
                            {rule.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-ink tabular-nums">
                      {formatNaira(rule.feeNgn)}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-4 border border-ink/15 bg-beige p-4 text-sm text-muted">
                <p className="font-medium text-ink">
                  Delivery fees and rules are not yet configured.
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  {delivery.generalNotes ||
                    'No delivery fee has been added to this order. Our team will confirm delivery pricing and dispatch arrangements with you via WhatsApp or email after submission.'}
                </p>
              </div>
            )}
          </div>

          {/* Payment Method: Moniepoint Manual Bank Transfer */}
          <div className="border border-ink/15 bg-obsidian p-6 text-cream sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
                  3. Bank Transfer Payment
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-cream">
                  {PAYMENT_DETAILS.provider} Transfer Details
                </h2>
              </div>
              <Lock className="h-5 w-5 text-gold" aria-hidden="true" />
            </div>

            <div className="mt-5 space-y-3 border border-gold/30 bg-charcoal p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream/10 pb-3">
                <span className="text-xs text-sand/75 uppercase">
                  Payment Provider
                </span>
                <span className="font-display text-sm font-bold text-cream">
                  {PAYMENT_DETAILS.provider}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream/10 pb-3">
                <div>
                  <span className="block text-xs text-sand/75 uppercase">
                    Account Number
                  </span>
                  <span className="font-mono text-xl font-bold tracking-wider text-gold tabular-nums">
                    {PAYMENT_DETAILS.accountNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="inline-flex min-h-[40px] items-center gap-2 border border-gold/50 bg-obsidian px-4 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold hover:text-obsidian"
                >
                  {copiedAccount ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy Account Number</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream/10 pb-3">
                <span className="text-xs text-sand/75 uppercase">
                  Account Name
                </span>
                <span className="font-display text-sm font-bold text-cream">
                  {PAYMENT_DETAILS.accountName}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-sand/75 uppercase">
                  Amount to Transfer
                </span>
                <span className="font-mono text-lg font-bold text-gold tabular-nums">
                  {formatNaira(totalNgn)}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="checkout-tx-ref"
                className="block text-xs font-semibold text-gold uppercase"
              >
                Moniepoint Transaction Reference / Payment ID *
              </label>
              <input
                id="checkout-tx-ref"
                type="text"
                required
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="Enter transfer reference / session ID after sending"
                className="mt-2 min-h-[44px] w-full border border-gold/30 bg-charcoal px-3.5 py-2 font-mono text-sm text-cream placeholder:text-sand/45"
              />
              <p className="mt-2.5 text-xs leading-relaxed text-sand/80">
                Your order payment status will remain{' '}
                <strong className="text-gold">Pending Verification</strong> until
                THARVEN verifies the transfer in the admin panel. Payment
                screenshots alone are not treated as proof of payment.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5">
          <div className="border border-ink/12 bg-cream p-6 sm:p-8 lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-bold text-ink">
              Order Summary
            </h2>

            <ul className="mt-5 divide-y divide-ink/10">
              {enriched.map(({ item, product }) => (
                <li
                  key={item.key}
                  className="flex items-start justify-between gap-4 py-3.5 first:pt-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {product.name}{' '}
                      <span className="font-mono text-xs text-muted tabular-nums">
                        × {item.quantity}
                      </span>
                    </p>
                    {(item.selectedSize || item.selectedColor) && (
                      <p className="mt-0.5 text-xs text-muted">
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
                  <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                    {formatNaira(product.priceNgn * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2.5 border-t border-ink/10 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-mono font-semibold text-ink tabular-nums">
                  {formatNaira(subtotalNgn)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="font-mono text-ink tabular-nums">
                  {deliveryFeeNgn !== null
                    ? formatNaira(deliveryFeeNgn)
                    : 'Not configured'}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-ink/15 pt-3 text-base">
                <dt className="font-display font-bold text-ink">Total</dt>
                <dd className="font-mono text-lg font-bold text-ink tabular-nums">
                  {formatNaira(totalNgn)}
                </dd>
              </div>
            </dl>

            {errorMsg && (
              <div
                role="alert"
                className="mt-5 border border-red-800/30 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-900"
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center bg-obsidian px-6 py-3.5 text-sm font-bold text-gold transition-colors hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting Order...' : 'Submit Order'}
            </button>
          </div>
        </aside>
      </form>
    </section>
  );
}
