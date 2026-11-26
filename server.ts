import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { AUTHORITATIVE_PRICES_NGN } from './src/brand.ts';
import type {
  DeliveryRule,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from './src/types.ts';
import {
  extractBearerToken,
  getEnvAdminPassword,
  hashPassword,
  requireAdmin,
  signAdminToken,
  verifyAdminToken,
  verifyPasswordHash,
  verifyPlainPassword,
} from './server/auth.ts';
import { UPLOADS_DIR, loadStore, mutateStore } from './server/store.ts';

dotenv.config();

const PORT = 3000;

function normalizePhone(input: string): string {
  return input.replace(/[^\d]/g, '');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isSafeImagePath(url: string): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/assets/aistudio/')) {
    return /^\/assets\/aistudio\/[a-zA-Z0-9._-]+$/.test(trimmed);
  }
  if (trimmed.startsWith('/api/uploads/')) {
    return /^\/api\/uploads\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/.test(trimmed);
  }
  return false;
}

function generateOrderRef(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `THV-${y}${m}${d}-${suffix}`;
}

function detectImageType(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

async function startServer(): Promise<void> {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/api/storefront', (_req: Request, res: Response) => {
    const store = loadStore();
    res.json({
      products: store.products.filter((p) => p.active),
      delivery: store.delivery,
    });
  });

  app.get('/api/uploads/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    if (!/^[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/.test(filename)) {
      res.status(400).json({ error: 'Invalid filename.' });
      return;
    }
    const resolved = path.resolve(UPLOADS_DIR, filename);
    if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: 'Image not found.' });
      return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(resolved);
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;

    const customerName =
      typeof body.customerName === 'string' ? body.customerName.trim() : '';
    const customerPhone =
      typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
    const customerEmail =
      typeof body.customerEmail === 'string' ? body.customerEmail.trim() : '';
    const deliveryAddress =
      typeof body.deliveryAddress === 'string'
        ? body.deliveryAddress.trim()
        : '';
    const deliveryInstructions =
      typeof body.deliveryInstructions === 'string'
        ? body.deliveryInstructions.trim().slice(0, 500)
        : '';
    const deliveryRuleId =
      typeof body.deliveryRuleId === 'string' ? body.deliveryRuleId.trim() : '';
    const transactionReference =
      typeof body.transactionReference === 'string'
        ? body.transactionReference.trim()
        : '';
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (customerName.length < 2 || customerName.length > 120) {
      res
        .status(400)
        .json({ error: 'Please enter a valid full name (2–120 characters).' });
      return;
    }
    if (normalizePhone(customerPhone).length < 7 || customerPhone.length > 30) {
      res.status(400).json({ error: 'Please enter a valid phone number.' });
      return;
    }
    if (!isValidEmail(customerEmail) || customerEmail.length > 160) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (deliveryAddress.length < 5 || deliveryAddress.length > 400) {
      res
        .status(400)
        .json({ error: 'Please enter a complete delivery address.' });
      return;
    }
    if (
      transactionReference.length < 4 ||
      transactionReference.length > 80 ||
      !/^[a-zA-Z0-9._\-\/\s]+$/.test(transactionReference)
    ) {
      res.status(400).json({
        error:
          'Please enter a valid Moniepoint transaction reference or payment ID (4–80 characters).',
      });
      return;
    }
    if (rawItems.length === 0 || rawItems.length > 30) {
      res.status(400).json({ error: 'Your cart is empty or exceeds limits.' });
      return;
    }

    try {
      const createdOrder = await mutateStore((store) => {
        const orderItems: OrderItem[] = [];
        const requestedByProduct = new Map<string, number>();

        for (const entry of rawItems) {
          if (!entry || typeof entry !== 'object') {
            throw new Error('Invalid cart item format.');
          }
          const itemObj = entry as Record<string, unknown>;
          const productId =
            typeof itemObj.productId === 'string' ? itemObj.productId.trim() : '';
          const quantity = Number(itemObj.quantity);
          const selectedSize =
            typeof itemObj.selectedSize === 'string' &&
            itemObj.selectedSize.trim().length > 0
              ? itemObj.selectedSize.trim()
              : null;
          const selectedColor =
            typeof itemObj.selectedColor === 'string' &&
            itemObj.selectedColor.trim().length > 0
              ? itemObj.selectedColor.trim()
              : null;

          if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
            throw new Error('Item quantity must be between 1 and 50.');
          }

          const product = store.products.find(
            (p) => p.id === productId && p.active,
          );
          if (!product) {
            throw new Error(`Product "${productId}" is unavailable.`);
          }

          if (product.sizes.length > 0) {
            if (!selectedSize || !product.sizes.includes(selectedSize)) {
              throw new Error(
                `Please select a valid size for ${product.name}.`,
              );
            }
          }
          if (product.colors.length > 0) {
            if (!selectedColor || !product.colors.includes(selectedColor)) {
              throw new Error(
                `Please select a valid color for ${product.name}.`,
              );
            }
          }

          requestedByProduct.set(
            product.id,
            (requestedByProduct.get(product.id) ?? 0) + quantity,
          );

          const authoritativePrice =
            AUTHORITATIVE_PRICES_NGN[product.id] ?? product.priceNgn;

          orderItems.push({
            productId: product.id,
            productName: product.name,
            unitPriceNgn: authoritativePrice,
            quantity,
            selectedSize: product.sizes.length > 0 ? selectedSize : null,
            selectedColor: product.colors.length > 0 ? selectedColor : null,
            lineTotalNgn: authoritativePrice * quantity,
          });
        }

        for (const [productId, totalQty] of requestedByProduct.entries()) {
          const product = store.products.find((p) => p.id === productId);
          if (!product) continue;
          if (product.stock !== null) {
            if (product.stock <= 0) {
              throw new Error(`${product.name} is currently out of stock.`);
            }
            if (totalQty > product.stock) {
              throw new Error(
                `Only ${product.stock} unit(s) of ${product.name} available in stock.`,
              );
            }
            product.stock -= totalQty;
          }
        }

        const subtotalNgn = orderItems.reduce(
          (sum, item) => sum + item.lineTotalNgn,
          0,
        );

        let deliveryZone: string | null = null;
        let deliveryFeeNgn: number | null = null;
        if (store.delivery.configured && store.delivery.rules.length > 0) {
          const matchedRule = store.delivery.rules.find(
            (r) => r.id === deliveryRuleId,
          );
          if (!matchedRule) {
            throw new Error('Please select a configured delivery option.');
          }
          deliveryZone = matchedRule.zone;
          deliveryFeeNgn = matchedRule.feeNgn;
        }

        const nowIso = new Date().toISOString();
        const newOrder: Order = {
          orderRef: generateOrderRef(),
          createdAt: nowIso,
          updatedAt: nowIso,
          customerName,
          customerPhone,
          customerEmail,
          deliveryAddress,
          deliveryInstructions,
          deliveryZone,
          deliveryFeeNgn,
          subtotalNgn,
          totalNgn: subtotalNgn + (deliveryFeeNgn ?? 0),
          paymentMethod: 'Moniepoint Bank Transfer',
          transactionReference,
          paymentStatus: 'pending_verification',
          orderStatus: 'pending',
          adminNotes: '',
          items: orderItems,
        };

        store.orders.unshift(newOrder);
        return newOrder;
      });

      res.status(201).json({ order: createdOrder });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to place order.';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/orders/lookup', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const orderRef =
      typeof body.orderRef === 'string' ? body.orderRef.trim().toUpperCase() : '';
    const contact =
      typeof body.contact === 'string' ? body.contact.trim() : '';

    if (!orderRef || !contact) {
      res.status(400).json({
        error: 'Enter both your order reference and your email or phone number.',
      });
      return;
    }

    const store = loadStore();
    const normalizedContactPhone = normalizePhone(contact);
    const lowerContact = contact.toLowerCase();

    const matched = store.orders.find((o) => {
      if (o.orderRef.toUpperCase() !== orderRef) return false;
      const emailMatch = o.customerEmail.toLowerCase() === lowerContact;
      const phoneMatch =
        normalizedContactPhone.length >= 7 &&
        normalizePhone(o.customerPhone) === normalizedContactPhone;
      return emailMatch || phoneMatch;
    });

    if (!matched) {
      res.status(404).json({
        error:
          'No matching order found. Check your order reference and email/phone number.',
      });
      return;
    }

    res.json({ order: matched });
  });

  app.get('/api/admin/status', (req: Request, res: Response) => {
    const store = loadStore();
    const envPw = getEnvAdminPassword();
    const token = extractBearerToken(req);
    const authenticated = verifyAdminToken(token);
    res.json({
      authenticated,
      requiresSetup: !envPw && !store.adminPasswordHash,
      usesEnvPassword: Boolean(envPw),
    });
  });

  app.post('/api/admin/setup', async (req: Request, res: Response) => {
    const envPw = getEnvAdminPassword();
    if (envPw) {
      res.status(403).json({
        error: 'Admin password is configured via environment secret.',
      });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const password =
      typeof body.password === 'string' ? body.password : '';
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({
        error: 'Password must be between 8 and 128 characters.',
      });
      return;
    }

    try {
      await mutateStore((store) => {
        if (store.adminPasswordHash) {
          throw new Error('Admin password has already been claimed.');
        }
        store.adminPasswordHash = hashPassword(password);
      });
      const token = signAdminToken();
      res.status(201).json({ token });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to complete setup.';
      res.status(409).json({ error: msg });
    }
  });

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const password =
      typeof body.password === 'string' ? body.password : '';
    if (!password) {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }

    const envPw = getEnvAdminPassword();
    if (envPw) {
      if (!verifyPlainPassword(password, envPw)) {
        res.status(401).json({ error: 'Incorrect admin password.' });
        return;
      }
      res.json({ token: signAdminToken() });
      return;
    }

    const store = loadStore();
    if (!store.adminPasswordHash) {
      res.status(400).json({
        error: 'Admin password has not been set up yet.',
      });
      return;
    }

    if (!verifyPasswordHash(password, store.adminPasswordHash)) {
      res.status(401).json({ error: 'Incorrect admin password.' });
      return;
    }

    res.json({ token: signAdminToken() });
  });

  app.get('/api/admin/orders', requireAdmin, (_req: Request, res: Response) => {
    const store = loadStore();
    res.json({ orders: store.orders });
  });

  app.patch(
    '/api/admin/orders/:orderRef',
    requireAdmin,
    async (req: Request, res: Response) => {
      const orderRef = req.params.orderRef;
      const body = req.body as Record<string, unknown>;

      const allowedPayment: PaymentStatus[] = [
        'pending_verification',
        'verified',
        'rejected',
      ];
      const allowedOrder: OrderStatus[] = [
        'pending',
        'confirmed',
        'dispatched',
        'delivered',
        'cancelled',
      ];

      try {
        const updated = await mutateStore((store) => {
          const order = store.orders.find((o) => o.orderRef === orderRef);
          if (!order) {
            throw new Error('Order not found.');
          }
          if (
            typeof body.paymentStatus === 'string' &&
            allowedPayment.includes(body.paymentStatus as PaymentStatus)
          ) {
            order.paymentStatus = body.paymentStatus as PaymentStatus;
          }
          if (
            typeof body.orderStatus === 'string' &&
            allowedOrder.includes(body.orderStatus as OrderStatus)
          ) {
            order.orderStatus = body.orderStatus as OrderStatus;
          }
          if (typeof body.adminNotes === 'string') {
            order.adminNotes = body.adminNotes.trim().slice(0, 500);
          }
          order.updatedAt = new Date().toISOString();
          return order;
        });
        res.json({ order: updated });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Update failed.';
        res.status(404).json({ error: msg });
      }
    },
  );

  app.get(
    '/api/admin/products',
    requireAdmin,
    (_req: Request, res: Response) => {
      const store = loadStore();
      res.json({ products: store.products, delivery: store.delivery });
    },
  );

  app.patch(
    '/api/admin/products/:id',
    requireAdmin,
    async (req: Request, res: Response) => {
      const id = req.params.id;
      const body = req.body as Record<string, unknown>;

      try {
        const updated = await mutateStore((store) => {
          const product = store.products.find((p) => p.id === id);
          if (!product) {
            throw new Error('Product not found.');
          }

          if (typeof body.description === 'string') {
            product.description = body.description.trim().slice(0, 600);
          }
          if (Array.isArray(body.sizes)) {
            product.sizes = Array.from(
              new Set(
                body.sizes
                  .filter((s): s is string => typeof s === 'string')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0 && s.length <= 24),
              ),
            );
          }
          if (Array.isArray(body.colors)) {
            product.colors = Array.from(
              new Set(
                body.colors
                  .filter((c): c is string => typeof c === 'string')
                  .map((c) => c.trim())
                  .filter((c) => c.length > 0 && c.length <= 32),
              ),
            );
          }
          if (body.stock === null) {
            product.stock = null;
          } else if (
            typeof body.stock === 'number' &&
            Number.isInteger(body.stock) &&
            body.stock >= 0 &&
            body.stock <= 100000
          ) {
            product.stock = body.stock;
          }
          if (typeof body.active === 'boolean') {
            product.active = body.active;
          }
          if (Array.isArray(body.images)) {
            product.images = body.images
              .filter((img): img is string => typeof img === 'string')
              .map((img) => img.trim())
              .filter(isSafeImagePath);
          }

          // Enforce authoritative naira prices
          if (AUTHORITATIVE_PRICES_NGN[product.id]) {
            product.priceNgn = AUTHORITATIVE_PRICES_NGN[product.id];
          }

          return product;
        });

        res.json({ product: updated });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Update failed.';
        res.status(400).json({ error: msg });
      }
    },
  );

  app.put(
    '/api/admin/delivery',
    requireAdmin,
    async (req: Request, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const configured = Boolean(body.configured);
      const generalNotes =
        typeof body.generalNotes === 'string'
          ? body.generalNotes.trim().slice(0, 600)
          : '';
      const rawRules = Array.isArray(body.rules) ? body.rules : [];

      const sanitizedRules: DeliveryRule[] = [];
      for (const r of rawRules) {
        if (!r || typeof r !== 'object') continue;
        const obj = r as Record<string, unknown>;
        const zone = typeof obj.zone === 'string' ? obj.zone.trim() : '';
        const feeNgn = Number(obj.feeNgn);
        const notes =
          typeof obj.notes === 'string' ? obj.notes.trim().slice(0, 200) : '';
        if (
          zone.length < 2 ||
          zone.length > 80 ||
          !Number.isFinite(feeNgn) ||
          feeNgn < 0 ||
          feeNgn > 1000000
        ) {
          res.status(400).json({
            error:
              'Each delivery rule requires a valid zone name and non-negative fee in ₦.',
          });
          return;
        }
        sanitizedRules.push({
          id:
            typeof obj.id === 'string' && obj.id.trim().length > 0
              ? obj.id.trim().slice(0, 40)
              : crypto.randomUUID().slice(0, 8),
          zone,
          feeNgn: Math.round(feeNgn),
          notes,
        });
      }

      const updated = await mutateStore((store) => {
        store.delivery = {
          configured,
          generalNotes,
          rules: sanitizedRules,
        };
        return store.delivery;
      });

      res.json({ delivery: updated });
    },
  );

  app.post(
    '/api/admin/upload',
    requireAdmin,
    (req: Request, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
      const match = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
        dataUrl,
      );
      if (!match) {
        res.status(400).json({
          error: 'Please upload a valid PNG, JPEG, or WebP image file.',
        });
        return;
      }

      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({
          error: 'Image size must be under 5 MB.',
        });
        return;
      }

      const detected = detectImageType(buffer);
      if (!detected) {
        res.status(400).json({
          error: 'Uploaded file failed image signature validation.',
        });
        return;
      }

      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const filename = `prod_${crypto.randomUUID().replace(/-/g, '')}.${detected.ext}`;
      const target = path.resolve(UPLOADS_DIR, filename);
      if (!target.startsWith(UPLOADS_DIR + path.sep)) {
        res.status(403).json({ error: 'Invalid upload destination.' });
        return;
      }

      fs.writeFileSync(target, buffer);
      res.status(201).json({ url: `/api/uploads/${filename}` });
    },
  );

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THARVEN storefront server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start THARVEN server:', err);
  process.exit(1);
});
