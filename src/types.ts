export type ProductCategory = 'Apparel' | 'Accessories';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  priceNgn: number;
  description: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number | null;
  active: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
}

export interface DeliveryRule {
  id: string;
  zone: string;
  feeNgn: number;
  notes: string;
}

export interface DeliveryConfig {
  configured: boolean;
  generalNotes: string;
  rules: DeliveryRule[];
}

export interface SocialLinks {
  instagram: string;
  tiktok: string;
  x: string;
}

export type PaymentStatus =
  | 'Pending'
  | 'Awaiting Verification'
  | 'Paid'
  | 'Failed'
  | 'Refunded';

export type OrderStatus =
  | 'New Order'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPriceNgn: number;
  quantity: number;
  selectedSize: string | null;
  selectedColor: string | null;
  lineTotalNgn: number;
}

export interface Order {
  orderRef: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryInstructions: string;
  deliveryZone: string | null;
  deliveryFeeNgn: number | null;
  subtotalNgn: number;
  totalNgn: number;
  paymentMethod: 'Moniepoint Bank Transfer';
  transactionReference: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  adminNotes: string;
  items: OrderItem[];
}

export interface CartItem {
  key: string;
  productId: string;
  quantity: number;
  selectedSize: string | null;
  selectedColor: string | null;
}

export interface NewsletterSubscriber {
  email: string;
  consentedAt: string;
}

export interface CustomerInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

export interface StorefrontPublicData {
  products: Product[];
  delivery: DeliveryConfig;
  social: SocialLinks;
}

export interface AdminAuthStatus {
  authenticated: boolean;
  requiresSetup: boolean;
  usesEnvPassword: boolean;
}
