import { Check, Mail, MessageCircle, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_DISPLAY,
  CONTACT_WHATSAPP_URL,
  PAYMENT_DETAILS,
  formatNaira,
} from '../brand.ts';
import type { DeliveryConfig, Order } from '../types.ts';

export function TrackOrderView({ delivery }: { delivery: DeliveryConfig }) {
  const [orderRef, setOrderRef] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderRef, contact }),
      });
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error ?? 'Order not found.');
        return;
      }
      setOrder(data.order);
    } catch {
      setError('Unable to check order status right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl bg-white px-4 py-12 sm:px-6 lg:py-16">
      <div className="border-b border-black/10 pb-6">
        <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
          Order Lookup
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Track Your THARVEN Order
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Enter your unique order reference and the email address or phone number
          used at checkout to check payment verification and fulfillment status.
        </p>
      </div>

      <form
        onSubmit={handleLookup}
        className="mt-8 grid grid-cols-1 gap-4 border border-black/10 bg-white p-6 sm:grid-cols-12 sm:p-8"
      >
        <div className="sm:col-span-5">
          <label
            htmlFor="lookup-ref"
            className="block text-xs font-bold tracking-wider text-ink uppercase"
          >
            Order Reference
          </label>
          <input
            id="lookup-ref"
            type="text"
            required
            value={orderRef}
            onChange={(e) => setOrderRef(e.target.value)}
            placeholder="e.g. THV-20261126-A1B2C3"
            className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 font-mono text-sm text-ink focus:border-black"
          />
        </div>

        <div className="sm:col-span-5">
          <label
            htmlFor="lookup-contact"
            className="block text-xs font-bold tracking-wider text-ink uppercase"
          >
            Email or Phone
          </label>
          <input
            id="lookup-contact"
            type="text"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email or phone number"
            className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
          />
        </div>

        <div className="flex items-end sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 bg-ink px-4 py-2.5 text-xs font-bold tracking-wider text-white uppercase hover:bg-neutral-800 disabled:opacity-50"
          >
            <Search className="h-4 w-4 text-gold-soft" aria-hidden="true" />
            <span>{loading ? '...' : 'Check'}</span>
          </button>
        </div>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 border border-red-700/30 bg-red-50 px-4 py-3 text-xs font-medium text-red-900"
        >
          {error}
        </p>
      )}

      {order && (
        <div className="mt-8 border border-black/15 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
            <div>
              <p className="font-mono text-sm font-extrabold text-ink">
                {order.orderRef}
              </p>
              <p className="mt-1 text-xs text-muted">
                Placed {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <p className="font-mono text-xl font-extrabold text-ink tabular-nums">
              {formatNaira(order.totalNgn)}
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-bold tracking-wider text-muted uppercase">
                Payment Status
              </dt>
              <dd className="mt-1 font-bold text-gold">{order.paymentStatus}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold tracking-wider text-muted uppercase">
                Order Status
              </dt>
              <dd className="mt-1 font-bold text-ink">{order.orderStatus}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold tracking-wider text-muted uppercase">
                Moniepoint Reference
              </dt>
              <dd className="mt-1 font-mono text-ink">
                {order.transactionReference}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-black/10 pt-5">
            <h2 className="text-xs font-bold tracking-wider text-muted uppercase">
              Purchased Pieces
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
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
                  <span className="font-mono font-semibold text-ink tabular-nums">
                    {formatNaira(item.lineTotalNgn)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 border-t border-black/10 pt-4 text-xs text-muted">
            Delivery to: {order.deliveryAddress}, {order.deliveryCity},{' '}
            {order.deliveryState}
          </div>
        </div>
      )}

      {delivery.configured && delivery.rules.length > 0 && (
        <div className="mt-10 border border-black/10 bg-surface/50 p-6">
          <h2 className="font-display text-base font-bold text-ink">
            Configured Delivery Zones
          </h2>
          {delivery.generalNotes && (
            <p className="mt-1 text-xs text-muted">{delivery.generalNotes}</p>
          )}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {delivery.rules.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between border border-black/10 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-ink">{r.zone}</p>
                  {r.notes && <p className="text-xs text-muted">{r.notes}</p>}
                </div>
                <p className="font-mono font-bold text-ink tabular-nums">
                  {formatNaira(r.feeNgn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function ContactSupportView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = (await res.json()) as {
        received?: boolean;
        error?: string;
      };
      if (!res.ok || !data.received) {
        setStatus({
          type: 'error',
          text: data.error ?? 'Unable to send inquiry.',
        });
        return;
      }
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setStatus({
        type: 'success',
        text: 'Your message has been received by THARVEN Customer Care.',
      });
    } catch {
      setStatus({
        type: 'error',
        text: 'Network error. Please contact us directly on WhatsApp or email.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="border-b border-black/10 pb-6">
        <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
          Customer Support
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Contact THARVEN
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Speak directly with our team regarding sizing, Moniepoint transfer
          verification, or order dispatch.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="border border-black/10 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-ink">
              Official Contact Channels
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="border-b border-black/10 pb-3">
                <dt className="text-xs font-bold tracking-wider text-muted uppercase">
                  WhatsApp Support
                </dt>
                <dd className="mt-1 font-mono text-base font-bold text-ink">
                  {CONTACT_WHATSAPP_DISPLAY}
                </dd>
              </div>
              <div className="border-b border-black/10 pb-3">
                <dt className="text-xs font-bold tracking-wider text-muted uppercase">
                  Business Email
                </dt>
                <dd className="mt-1 font-medium text-ink">{CONTACT_EMAIL}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wider text-muted uppercase">
                  Official Transfer Account
                </dt>
                <dd className="mt-1 text-ink">
                  {PAYMENT_DETAILS.provider} ·{' '}
                  <span className="font-mono font-bold">
                    {PAYMENT_DETAILS.accountNumber}
                  </span>{' '}
                  ({PAYMENT_DETAILS.accountName})
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={CONTACT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 bg-ink px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase hover:bg-neutral-800"
              >
                <MessageCircle
                  className="h-4 w-4 text-gold-soft"
                  aria-hidden="true"
                />
                <span>Chat on WhatsApp</span>
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-black/20 px-5 py-2.5 text-xs font-bold tracking-wider text-ink uppercase hover:border-black"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>Send Email</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border border-black/10 bg-white p-6 sm:p-8 lg:col-span-7">
          <h2 className="font-display text-lg font-bold text-ink">
            Send a Direct Message
          </h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  Full Name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-xs font-bold tracking-wider text-ink uppercase"
                >
                  Phone (Optional)
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs font-bold tracking-wider text-ink uppercase"
              >
                Email Address *
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="contact-msg"
                className="block text-xs font-bold tracking-wider text-ink uppercase"
              >
                Message *
              </label>
              <textarea
                id="contact-msg"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us how we can assist you..."
                className="mt-1.5 w-full border border-black/20 bg-white px-3.5 py-2 text-sm text-ink focus:border-black"
              />
            </div>

            {status && (
              <div
                role={status.type === 'error' ? 'alert' : 'status'}
                className={`flex items-center gap-2 border px-3.5 py-2.5 text-xs font-medium ${
                  status.type === 'success'
                    ? 'border-gold/50 bg-surface text-ink'
                    : 'border-red-700/30 bg-red-50 text-red-900'
                }`}
              >
                {status.type === 'success' && (
                  <Check className="h-4 w-4 text-gold" aria-hidden="true" />
                )}
                <span>{status.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[46px] bg-ink px-6 py-3 text-xs font-bold tracking-[0.14em] text-white uppercase hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
