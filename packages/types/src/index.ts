export type SalesChannel = "retail" | "wholesale";

export type UserRole =
  | "retail_customer"
  | "wholesale_customer"
  | "support_agent"
  | "content_editor"
  | "inventory_manager"
  | "order_manager"
  | "finance_manager"
  | "admin"
  | "super_admin";

export type ProductCategorySlug =
  | "pod"
  | "vape"
  | "disposable"
  | "e-liquid"
  | "salt-nicotine"
  | "coil"
  | "cartridge"
  | "lighter"
  | "accessories";

export type OrderStatus =
  | "draft"
  | "awaiting_payment"
  | "awaiting_receipt"
  | "payment_under_review"
  | "confirmed"
  | "processing"
  | "ready_for_pickup"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type InvoiceStatus = "draft" | "issued" | "sent" | "paid" | "void";
export type ShipmentStatus = "draft" | "ready" | "in_transit" | "delivered" | "failed";
export type PaymentMethod = "card_to_card" | "manual_receipt";
export type ShippingMethodCode = "tipax" | "tehran_courier" | "pickup";

export interface Money {
  amountRial: number;
  currency: "IRR";
}

export interface StoreSettings {
  id: "store";
  brandName: string;
  ownerName: string;
  phone: string;
  address: string;
  telegramUrl: string;
  legalNotice: string;
  workingHours: string;
}

export interface Brand {
  id: string;
  nameFa: string;
  slug: string;
}

export interface Category {
  id: string;
  nameFa: string;
  slug: ProductCategorySlug;
  descriptionFa: string;
  seoTitle: string;
  seoDescription: string;
}

export interface ProductAttribute {
  nameFa: string;
  valueFa: string;
  technicalValue?: string;
}

export type ProductKind =
  | "disposable"
  | "pod-device"
  | "vape-device"
  | "salt-nicotine"
  | "e-liquid"
  | "coil"
  | "cartridge"
  | "accessory";

export interface ProductSpec {
  labelFa: string;
  valueFa: string;
  technicalValue?: string;
}

export interface Product {
  id: string;
  slug: string;
  nameFa: string;
  nameEn?: string;
  brandId: string;
  categoryId: string;
  productKind?: ProductKind;
  salesChannels?: SalesChannel[];
  shortDescriptionFa: string;
  descriptionFa: string;
  image: string;
  images: string[];
  tags: string[];
  attributes: ProductAttribute[];
  specs?: ProductSpec[];
  highlightsFa?: string[];
  packageItemsFa?: string[];
  sourceNoteFa?: string;
  adminNotesFa?: string;
  isActive: boolean;
  isAgeRestricted: boolean;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  nameFa: string;
  sku: string;
  barcode?: string;
  retailPriceRial: number;
  wholesalePriceRial: number;
  compareAtPriceRial?: number;
  cartonSize: number;
  minWholesaleCartonCount: number;
  wholesaleEnabled?: boolean;
  attributes: ProductAttribute[];
  isActive: boolean;
}

export interface CompatibilityGroup {
  id: string;
  nameFa: string;
  productIds: string[];
  variantIds: string[];
  noteFa: string;
}

export interface InventoryItem {
  id: string;
  variantId: string;
  onHand: number;
  reserved: number;
  preorderEnabled: boolean;
  restockThreshold: number;
  updatedAt: string;
}

export interface InventoryReservation {
  id: string;
  variantId: string;
  quantity: number;
  channel: SalesChannel;
  cartId?: string;
  orderId?: string;
  expiresAt: string;
}

export interface OrderItemSnapshot {
  productName: string;
  variantName: string;
  sku: string;
  image: string;
  selectedAttributes: ProductAttribute[];
  pricingMode: SalesChannel;
  unitPriceRial: number;
  quantity: number;
  cartonSize?: number;
  cartonCount?: number;
  discountRial: number;
  totalRial: number;
}

export interface OrderEvent {
  id: string;
  orderId: string;
  type: string;
  actorId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  channel: SalesChannel;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  subtotalRial: number;
  discountRial: number;
  shippingRial: number;
  totalRial: number;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethodCode;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  status: InvoiceStatus;
  secureTokenHash: string;
  totalRial: number;
  issuedAt: string;
  expiresAt: string;
}

export interface ShippingAddress {
  province: string;
  city: string;
  line1: string;
  postalCode?: string;
  receiverName: string;
  receiverPhone: string;
}

export interface ShippingQuote {
  method: ShippingMethodCode;
  titleFa: string;
  costRial: number;
  etaFa: string;
  available: boolean;
  reasonFa?: string;
}

export interface User {
  id: string;
  phone: string;
  fullName?: string;
  roles: UserRole[];
  createdAt: string;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  city: string;
  status: "pending" | "approved" | "rejected";
  minOrderNoteFa: string;
}

export interface AnalyticsEvent {
  name:
    | "view_item"
    | "view_category"
    | "search"
    | "add_to_cart"
    | "remove_from_cart"
    | "begin_checkout"
    | "purchase"
    | "wholesale_registration"
    | "wholesale_add_to_cart"
    | "invoice_created"
    | "invoice_sent"
    | "preorder_created"
    | "restock_notified"
    | "chat_started"
    | "shipping_method_selected";
  channel: SalesChannel;
  properties: Record<string, string | number | boolean | null>;
  createdAt: string;
}
