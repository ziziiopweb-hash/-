export type Language = 'ar' | 'en';

export type DeliveryMethod = 'player_id' | 'account_login' | 'digital_code';

export type OrderStatus =
  | 'awaiting_payment'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'needs_review';

export interface ProductVariant {
  id: string;
  productId: string;
  nameAr: string;
  nameEn: string;
  amount: number | string;
  unit: string;
  priceMRU: number;
  active: boolean;
  deliveryMethod?: DeliveryMethod;
  sortOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  game: string;
  nameAr: string;
  nameEn: string;
  image: string;
  artworkThumbnail?: string;
  artworkBanner?: string;
  genre?: string;
  badgeTagAr?: string;
  badgeTagEn?: string;
  deliveryMethod: DeliveryMethod;
  requiresPlayerId: boolean;
  requiresZoneId?: boolean;
  requiresServer?: boolean;
  requiresAccountCredentials?: boolean;
  active: boolean;
  descriptionAr: string;
  descriptionEn: string;
  warningNoticeAr?: string;
  warningNoticeEn?: string;
  sortOrder: number;
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string;
  sortOrder: number;
}

export interface OrderStatusHistoryItem {
  id: string;
  status: OrderStatus;
  note: string;
  changedBy: string;
  timestamp: string;
}

export interface Order {
  id: string;
  reference: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  deliveryMethod: DeliveryMethod;
  playerId?: string;
  playerZoneId?: string;
  serverName?: string;
  accountCredentialsEncrypted?: string;
  amountMRU: number;
  paymentMethod: 'bankily' | 'masrivi' | 'sedad';
  paymentPhone: string; // 31520844
  transactionReference?: string;
  paymentProofUrl?: string;
  status: OrderStatus;
  adminNotes?: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
  history?: OrderStatusHistoryItem[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'customer';
  language: Language;
}

export interface Announcement {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  type: 'info' | 'promotion' | 'warning';
  active: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  orderReference?: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  paymentNumber: string;
  whatsappNumber: string;
  supportHoursAr: string;
  supportHoursEn: string;
  bankilyInstructionsAr: string;
  bankilyInstructionsEn: string;
  masriviInstructionsAr: string;
  masriviInstructionsEn: string;
  sedadInstructionsAr: string;
  sedadInstructionsEn: string;
  bannerNoticeAr: string;
  bannerNoticeEn: string;
  bannerActive: boolean;
}
