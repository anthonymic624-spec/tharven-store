import { CheckCircle2, Mail, MessageCircle } from 'lucide-react';
import {
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_DISPLAY,
  PAYMENT_DETAILS,
  buildWhatsAppOrderUrl,
  formatNaira,
} from '../brand.ts';
import type { Order } from '../types.ts';

interface OrderConfirmationViewProps {
  order: Order;
  onContinueShopping: () => void;
  onTrackOrder: () => void;
}

export function OrderConfirmationView({
  order,
  onContinueShopping,
  onTrackOrder,
}: OrderConfirmationViewProps) {
  const itemLines = order.items.map((item) => {
    const variant = [item.selectedSize, item.selectedColor]
      .filter(Boolean)
      .join(' / ');
    return `• ${item.productName}${variant ? ` (${variant})` : ''} × ${item.quantity} — ${formatNaira(item.lineTotalNgn)}`;
  });

  const whatsappReceiptUrl = buildWhatsAppOrderUrl(
    [
      `Hello THARVEN, I just submitted order ${order.orderRef}.`,
      '',
      ...itemLines,
      '',
      `Total: ${formatNaira(order.totalNgn)}`,
      `Name: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Delivery: ${order.deliveryAddress}, ${order.deliveryCity}, ${order.deliveryState}`,
      `Moniepoint Ref: ${order.transactionReference}`,
    ].join('\n'),
  );

  return (
    <section className="mx-auto max-w-3xl bg-white px-4 py-12 sm:px-6 lg:py-16">
      <div className="border border-black/15 bg-white p-6 sm:p-10">
        <div className="flex items-start gap-3.5 border-b border-black/10 pb-6">
          <CheckCircle2
            className="mt-0.5 h-7 w-7 shrink-0 text-gold"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
              Order Received · {order.paymentStatus}
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
              Thank you, {order.customerName}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Keep your unique THARVEN order reference below. Send your order
              summary on WhatsApp for fast Moniepoint confirmation.
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-b border-black/10 pb-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold tracking-wider text-muted uppercase">
              Order Reference
            </dt>
            <dd className="mt-1 font-mono text-lg font-extrabold text-ink">
              {order.orderRef}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-wider text-muted uppercase">
              Order Date
            </dt>
            <dd className="mt-1 text-ink">
              {new Date(order.createdAt).toLocaleString()}
            </dd>
          </div>
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
          <div>
            <dt className="text-xs font-bold tracking-wider text-muted uppercase">
              Account Paid To
            </dt>
            <dd className="mt-1 text-ink">
              {PAYMENT_DETAILS.provider} · {PAYMENT_DETAILS.accountNumber}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-b border-black/10 pb-6">
          <h2 className="text-xs font-bold tracking-wider text-muted uppercase">
            Items Ordered
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {order.items.map((item, idx) => (
              <li
                key={`${item.productId}-${idx}`}
                className="flex items-center justify-between"
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
                <span className="font-mono font-bold text-ink tabular-nums">
                  {formatNaira(item.lineTotalNgn)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3 text-base">
            <span className="font-display font-extrabold text-ink">
              Total Amount
            </span>
            <span className="font-mono text-xl font-extrabold text-ink tabular-nums">
              {formatNaira(order.totalNgn)}
            </span>
          </div>
        </div>

        <div className="mt-6 border-b border-black/10 pb-6 text-sm">
          <h2 className="text-xs font-bold tracking-wider text-muted uppercase">
            Delivery Destination
          </h2>
          <p className="mt-2 font-medium text-ink">
            {order.deliveryAddress}, {order.deliveryCity}, {order.deliveryState}
          </p>
          <p className="mt-1 text-muted">
            {order.customerPhone} · {order.customerEmail}
          </p>
          {order.deliveryInstructions && (
            <p className="mt-1 text-xs text-muted">
              Note: {order.deliveryInstructions}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 text-xs">
            <a
              href={whatsappReceiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[42px] items-center gap-2 bg-ink px-4 py-2 font-bold text-white uppercase hover:bg-neutral-800"
            >
              <MessageCircle
                className="h-4 w-4 text-gold-soft"
                aria-hidden="true"
              />
              <span>Send Order on WhatsApp ({CONTACT_WHATSAPP_DISPLAY})</span>
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex min-h-[42px] items-center gap-2 border border-black/20 px-4 py-2 font-semibold text-ink hover:border-black"
            >
              <Mail className="h-4 w-4 text-gold" aria-hidden="true" />
              <span>{CONTACT_EMAIL}</span>
            </a>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onTrackOrder}
              className="min-h-[42px] border border-black/20 px-4 py-2 text-xs font-bold tracking-wider text-ink uppercase hover:border-black"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={onContinueShopping}
              className="min-h-[42px] border border-black/20 px-5 py-2 text-xs font-bold tracking-wider text-ink uppercase hover:border-black"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
