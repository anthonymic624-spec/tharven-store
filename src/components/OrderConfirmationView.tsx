import { Check, CheckCircle2, Copy, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import {
  BRAND_LOGO,
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_DISPLAY,
  CONTACT_WHATSAPP_URL,
  PAYMENT_DETAILS,
  formatNaira,
} from '../brand.ts';
import type { Order, PaymentStatus } from '../types.ts';

interface OrderConfirmationViewProps {
  order: Order;
  onContinueShopping: () => void;
}

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending_verification: 'Pending Verification',
  verified: 'Payment Verified',
  rejected: 'Verification Issue — Contact Support',
};

export function OrderConfirmationView({
  order,
  onContinueShopping,
}: OrderConfirmationViewProps) {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);

  const copyText = async (value: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(value);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      // Ignore clipboard failure silently
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello THARVEN, I placed order ${order.orderRef} (${formatNaira(order.totalNgn)}). Moniepoint Transaction Ref: ${order.transactionReference}.`,
  );

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border border-ink/15 bg-cream p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="flex items-start gap-4">
            <img
              src={BRAND_LOGO}
              alt="THARVEN logo"
              referrerPolicy="no-referrer"
              className="h-12 w-12 border border-gold/40 object-cover"
            />
            <div>
              <div className="flex items-center gap-2 text-gold-deep">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-[0.18em] uppercase">
                  Order Recorded
                </span>
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
                Thank you, {order.customerName}
              </h1>
              <p className="mt-1 text-sm text-muted">
                Keep your order reference below to check verification and
                dispatch updates.
              </p>
            </div>
          </div>

          <div className="border border-ink/15 bg-beige px-4 py-3 text-right">
            <span className="block text-[11px] font-semibold text-muted uppercase">
              Order Reference
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-base font-bold text-ink tabular-nums">
                {order.orderRef}
              </span>
              <button
                type="button"
                onClick={() => copyText(order.orderRef, setCopiedRef)}
                aria-label="Copy order reference"
                className="p-1 text-muted hover:text-ink"
              >
                {copiedRef ? (
                  <Check className="h-4 w-4 text-gold-deep" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Payment Status & Moniepoint Summary */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="border border-ink/15 bg-beige p-5">
            <h2 className="font-display text-sm font-bold text-ink uppercase">
              Payment Status
            </h2>
            <p className="mt-2 font-display text-lg font-bold text-gold-deep">
              {PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </p>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Method</dt>
                <dd className="font-medium text-ink">{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Submitted Ref</dt>
                <dd className="font-mono font-semibold text-ink">
                  {order.transactionReference}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Order Status</dt>
                <dd className="font-semibold text-ink capitalize">
                  {order.orderStatus}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border border-gold/30 bg-obsidian p-5 text-cream">
            <h2 className="font-display text-sm font-bold text-gold uppercase">
              Moniepoint Payment Details
            </h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-sand/75">Provider</dt>
                <dd className="font-semibold text-cream">
                  {PAYMENT_DETAILS.provider}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-sand/75">Account Number</dt>
                <dd className="flex items-center gap-2 font-mono font-bold text-gold tabular-nums">
                  <span>{PAYMENT_DETAILS.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(PAYMENT_DETAILS.accountNumber, setCopiedAcc)
                    }
                    className="border border-gold/40 px-2 py-0.5 text-[11px] text-gold hover:bg-gold hover:text-obsidian"
                  >
                    {copiedAcc ? 'Copied' : 'Copy'}
                  </button>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-sand/75">Account Name</dt>
                <dd className="font-semibold text-cream">
                  {PAYMENT_DETAILS.accountName}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Itemized Summary */}
        <div className="mt-8 border-t border-ink/10 pt-6">
          <h2 className="font-display text-base font-bold text-ink">
            Order Summary
          </h2>
          <ul className="mt-4 divide-y divide-ink/10">
            {order.items.map((item, idx) => (
              <li
                key={`${item.productId}-${idx}`}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {item.productName}{' '}
                    <span className="font-mono text-xs text-muted tabular-nums">
                      × {item.quantity}
                    </span>
                  </p>
                  {(item.selectedSize || item.selectedColor) && (
                    <p className="text-xs text-muted">
                      {[
                        item.selectedSize ? `Size: ${item.selectedSize}` : null,
                        item.selectedColor
                          ? `Color: ${item.selectedColor}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                <span className="font-mono font-semibold text-ink tabular-nums">
                  {formatNaira(item.lineTotalNgn)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-mono text-ink tabular-nums">
                {formatNaira(order.subtotalNgn)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">
                Delivery {order.deliveryZone ? `(${order.deliveryZone})` : ''}
              </dt>
              <dd className="font-mono text-ink tabular-nums">
                {order.deliveryFeeNgn !== null
                  ? formatNaira(order.deliveryFeeNgn)
                  : 'Pending confirmation'}
              </dd>
            </div>
            <div className="flex justify-between border-t border-ink/15 pt-2.5 text-base font-bold">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">
                {formatNaira(order.totalNgn)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Delivery Info */}
        <div className="mt-6 border border-ink/10 bg-beige p-5 text-sm">
          <h3 className="font-display text-xs font-bold text-ink uppercase">
            Delivery Destination
          </h3>
          <p className="mt-2 font-medium text-ink">{order.deliveryAddress}</p>
          <p className="mt-1 text-xs text-muted">
            {order.customerPhone} · {order.customerEmail}
          </p>
          {order.deliveryInstructions && (
            <p className="mt-2 text-xs text-muted">
              Note: {order.deliveryInstructions}
            </p>
          )}
        </div>

        {/* Support & Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-6">
          <div className="text-xs text-muted">
            Need help? WhatsApp{' '}
            <span className="font-mono font-semibold text-ink">
              {CONTACT_WHATSAPP_DISPLAY}
            </span>{' '}
            or email <span className="font-medium text-ink">{CONTACT_EMAIL}</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`${CONTACT_WHATSAPP_URL}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[42px] items-center gap-2 border border-ink/20 bg-beige px-4 py-2 text-xs font-semibold text-ink hover:bg-sand"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>Message Support on WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={onContinueShopping}
              className="min-h-[42px] bg-obsidian px-5 py-2 text-xs font-semibold text-gold hover:bg-charcoal"
            >
              Return to Shop
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
