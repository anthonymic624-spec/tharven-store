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

export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

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

export interface StorefrontPublicData {
  products: Product[];
  delivery: DeliveryConfig;
}

export interface AdminAuthStatus {
  authenticated: boolean;
  requiresSetup: boolean;
  usesEnvPassword: boolean;
}
