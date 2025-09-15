// Tipos de usuário e roles
export type UserRole = 'admin' | 'member' | 'customer';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de produtos
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de moeda
export type Currency = 'BRL' | 'USD' | 'EUR';

// Tipos de idioma
export type Language = 'pt' | 'en';

// Tipos de notificação
export type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'push';

// Tipos de pagamento
export type PaymentProvider = 'stripe' | 'paypal' | 'pix';

// Responses de API
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Tipos de cupom
export type CouponType = 'percent' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotal?: number | null;
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}