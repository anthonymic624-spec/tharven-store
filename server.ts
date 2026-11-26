import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from './src/brand.ts';
import { THARVEN_CATALOGUE } from './src/data/catalogue.ts';
import type {
  DeliveryRule,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from './src/types.ts';
import { createServer as createViteServer } from 'vite';
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
  if (trimmed.startsWith('/src/assets/images/')) {
    return /^\/src\/assets\/images\/[a-zA-Z0-9._-]+$/.test(trimmed);
  }
  if (trimmed.startsWith('/api/uploads/')) {
    return /^\/api\/uploads\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/.test(trimmed);
  }
  return false;
}

function sanitizeHttpsUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
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
      social: store.social,
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
    const deliveryCity =
      typeof body.deliveryCity === 'string' ? body.deliveryCity.trim() : '';
    const deliveryState =
      typeof body.deliveryState === 'string' ? body.deliveryState.trim() : '';
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
        .json({ error: 'Please enter a complete street delivery address.' });
      return;
    }
    if (deliveryCity.length < 2 || deliveryCity.length > 80) {
      res.status(400).json({ error: 'Please enter your delivery city.' });
      return;
    }
    if (deliveryState.length < 2 || deliveryState.length > 80) {
      res.status(400).json({ error: 'Please enter your delivery state.' });
      return;
    }
    if (
      transactionReference.length < 4 ||
      transactionReference.length > 80 ||
      !/^[a-zA-Z0-9._\-\/\s]+$/.test(transactionReference)
    ) {
      res.status(400).json({
        error:
          'Please enter a valid Moniepoint transaction reference (4–80 characters).',
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
                `Please select an available size for ${product.name}.`,
              );
            }
          }
          if (product.colors.length > 0) {
            if (!selectedColor || !product.colors.includes(selectedColor)) {
              throw new Error(
                `Please select an available color for ${product.name}.`,
              );
            }
          }

          requestedByProduct.set(
            product.id,
            (requestedByProduct.get(product.id) ?? 0) + quantity,
          );

          orderItems.push({
            productId: product.id,
            productName: product.name,
            unitPriceNgn: product.priceNgn,
            quantity,
            selectedSize: product.sizes.length > 0 ? selectedSize : null,
            selectedColor: product.colors.length > 0 ? selectedColor : null,
            lineTotalNgn: product.priceNgn * quantity,
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
            throw new Error('Please select a configured delivery zone.');
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
          deliveryCity,
          deliveryState,
          deliveryInstructions,
          deliveryZone,
          deliveryFeeNgn,
          subtotalNgn,
          totalNgn: subtotalNgn + (deliveryFeeNgn ?? 0),
          paymentMethod: 'Moniepoint Bank Transfer',
          transactionReference,
          paymentStatus: 'Awaiting Verification',
          orderStatus: 'New Order',
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
          'No matching order found. Verify your order reference and email or phone number.',
      });
      return;
    }

    res.json({ order: matched });
  });

  app.post('/api/newsletter', async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const consent = body.consent === true;

    if (!consent) {
      res.status(400).json({
        error: 'Please confirm consent to receive THARVEN release updates.',
      });
      return;
    }
    if (!isValidEmail(email) || email.length > 160) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    await mutateStore((store) => {
      const exists = store.newsletter.some((s) => s.email === email);
      if (!exists) {
        store.newsletter.unshift({
          email,
          consentedAt: new Date().toISOString(),
        });
      }
    });

    res.status(201).json({ subscribed: true });
  });

  app.post('/api/inquiries', async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (name.length < 2 || name.length > 120) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (!isValidEmail(email) || email.length > 160) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (message.length < 5 || message.length > 1500) {
      res
        .status(400)
        .json({ error: 'Please enter a message (5–1500 characters).' });
      return;
    }

    await mutateStore((store) => {
      store.inquiries.unshift({
        id: crypto.randomUUID().slice(0, 8),
        name,
        email,
        phone: phone.slice(0, 30),
        message,
        createdAt: new Date().toISOString(),
      });
    });

    res.status(201).json({ received: true });
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
    const password = typeof body.password === 'string' ? body.password : '';
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
    const password = typeof body.password === 'string' ? body.password : '';
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

      const allowedPayment: readonly PaymentStatus[] = PAYMENT_STATUS_OPTIONS;
      const allowedOrder: readonly OrderStatus[] = ORDER_STATUS_OPTIONS;

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
      res.json({
        products: store.products,
        delivery: store.delivery,
        social: store.social,
        newsletter: store.newsletter,
        inquiries: store.inquiries,
      });
    },
  );

  app.patch(
    '/api/admin/products/:id',
    requireAdmin,
    async (req: Request, res: Response) => {
      const id = req.params.id;
      if (!THARVEN_CATALOGUE.some((p) => p.id === id)) {
        res.status(403).json({
          error: 'Only official THARVEN products can be modified.',
        });
        return;
      }

      const body = req.body as Record<string, unknown>;

      try {
        const updated = await mutateStore((store) => {
          const product = store.products.find((p) => p.id === id);
          if (!product) {
            throw new Error('Product not found.');
          }

          if (
            typeof body.priceNgn === 'number' &&
            Number.isFinite(body.priceNgn) &&
            body.priceNgn >= 100 &&
            body.priceNgn <= 100000000
          ) {
            product.priceNgn = Math.round(body.priceNgn);
          }
          if (typeof body.description === 'string') {
            product.description = body.description.trim().slice(0, 600);
          }
          if (body.category === 'Apparel' || body.category === 'Accessories') {
            product.category = body.category;
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
          if (typeof body.isFeatured === 'boolean') {
            product.isFeatured = body.isFeatured;
          }
          if (typeof body.isNewArrival === 'boolean') {
            product.isNewArrival = body.isNewArrival;
          }
          if (Array.isArray(body.images)) {
            product.images = body.images
              .filter((img): img is string => typeof img === 'string')
              .map((img) => img.trim())
              .filter(isSafeImagePath);
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

  app.put(
    '/api/admin/social',
    requireAdmin,
    async (req: Request, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const updated = await mutateStore((store) => {
        store.social = {
          instagram: sanitizeHttpsUrl(body.instagram),
          tiktok: sanitizeHttpsUrl(body.tiktok),
          x: sanitizeHttpsUrl(body.x),
        };
        return store.social;
      });
      res.json({ social: updated });
    },
  );

  app.post(
    '/api/admin/upload',
    requireAdmin,
    (req: Request, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
      const match =
        /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
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
