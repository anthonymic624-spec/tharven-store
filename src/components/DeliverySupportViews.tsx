import { Mail, MessageCircle, Search, Truck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_DISPLAY,
  CONTACT_WHATSAPP_URL,
  formatNaira,
} from '../brand.ts';
import type { DeliveryConfig, Order, PaymentStatus } from '../types.ts';

export function DeliveryView({ delivery }: { delivery: DeliveryConfig }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-ink/10 pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-gold-deep uppercase">
          Logistics
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
          Delivery Fees &amp; Rules
        </h1>
      </div>

      <div className="mt-8 border border-ink/12 bg-cream p-6 sm:p-8">
        {delivery.configured && delivery.rules.length > 0 ? (
          <div>
            <div className="flex items-center gap-2.5 text-ink">
              <Truck className="h-5 w-5 text-gold-deep" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold">
                Configured Delivery Zones
              </h2>
            </div>

            {delivery.generalNotes && (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {delivery.generalNotes}
              </p>
            )}

            <div className="mt-6 divide-y divide-ink/10 border border-ink/10 bg-beige">
              {delivery.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4"
                >
                  <div>
                    <p className="font-display text-base font-semibold text-ink">
                      {rule.zone}
                    </p>
                    {rule.notes && (
                      <p className="mt-0.5 text-xs text-muted">{rule.notes}</p>
                    )}
                  </div>
                  <span className="font-mono text-base font-bold text-ink tabular-nums">
                    {formatNaira(rule.feeNgn)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="flex items-center gap-2.5 text-ink">
              <Truck className="h-5 w-5 text-gold-deep" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold">
                Delivery Rules Pending Configuration
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {delivery.generalNotes ||
                'Delivery fees, dispatch zones, and timelines have not been published yet. After you place an order, THARVEN customer care will confirm exact delivery arrangements with you directly via WhatsApp or email.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  rejected: 'Verification Issue — Contact Support',
};

export function SupportView() {
  const [orderRef, setOrderRef] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFoundOrder(null);
    setLoading(true);
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderRef: orderRef.trim(),
          contact: contact.trim(),
        }),
      });
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setErrorMsg(data.error ?? 'Order not found.');
        return;
      }
      setFoundOrder(data.order);
    } catch {
      setErrorMsg('Unable to check order status right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-ink/10 pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-gold-deep uppercase">
          Customer Care
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
          Support &amp; Order Tracking
        </h1>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Direct Contact */}
        <div className="border border-ink/12 bg-obsidian p-6 text-cream sm:p-8 lg:col-span-5">
          <h2 className="font-display text-xl font-bold text-gold">
            Reach THARVEN Directly
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-sand/85">
            Contact our team for order verification, sizing inquiries, or
            delivery coordination.
          </p>

          <dl className="mt-6 space-y-4 border-t border-cream/10 pt-5 text-sm">
            <div>
              <dt className="text-xs text-sand/70 uppercase">
                WhatsApp Customer Care
              </dt>
              <dd className="mt-1 font-mono text-base font-semibold text-cream">
                {CONTACT_WHATSAPP_DISPLAY}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-sand/70 uppercase">Business Email</dt>
              <dd className="mt-1 break-all font-medium text-cream">
                {CONTACT_EMAIL}
              </dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-col gap-3">
            <a
              href={CONTACT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 bg-gold px-5 py-2.5 text-sm font-bold text-obsidian transition-colors hover:bg-gold/90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-gold/40 bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-charcoal/70"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>Send Email</span>
            </a>
          </div>
        </div>

        {/* Order Status Lookup */}
        <div className="border border-ink/12 bg-cream p-6 sm:p-8 lg:col-span-7">
          <h2 className="font-display text-xl font-bold text-ink">
            Check Order &amp; Payment Status
          </h2>
          <p className="mt-1 text-sm text-muted">
            Enter your unique order reference along with the email or phone
            number used at checkout.
          </p>

          <form onSubmit={handleLookup} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="lookup-ref"
                  className="block text-xs font-semibold text-ink uppercase"
                >
                  Order Reference
                </label>
                <input
                  id="lookup-ref"
                  type="text"
                  required
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                  placeholder="THV-20261126-..."
                  className="mt-1.5 min-h-[44px] w-full border border-ink/20 bg-beige px-3.5 py-2 font-mono text-sm text-ink"
                />
              </div>
              <div>
                <label
                  htmlFor="lookup-contact"
                  className="block text-xs font-semibold text-ink uppercase"
                >
                  Email or Phone Number
                </label>
                <input
                  id="lookup-contact"
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="you@example.com or phone"
                  className="mt-1.5 min-h-[44px] w-full border border-ink/20 bg-beige px-3.5 py-2 text-sm text-ink"
                />
              </div>
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="border border-red-800/30 bg-red-50 px-3 py-2 text-xs font-medium text-red-900"
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[44px] items-center gap-2 bg-obsidian px-6 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-charcoal disabled:opacity-60"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>{loading ? 'Checking...' : 'Check Order Status'}</span>
            </button>
          </form>

          {foundOrder && (
            <div className="mt-6 border border-ink/15 bg-beige p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
                <span className="font-mono text-sm font-bold text-ink">
                  {foundOrder.orderRef}
                </span>
                <span className="font-mono text-sm font-bold text-ink tabular-nums">
                  {formatNaira(foundOrder.totalNgn)}
                </span>
              </div>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted">Payment Verification</dt>
                  <dd className="font-semibold text-gold-deep">
                    {PAYMENT_STATUS_LABEL[foundOrder.paymentStatus]}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Fulfillment Status</dt>
                  <dd className="font-semibold text-ink capitalize">
                    {foundOrder.orderStatus}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Moniepoint Ref</dt>
                  <dd className="font-mono text-ink">
                    {foundOrder.transactionReference}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
