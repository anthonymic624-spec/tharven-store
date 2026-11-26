import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DeliveryConfig, Order, Product } from '../src/types.ts';

export interface PersistedStore {
  adminPasswordHash: string | null;
  products: Product[];
  delivery: DeliveryConfig;
  orders: Order[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const STORE_FILE = path.resolve(DATA_DIR, 'store.json');

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'shirt',
    name: 'Shirt',
    category: 'Apparel',
    priceNgn: 50000,
    description: 'THARVEN signature statement shirt.',
    images: [
      '/assets/aistudio/f174dc1c-0dfb-413f-88f6-e3a273eb35b9_28f937c9.jpeg',
      '/assets/aistudio/100a3c98-029e-47b2-ba00-deef67422e4e_f2b80a8a.jpeg',
      '/assets/aistudio/96072b58-3de1-4b86-bb7d-fae424a4d344_c1521d26.jpeg',
    ],
    sizes: [],
    colors: [],
    stock: null,
    active: true,
  },
  {
    id: 'shorts',
    name: 'Shorts',
    category: 'Apparel',
    priceNgn: 60000,
    description: 'THARVEN structured shorts with gold insignia.',
    images: [
      '/assets/aistudio/748666a7-eb13-4d73-b369-e7cd7f9836d0_9ef2d481.jpeg',
    ],
    sizes: [],
    colors: [],
    stock: null,
    active: true,
  },
  {
    id: 'necklace',
    name: 'Necklace',
    category: 'Accessories',
    priceNgn: 30000,
    description: 'THARVEN metallic wordmark pendant necklace.',
    images: [
      '/assets/aistudio/0f4ec4e4-9e90-49f4-b107-fb08a17f8c19_1f93ad75.jpeg',
    ],
    sizes: [],
    colors: [],
    stock: null,
    active: true,
  },
  {
    id: 'belt',
    name: 'Belt',
    category: 'Accessories',
    priceNgn: 20000,
    description: 'THARVEN belt. Product photo pending upload.',
    images: [],
    sizes: [],
    colors: [],
    stock: null,
    active: true,
  },
];

const DEFAULT_STORE: PersistedStore = {
  adminPasswordHash: null,
  products: DEFAULT_PRODUCTS,
  delivery: {
    configured: false,
    generalNotes: '',
    rules: [],
  },
  orders: [],
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
    return {
      adminPasswordHash:
        typeof parsed.adminPasswordHash === 'string'
          ? parsed.adminPasswordHash
          : null,
      products: Array.isArray(parsed.products)
        ? parsed.products
        : structuredClone(DEFAULT_PRODUCTS),
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
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
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
