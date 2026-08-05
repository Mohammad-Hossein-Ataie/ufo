import type {
  Brand,
  Category,
  CompatibilityGroup,
  InventoryItem,
  InventoryReservation,
  Invoice,
  Order,
  OrderItemSnapshot,
  Product,
  ProductVariant,
  SalesChannel,
  ShippingAddress,
  ShippingQuote,
  StoreSettings
} from "@ufo/types";
import { defaultStoreSettings } from "@ufo/config";
import { isTehran, normalizeIranPhone, toPersianDigits } from "@ufo/validation";
import { importedBrands, importedInventoryItems, importedProducts, importedVariants } from "./imported-products";

export const storeSettings: StoreSettings = defaultStoreSettings;

export const categories: Category[] = [
  {
    id: "cat-pod",
    nameFa: "پاد",
    slug: "pod",
    descriptionFa: "دستگاه‌های پاد سیستم برای مصرف روزمره با انتخاب دقیق کارتریج.",
    seoTitle: "خرید پاد با ضمانت اصالت | UFO Puff",
    seoDescription: "کاتالوگ پاد با موجودی و قیمت به‌روز برای خرید تکی و عمده."
  },
  {
    id: "cat-vape",
    nameFa: "ویپ",
    slug: "vape",
    descriptionFa: "ویپ و ماد برای کاربران باتجربه با مشخصات فنی شفاف.",
    seoTitle: "خرید ویپ در تهران | UFO Puff",
    seoDescription: "ویپ، ماد و لوازم سازگار با ارسال تیپاکس و پیک تهران."
  },
  {
    id: "cat-disposable",
    nameFa: "پاد یک‌بارمصرف",
    slug: "disposable",
    descriptionFa: "پادهای یک‌بارمصرف منتخب با موجودی قابل اتکا.",
    seoTitle: "خرید پاد یک‌بارمصرف | UFO Puff",
    seoDescription: "قیمت و موجودی پاد یک‌بارمصرف برای مصرف‌کننده و همکار."
  },
  {
    id: "cat-eliquid",
    nameFa: "جویس",
    slug: "e-liquid",
    descriptionFa: "جویس و سالت نیکوتین با دسته‌بندی طعم و نیکوتین.",
    seoTitle: "خرید جویس و سالت | UFO Puff",
    seoDescription: "جویس، سالت نیکوتین و مایعات منتخب با توضیحات فارسی."
  },
  {
    id: "cat-salt-nicotine",
    nameFa: "سالت نیکوتین",
    slug: "salt-nicotine",
    descriptionFa: "سالت نیکوتین‌های وارداتی با برند، طعم و قیمت دقیق.",
    seoTitle: "خرید سالت نیکوتین | UFO Puff",
    seoDescription: "کاتالوگ سالت نیکوتین با قیمت تک‌فروشی، برند و توضیحات فارسی."
  },
  {
    id: "cat-coil",
    nameFa: "کویل",
    slug: "coil",
    descriptionFa: "کویل‌های سازگار با دستگاه‌ها و کارتریج‌های پرفروش.",
    seoTitle: "خرید کویل ویپ | UFO Puff",
    seoDescription: "کویل‌های سازگار با دستگاه‌های رایج، همراه با راهنمای سازگاری."
  },
  {
    id: "cat-cartridge",
    nameFa: "کارتریج",
    slug: "cartridge",
    descriptionFa: "کارتریج پاد با سازگاری مشخص و موجودی قابل کنترل.",
    seoTitle: "خرید کارتریج پاد | UFO Puff",
    seoDescription: "کارتریج‌های پاد با مشخصات سازگاری برای جلوگیری از خرید اشتباه."
  },
  {
    id: "cat-lighter",
    nameFa: "فندک",
    slug: "lighter",
    descriptionFa: "فندک و اکسسوری فروشگاهی برای خرید تکی و عمده.",
    seoTitle: "خرید فندک و اکسسوری | UFO Puff",
    seoDescription: "فندک و لوازم جانبی با سفارش سریع برای خریداران عمده."
  }
];

export const brands: Brand[] = [
  { id: "brand-ufo", nameFa: "UFO Selection", slug: "ufo-selection" },
  { id: "brand-orbit", nameFa: "Orbit Lab", slug: "orbit-lab" },
  { id: "brand-neon", nameFa: "Neon Cloud", slug: "neon-cloud" },
  ...importedBrands
];

const now = new Date("2026-08-02T00:00:00.000Z").toISOString();

const baseProducts: Product[] = [
  {
    id: "prod-nebula-pod",
    slug: "nebula-pod-kit",
    nameFa: "کیت پاد Nebula",
    brandId: "brand-ufo",
    categoryId: "cat-pod",
    shortDescriptionFa: "پاد خوش‌دست با کارتریج قابل تعویض و کام‌دهی نرم.",
    descriptionFa:
      "Nebula برای مصرف روزمره طراحی شده و با کارتریج‌های سازگار UFO Selection عرضه می‌شود.",
    image: "/images/ufo-hero.png",
    images: ["/images/ufo-hero.png"],
    tags: ["پاد", "کارتریج", "روزمره"],
    attributes: [
      { nameFa: "توان", valueFa: "۱۸ وات", technicalValue: "18W" },
      { nameFa: "باتری", valueFa: "۸۰۰ میلی‌آمپر", technicalValue: "800mAh" }
    ],
    isActive: true,
    isAgeRestricted: true,
    seoTitle: "خرید کیت پاد Nebula | UFO Puff",
    seoDescription: "کیت پاد Nebula با موجودی به‌روز، مناسب خرید تکی و همکاری.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "prod-comet-disposable",
    slug: "comet-disposable-6000",
    nameFa: "پاد یک‌بارمصرف Comet 6000",
    brandId: "brand-neon",
    categoryId: "cat-disposable",
    shortDescriptionFa: "یک‌بارمصرف سبک با طعم‌های منتخب و بسته‌بندی مناسب عمده.",
    descriptionFa: "Comet 6000 برای فروش سریع فروشگاهی و سفارش‌های تعدادی مناسب است.",
    image: "/images/ufo-hero.png",
    images: ["/images/ufo-hero.png"],
    tags: ["یک‌بارمصرف", "عمده", "پرفروش"],
    attributes: [
      { nameFa: "پاف", valueFa: "۶۰۰۰", technicalValue: "6000" },
      { nameFa: "ظرفیت", valueFa: "۱۴ میلی‌لیتر", technicalValue: "14ml" }
    ],
    isActive: true,
    isAgeRestricted: true,
    seoTitle: "خرید پاد یک‌بارمصرف Comet 6000 | UFO Puff",
    seoDescription: "پاد یک‌بارمصرف Comet 6000 با قیمت همکاری و موجودی قابل رزرو.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "prod-orbit-coil",
    slug: "orbit-mesh-coil",
    nameFa: "کویل مش Orbit",
    brandId: "brand-orbit",
    categoryId: "cat-coil",
    shortDescriptionFa: "کویل مش سازگار با دستگاه‌های Orbit و سری Nebula.",
    descriptionFa: "کویل Orbit با راهنمای سازگاری برای کاهش خطای خرید عرضه می‌شود.",
    image: "/images/ufo-hero.png",
    images: ["/images/ufo-hero.png"],
    tags: ["کویل", "سازگاری", "مصرفی"],
    attributes: [
      { nameFa: "اهم", valueFa: "۰.۸", technicalValue: "0.8ohm" },
      { nameFa: "بسته", valueFa: "۵ عددی", technicalValue: "5pcs" }
    ],
    isActive: true,
    isAgeRestricted: true,
    seoTitle: "خرید کویل مش Orbit | UFO Puff",
    seoDescription: "کویل مش Orbit با مشخصات فنی و راهنمای سازگاری فارسی.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "prod-salt-mint",
    slug: "mint-salt-30ml",
    nameFa: "سالت نیکوتین Mint 30ml",
    brandId: "brand-ufo",
    categoryId: "cat-eliquid",
    shortDescriptionFa: "سالت نیکوتین با طعم نعناع خنک و توضیحات شفاف.",
    descriptionFa:
      "این محصول حاوی نیکوتین است و فقط برای افراد بزرگسال عرضه می‌شود. هیچ ادعای درمانی ندارد.",
    image: "/images/ufo-hero.png",
    images: ["/images/ufo-hero.png"],
    tags: ["سالت", "نعناع", "۳۰ میل"],
    attributes: [
      { nameFa: "حجم", valueFa: "۳۰ میلی‌لیتر", technicalValue: "30ml" },
      { nameFa: "نیکوتین", valueFa: "۲۵ میلی‌گرم", technicalValue: "25mg" }
    ],
    isActive: true,
    isAgeRestricted: true,
    seoTitle: "خرید سالت نیکوتین نعناع | UFO Puff",
    seoDescription: "سالت نیکوتین ۳۰ میلی‌لیتر با نمایش دقیق مشخصات و هشدار قانونی.",
    createdAt: now,
    updatedAt: now
  }
];

export const products: Product[] = [...baseProducts, ...importedProducts];

const baseVariants: ProductVariant[] = [
  {
    id: "var-nebula-black",
    productId: "prod-nebula-pod",
    nameFa: "مشکی",
    sku: "UFO-NEB-POD-BLK",
    retailPriceRial: 12_500_000,
    wholesalePriceRial: 10_600_000,
    compareAtPriceRial: 13_500_000,
    cartonSize: 12,
    minWholesaleCartonCount: 2,
    attributes: [{ nameFa: "رنگ", valueFa: "مشکی", technicalValue: "Black" }],
    isActive: true
  },
  {
    id: "var-comet-blueberry",
    productId: "prod-comet-disposable",
    nameFa: "بلوبری آیس",
    sku: "NEON-COMET-6000-BBI",
    retailPriceRial: 7_400_000,
    wholesalePriceRial: 6_250_000,
    cartonSize: 20,
    minWholesaleCartonCount: 3,
    attributes: [{ nameFa: "طعم", valueFa: "بلوبری آیس", technicalValue: "Blueberry Ice" }],
    isActive: true
  },
  {
    id: "var-orbit-08",
    productId: "prod-orbit-coil",
    nameFa: "۰.۸ اهم",
    sku: "ORB-MESH-08-5PK",
    retailPriceRial: 3_100_000,
    wholesalePriceRial: 2_700_000,
    cartonSize: 10,
    minWholesaleCartonCount: 2,
    attributes: [{ nameFa: "مقاومت", valueFa: "۰.۸ اهم", technicalValue: "0.8ohm" }],
    isActive: true
  },
  {
    id: "var-mint-25mg",
    productId: "prod-salt-mint",
    nameFa: "۲۵ میلی‌گرم",
    sku: "UFO-SALT-MINT-25",
    retailPriceRial: 4_900_000,
    wholesalePriceRial: 4_100_000,
    cartonSize: 10,
    minWholesaleCartonCount: 4,
    attributes: [{ nameFa: "نیکوتین", valueFa: "۲۵ میلی‌گرم", technicalValue: "25mg" }],
    isActive: true
  }
];

export const variants: ProductVariant[] = [...baseVariants, ...importedVariants];

const baseInventoryItems: InventoryItem[] = [
  {
    id: "inv-nebula-black",
    variantId: "var-nebula-black",
    onHand: 42,
    reserved: 4,
    preorderEnabled: true,
    restockThreshold: 8,
    updatedAt: now
  },
  {
    id: "inv-comet-blueberry",
    variantId: "var-comet-blueberry",
    onHand: 160,
    reserved: 20,
    preorderEnabled: true,
    restockThreshold: 30,
    updatedAt: now
  },
  {
    id: "inv-orbit-08",
    variantId: "var-orbit-08",
    onHand: 0,
    reserved: 0,
    preorderEnabled: true,
    restockThreshold: 10,
    updatedAt: now
  },
  {
    id: "inv-mint-25mg",
    variantId: "var-mint-25mg",
    onHand: 28,
    reserved: 3,
    preorderEnabled: false,
    restockThreshold: 12,
    updatedAt: now
  }
];

export const inventoryItems: InventoryItem[] = [...baseInventoryItems, ...importedInventoryItems];

export const compatibilityGroups: CompatibilityGroup[] = [
  {
    id: "compat-nebula-orbit",
    nameFa: "سازگاری Nebula و Orbit",
    productIds: ["prod-nebula-pod", "prod-orbit-coil"],
    variantIds: ["var-nebula-black", "var-orbit-08"],
    noteFa: "کویل Orbit 0.8 برای کارتریج‌های سری Nebula مناسب است."
  }
];

export function findProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug && product.isActive);
}

export function getProductVariants(productId: string): ProductVariant[] {
  return variants.filter((variant) => variant.productId === productId && variant.isActive);
}

export function getPrimaryVariant(productId: string): ProductVariant {
  const variant = getProductVariants(productId)[0];
  if (!variant) throw new Error("برای این محصول واریانت فعالی وجود ندارد.");
  return variant;
}

export function getInventoryByVariant(variantId: string): InventoryItem | undefined {
  return inventoryItems.find((item) => item.variantId === variantId);
}

export function getAvailableStock(item: InventoryItem): number {
  return Math.max(0, item.onHand - item.reserved);
}

export function assertMoneyRial(value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("مقدار ریالی باید عدد صحیح و غیرمنفی باشد.");
  }
}

export function rialToToman(valueRial: number): number {
  assertMoneyRial(valueRial);
  return Math.round(valueRial / 10);
}

export function formatToman(valueRial: number): string {
  return `${toPersianDigits(new Intl.NumberFormat("fa-IR").format(rialToToman(valueRial)))} تومان`;
}

export function getUnitPriceRial(variant: ProductVariant, channel: SalesChannel): number {
  if (channel === "wholesale" && variant.wholesaleEnabled === false) {
    throw new Error("قیمت همکاری برای این واریانت هنوز فعال نشده است.");
  }
  return channel === "wholesale" ? variant.wholesalePriceRial : variant.retailPriceRial;
}

export function calculateCartonQuantity(variant: ProductVariant, cartonCount: number): number {
  if (!Number.isInteger(cartonCount) || cartonCount <= 0) {
    throw new Error("تعداد کارتن باید عدد صحیح و مثبت باشد.");
  }
  return cartonCount * variant.cartonSize;
}

export function validateWholesaleCartonCount(
  variant: ProductVariant,
  cartonCount: number,
): { quantity: number; minCartonCount: number } {
  if (cartonCount < variant.minWholesaleCartonCount) {
    throw new Error(
      `حداقل سفارش عمده برای این واریانت ${toPersianDigits(
        variant.minWholesaleCartonCount,
      )} کارتن است.`,
    );
  }
  return {
    quantity: calculateCartonQuantity(variant, cartonCount),
    minCartonCount: variant.minWholesaleCartonCount
  };
}

export function createOrderItemSnapshot(args: {
  product: Product;
  variant: ProductVariant;
  channel: SalesChannel;
  quantity?: number;
  cartonCount?: number;
  discountRial?: number;
}): OrderItemSnapshot {
  const discountRial = args.discountRial ?? 0;
  const quantity =
    args.channel === "wholesale"
      ? validateWholesaleCartonCount(args.variant, args.cartonCount ?? 0).quantity
      : args.quantity ?? 1;
  const unitPriceRial = getUnitPriceRial(args.variant, args.channel);
  const totalRial = unitPriceRial * quantity - discountRial;
  assertMoneyRial(totalRial);

  return {
    productName: args.product.nameFa,
    variantName: args.variant.nameFa,
    sku: args.variant.sku,
    image: args.product.image,
    selectedAttributes: args.variant.attributes,
    pricingMode: args.channel,
    unitPriceRial,
    quantity,
    ...(args.channel === "wholesale" ? { cartonSize: args.variant.cartonSize } : {}),
    ...(args.channel === "wholesale" && args.cartonCount ? { cartonCount: args.cartonCount } : {}),
    discountRial,
    totalRial
  };
}

export function calculateOrderTotals(items: OrderItemSnapshot[], shippingRial = 0): {
  subtotalRial: number;
  discountRial: number;
  totalRial: number;
} {
  const subtotalRial = items.reduce(
    (sum, item) => sum + item.unitPriceRial * item.quantity,
    0,
  );
  const discountRial = items.reduce((sum, item) => sum + item.discountRial, 0);
  const totalRial = subtotalRial - discountRial + shippingRial;
  return { subtotalRial, discountRial, totalRial };
}

export function reserveInventory(args: {
  item: InventoryItem;
  quantity: number;
  channel: SalesChannel;
  cartId?: string;
  orderId?: string;
  now?: Date;
}): { item: InventoryItem; reservation: InventoryReservation } {
  if (args.quantity <= 0 || !Number.isInteger(args.quantity)) {
    throw new Error("تعداد رزرو باید عدد صحیح و مثبت باشد.");
  }

  const available = getAvailableStock(args.item);
  if (available < args.quantity) {
    throw new Error("موجودی کافی نیست و از oversell جلوگیری شد.");
  }

  const nowDate = args.now ?? new Date();
  const expiresAt = new Date(nowDate.getTime() + 15 * 60 * 1000).toISOString();

  const reservation: InventoryReservation = {
    id: `res_${args.item.variantId}_${nowDate.getTime()}`,
    variantId: args.item.variantId,
    quantity: args.quantity,
    channel: args.channel,
    ...(args.cartId ? { cartId: args.cartId } : {}),
    ...(args.orderId ? { orderId: args.orderId } : {}),
    expiresAt
  };

  return {
    item: {
      ...args.item,
      reserved: args.item.reserved + args.quantity,
      updatedAt: nowDate.toISOString()
    },
    reservation
  };
}

export function releaseReservation(
  item: InventoryItem,
  reservation: InventoryReservation,
  nowDate = new Date(),
): InventoryItem {
  return {
    ...item,
    reserved: Math.max(0, item.reserved - reservation.quantity),
    updatedAt: nowDate.toISOString()
  };
}

export function createOrderNumber(channel: SalesChannel, sequence: number, date = new Date()): string {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = channel === "wholesale" ? "B2B" : "RTL";
  return `${prefix}-${ymd}-${String(sequence).padStart(5, "0")}`;
}

export function createOrder(args: {
  id: string;
  channel: SalesChannel;
  items: OrderItemSnapshot[];
  sequence: number;
  userId?: string;
  shippingRial?: number;
  paymentMethod?: "card_to_card" | "manual_receipt";
  shippingMethod?: "tipax" | "tehran_courier" | "pickup";
  now?: Date;
}): Order {
  const nowDate = args.now ?? new Date();
  const shippingRial = args.shippingRial ?? 0;
  const totals = calculateOrderTotals(args.items, shippingRial);

  return {
    id: args.id,
    orderNumber: createOrderNumber(args.channel, args.sequence, nowDate),
    ...(args.userId ? { userId: args.userId } : {}),
    channel: args.channel,
    status: "awaiting_payment",
    items: args.items,
    subtotalRial: totals.subtotalRial,
    discountRial: totals.discountRial,
    shippingRial,
    totalRial: totals.totalRial,
    paymentMethod: args.paymentMethod ?? "card_to_card",
    shippingMethod: args.shippingMethod ?? "tipax",
    createdAt: nowDate.toISOString(),
    updatedAt: nowDate.toISOString()
  };
}

export function quoteShipping(address: ShippingAddress, method: "tipax" | "tehran_courier" | "pickup"): ShippingQuote {
  const phone = normalizeIranPhone(address.receiverPhone);
  const receiverName = address.receiverName.trim();
  if (!receiverName || !phone) throw new Error("اطلاعات گیرنده کامل نیست.");

  if (method === "pickup") {
    return {
      method,
      titleFa: "تحویل حضوری",
      costRial: 0,
      etaFa: "هماهنگی همان روز",
      available: true
    };
  }

  if (method === "tehran_courier") {
    const available = isTehran(address.city, address.province);
    return {
      method,
      titleFa: "پیک تهران",
      costRial: available ? 950_000 : 0,
      etaFa: available ? "همان روز یا روز کاری بعد" : "فقط برای تهران فعال است",
      available,
      ...(available ? {} : { reasonFa: "پیک فقط برای شهر تهران قابل انتخاب است." })
    };
  }

  return {
    method,
    titleFa: "تیپاکس",
    costRial: 1_650_000,
    etaFa: "۲ تا ۴ روز کاری",
    available: true
  };
}

export function createInvoice(args: {
  id: string;
  order: Order;
  sequence: number;
  secureTokenHash: string;
  now?: Date;
}): Invoice {
  const nowDate = args.now ?? new Date();
  const expiresAt = new Date(nowDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: args.id,
    invoiceNumber: `INV-${nowDate.toISOString().slice(0, 10).replace(/-/g, "")}-${String(
      args.sequence,
    ).padStart(5, "0")}`,
    orderId: args.order.id,
    status: "issued",
    secureTokenHash: args.secureTokenHash,
    totalRial: args.order.totalRial,
    issuedAt: nowDate.toISOString(),
    expiresAt
  };
}

export function searchProducts(query: string): Product[] {
  const normalizedQuery = query.trim().toLowerCase();
  const activeProducts = products.filter((product) => product.isActive);
  if (!normalizedQuery) return activeProducts;
  return activeProducts.filter((product) =>
    [product.nameFa, product.shortDescriptionFa, product.slug, ...product.tags]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export const seedData = {
  storeSettings,
  categories,
  brands,
  products,
  variants,
  inventoryItems,
  compatibilityGroups
};
