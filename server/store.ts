import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { THARVEN_CATALOGUE } from '../src/data/catalogue.ts';
import type {
  CustomerInquiry,
  DeliveryConfig,
  NewsletterSubscriber,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  SocialLinks,
} from '../src/types.ts';

export interface PersistedStore {
  adminPasswordHash: string | null;
  products: Product[];
  delivery: DeliveryConfig;
  social: SocialLinks;
  orders: Order[];
  newsletter: NewsletterSubscriber[];
  inquiries: CustomerInquiry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const STORE_FILE = path.resolve(DATA_DIR, 'store.json');

export const DEFAULT_PRODUCTS: Product[] = structuredClone(THARVEN_CATALOGUE);

const DEFAULT_STORE: PersistedStore = {
  adminPasswordHash: null,
  products: DEFAULT_PRODUCTS,
  delivery: {
    configured: false,
    generalNotes: '',
    rules: [],
  },
  social: {
    instagram: '',
    tiktok: '',
    x: '',
  },
  orders: [],
  newsletter: [],
  inquiries: [],
};

function ensureDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function writeAtomic(store: PersistedStore): void {
  ensureDirectories();
  const tmpFile = `${STORE_FILE}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_FILE);
}

function reconcileProducts(rawProducts: unknown): Product[] {
  const existingMap = new Map<string, Partial<Product>>();
  if (Array.isArray(rawProducts)) {
    for (const item of rawProducts) {
      if (item && typeof item === 'object' && typeof (item as Product).id === 'string') {
        existingMap.set((item as Product).id, item as Partial<Product>);
      }
    }
  }

  return DEFAULT_PRODUCTS.map((base) => {
    const saved = existingMap.get(base.id);
    if (!saved) return structuredClone(base);
    return {
      id: base.id,
      name: base.name,
      category:
        saved.category === 'Apparel' || saved.category === 'Accessories'
          ? saved.category
          : base.category,
      priceNgn:
        typeof saved.priceNgn === 'number' &&
        Number.isFinite(saved.priceNgn) &&
        saved.priceNgn > 0
          ? Math.round(saved.priceNgn)
          : base.priceNgn,
      description:
        typeof saved.description === 'string' && saved.description.trim().length > 0
          ? saved.description.trim()
          : base.description,
      images:
        Array.isArray(saved.images) && saved.images.length > 0
          ? saved.images.filter((u): u is string => typeof u === 'string')
          : structuredClone(base.images),
      sizes: Array.isArray(saved.sizes)
        ? saved.sizes.filter((s): s is string => typeof s === 'string')
        : [],
      colors: Array.isArray(saved.colors)
        ? saved.colors.filter((c): c is string => typeof c === 'string')
        : [],
      stock:
        typeof saved.stock === 'number' && Number.isInteger(saved.stock) && saved.stock >= 0
          ? saved.stock
          : null,
      active: typeof saved.active === 'boolean' ? saved.active : true,
      isFeatured:
        typeof saved.isFeatured === 'boolean' ? saved.isFeatured : base.isFeatured,
      isNewArrival:
        typeof saved.isNewArrival === 'boolean'
          ? saved.isNewArrival
          : base.isNewArrival,
    };
  });
}

function normalizePaymentStatus(val: unknown): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    Pending: 'Pending',
    'Awaiting Verification': 'Awaiting Verification',
    Paid: 'Paid',
    Failed: 'Failed',
    Refunded: 'Refunded',
    pending_verification: 'Awaiting Verification',
    verified: 'Paid',
    rejected: 'Failed',
  };
  return typeof val === 'string' && map[val] ? map[val] : 'Awaiting Verification';
}

function normalizeOrderStatus(val: unknown): OrderStatus {
  const map: Record<string, OrderStatus> = {
    'New Order': 'New Order',
    Processing: 'Processing',
    Shipped: 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
    pending: 'New Order',
    confirmed: 'Processing',
    dispatched: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return typeof val === 'string' && map[val] ? map[val] : 'New Order';
}

function sanitizeOrders(rawOrders: unknown): Order[] {
  if (!Array.isArray(rawOrders)) return [];
  return rawOrders
    .filter((o): o is Record<string, unknown> => Boolean(o) && typeof o === 'object')
    .map((o) => ({
      orderRef: typeof o.orderRef === 'string' ? o.orderRef : '',
      createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
      updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
      customerName: typeof o.customerName === 'string' ? o.customerName : '',
      customerPhone: typeof o.customerPhone === 'string' ? o.customerPhone : '',
      customerEmail: typeof o.customerEmail === 'string' ? o.customerEmail : '',
      deliveryAddress: typeof o.deliveryAddress === 'string' ? o.deliveryAddress : '',
      deliveryCity: typeof o.deliveryCity === 'string' ? o.deliveryCity : '',
      deliveryState: typeof o.deliveryState === 'string' ? o.deliveryState : '',
      deliveryInstructions:
        typeof o.deliveryInstructions === 'string' ? o.deliveryInstructions : '',
      deliveryZone: typeof o.deliveryZone === 'string' ? o.deliveryZone : null,
      deliveryFeeNgn:
        typeof o.deliveryFeeNgn === 'number' ? o.deliveryFeeNgn : null,
      subtotalNgn: typeof o.subtotalNgn === 'number' ? o.subtotalNgn : 0,
      totalNgn: typeof o.totalNgn === 'number' ? o.totalNgn : 0,
      paymentMethod: 'Moniepoint Bank Transfer' as const,
      transactionReference:
        typeof o.transactionReference === 'string' ? o.transactionReference : '',
      paymentStatus: normalizePaymentStatus(o.paymentStatus),
      orderStatus: normalizeOrderStatus(o.orderStatus),
      adminNotes: typeof o.adminNotes === 'string' ? o.adminNotes : '',
      items: Array.isArray(o.items) ? (o.items as Order['items']) : [],
    }))
    .filter((o) => o.orderRef.length > 0);
}

export function loadStore(): PersistedStore {
  ensureDirectories();
  if (!fs.existsSync(STORE_FILE)) {
    const initial = structuredClone(DEFAULT_STORE);
    writeAtomic(initial);
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    const normalized: PersistedStore = {
      adminPasswordHash:
        typeof parsed.adminPasswordHash === 'string'
          ? parsed.adminPasswordHash
          : null,
      products: reconcileProducts(parsed.products),
      delivery:
        parsed.delivery && typeof parsed.delivery === 'object'
          ? {
              configured: Boolean(parsed.delivery.configured),
              generalNotes:
                typeof parsed.delivery.generalNotes === 'string'
                  ? parsed.delivery.generalNotes
                  : '',
              rules: Array.isArray(parsed.delivery.rules)
                ? parsed.delivery.rules
                : [],
            }
          : structuredClone(DEFAULT_STORE.delivery),
      social:
        parsed.social && typeof parsed.social === 'object'
          ? {
              instagram:
                typeof parsed.social.instagram === 'string'
                  ? parsed.social.instagram
                  : '',
              tiktok:
                typeof parsed.social.tiktok === 'string'
                  ? parsed.social.tiktok
                  : '',
              x: typeof parsed.social.x === 'string' ? parsed.social.x : '',
            }
          : structuredClone(DEFAULT_STORE.social),
      orders: sanitizeOrders(parsed.orders),
      newsletter: Array.isArray(parsed.newsletter) ? parsed.newsletter : [],
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
    };
    return normalized;
  } catch {
    const initial = structuredClone(DEFAULT_STORE);
    writeAtomic(initial);
    return initial;
  }
}

let writeQueue: Promise<unknown> = Promise.resolve();

export function mutateStore<T>(
  mutator: (store: PersistedStore) => T | Promise<T>,
): Promise<T> {
  const next = writeQueue.then(async () => {
    const current = loadStore();
    const result = await mutator(current);
    writeAtomic(current);
    return result;
  });
  writeQueue = next.catch(() => undefined);
  return next;
}
