import { MongoClient, type Db, type IndexDescription } from "mongodb";
import { seedData } from "@ufo/domain";
import type {
  InventoryItem,
  Product,
  ProductFlavor,
  ProductVariant,
  StoreSettings,
} from "@ufo/types";

export const collectionNames = [
  "users",
  "userAddresses",
  "businessProfiles",
  "roles",
  "sessions",
  "otpChallenges",
  "products",
  "productFlavors",
  "productVariants",
  "brands",
  "categories",
  "compatibilityGroups",
  "inventoryItems",
  "inventoryTransactions",
  "inventoryReservations",
  "restockEvents",
  "carts",
  "orders",
  "orderEvents",
  "payments",
  "paymentReceipts",
  "shipments",
  "shipmentEvents",
  "shippingMethods",
  "shippingRateRules",
  "invoices",
  "invoiceEvents",
  "invoiceDeliveries",
  "preorders",
  "restockSubscriptions",
  "notificationDeliveries",
  "coupons",
  "reviews",
  "chatConversations",
  "chatMessages",
  "blogPosts",
  "pages",
  "redirects",
  "notifications",
  "auditLogs",
  "settings",
] as const;

export type CollectionName = (typeof collectionNames)[number];

export const databaseIndexes: Record<CollectionName, IndexDescription[]> = {
  users: [{ key: { phone: 1 }, unique: true }],
  userAddresses: [{ key: { userId: 1 } }],
  businessProfiles: [{ key: { userId: 1 }, unique: true }, { key: { status: 1, city: 1 } }],
  roles: [{ key: { name: 1 }, unique: true }],
  sessions: [
    { key: { userId: 1, expiresAt: 1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  otpChallenges: [
    { key: { phone: 1, createdAt: -1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  products: [
    { key: { slug: 1 }, unique: true },
    { key: { categoryId: 1, isActive: 1 } },
    { key: { variantType: 1 } },
    { key: { nameFa: "text", tags: "text" } },
  ],
  productFlavors: [{ key: { slug: 1 }, unique: true }],
  productVariants: [{ key: { sku: 1 }, unique: true }, { key: { productId: 1, isActive: 1 } }],
  brands: [{ key: { slug: 1 }, unique: true }],
  categories: [{ key: { slug: 1 }, unique: true }],
  compatibilityGroups: [{ key: { productIds: 1 } }, { key: { variantIds: 1 } }],
  inventoryItems: [{ key: { variantId: 1 }, unique: true }, { key: { restockThreshold: 1 } }],
  inventoryTransactions: [{ key: { variantId: 1, createdAt: -1 } }],
  inventoryReservations: [
    { key: { variantId: 1, expiresAt: 1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  restockEvents: [{ key: { variantId: 1, createdAt: -1 } }],
  carts: [{ key: { userId: 1, channel: 1 } }, { key: { updatedAt: -1 } }],
  orders: [
    { key: { orderNumber: 1 }, unique: true },
    { key: { userId: 1, createdAt: -1 } },
    { key: { channel: 1, status: 1, createdAt: -1 } },
  ],
  orderEvents: [{ key: { orderId: 1, createdAt: -1 } }],
  payments: [{ key: { orderId: 1 } }, { key: { status: 1, createdAt: -1 } }],
  paymentReceipts: [{ key: { orderId: 1 } }, { key: { uploadedBy: 1, createdAt: -1 } }],
  shipments: [{ key: { orderId: 1 } }, { key: { trackingCode: 1 } }],
  shipmentEvents: [{ key: { shipmentId: 1, createdAt: -1 } }],
  shippingMethods: [{ key: { code: 1 }, unique: true }],
  shippingRateRules: [{ key: { methodCode: 1, city: 1 } }],
  invoices: [
    { key: { invoiceNumber: 1 }, unique: true },
    { key: { orderId: 1 } },
    { key: { secureTokenHash: 1 }, unique: true },
  ],
  invoiceEvents: [{ key: { invoiceId: 1, createdAt: -1 } }],
  invoiceDeliveries: [{ key: { invoiceId: 1, createdAt: -1 } }],
  preorders: [{ key: { userId: 1, status: 1 } }, { key: { variantId: 1, createdAt: -1 } }],
  restockSubscriptions: [{ key: { variantId: 1, phone: 1 }, unique: true }],
  notificationDeliveries: [{ key: { channel: 1, createdAt: -1 } }],
  coupons: [{ key: { code: 1 }, unique: true }],
  reviews: [
    { key: { productId: 1, status: 1, createdAt: -1 } },
    { key: { orderId: 1, userId: 1 } },
  ],
  chatConversations: [{ key: { userId: 1, updatedAt: -1 } }],
  chatMessages: [{ key: { conversationId: 1, createdAt: 1 } }],
  blogPosts: [{ key: { slug: 1 }, unique: true }, { key: { status: 1, publishedAt: -1 } }],
  pages: [{ key: { slug: 1 }, unique: true }],
  redirects: [{ key: { source: 1 }, unique: true }],
  notifications: [{ key: { userId: 1, readAt: 1 } }],
  auditLogs: [{ key: { actorId: 1, createdAt: -1 } }, { key: { entityType: 1, entityId: 1 } }],
  settings: [{ key: { id: 1 }, unique: true }],
};

const globalForMongo = globalThis as typeof globalThis & {
  __ufoMongoClientPromise?: Promise<MongoClient>;
};

export function hasUsableMongoUri(uri = process.env.MONGODB_URI): uri is string {
  const value = uri?.trim();
  if (!value) return false;
  if (value.includes("USER:PASSWORD") || value.includes("HOST:PORT")) return false;
  return /^mongodb(\+srv)?:\/\//i.test(value);
}

export async function getMongoClient(uri = process.env.MONGODB_URI): Promise<MongoClient> {
  if (!hasUsableMongoUri(uri)) {
    throw new Error("MONGODB_URI تنظیم نشده یا معتبر نیست.");
  }
  if (!globalForMongo.__ufoMongoClientPromise) {
    globalForMongo.__ufoMongoClientPromise = new MongoClient(uri).connect();
  }
  return globalForMongo.__ufoMongoClientPromise;
}

export async function getDb(
  uri = process.env.MONGODB_URI,
  dbName = process.env.MONGODB_DB_NAME ?? "my-app",
): Promise<Db> {
  const client = await getMongoClient(uri);
  return client.db(dbName);
}

export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all(
    collectionNames.map(async (name) => {
      const indexes = databaseIndexes[name];
      if (indexes.length > 0) {
        await db.collection(name).createIndexes(indexes);
      }
    }),
  );
}

export interface ProductRepository {
  listProducts(): Promise<Product[]>;
  findProductBySlug(slug: string): Promise<Product | null>;
  listVariants(productId: string): Promise<ProductVariant[]>;
  getInventory(variantId: string): Promise<InventoryItem | null>;
}

export interface SettingsRepository {
  getStoreSettings(): Promise<StoreSettings>;
  saveStoreSettings(settings: StoreSettings): Promise<void>;
}

export class MongoProductRepository implements ProductRepository {
  constructor(private readonly db: Db) {}

  async listProducts(): Promise<Product[]> {
    return this.db
      .collection<Product>("products")
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async findProductBySlug(slug: string): Promise<Product | null> {
    return this.db.collection<Product>("products").findOne({ slug, isActive: true });
  }

  async listVariants(productId: string): Promise<ProductVariant[]> {
    return this.db
      .collection<ProductVariant>("productVariants")
      .find({ productId, isActive: true })
      .toArray();
  }

  async getInventory(variantId: string): Promise<InventoryItem | null> {
    return this.db.collection<InventoryItem>("inventoryItems").findOne({ variantId });
  }
}

export class MemoryProductRepository implements ProductRepository {
  async listProducts(): Promise<Product[]> {
    return seedData.products;
  }

  async findProductBySlug(slug: string): Promise<Product | null> {
    return seedData.products.find((product) => product.slug === slug) ?? null;
  }

  async listVariants(productId: string): Promise<ProductVariant[]> {
    return seedData.variants.filter((variant) => variant.productId === productId);
  }

  async getInventory(variantId: string): Promise<InventoryItem | null> {
    return seedData.inventoryItems.find((item) => item.variantId === variantId) ?? null;
  }
}

export class MongoSettingsRepository implements SettingsRepository {
  constructor(private readonly db: Db) {}

  async getStoreSettings(): Promise<StoreSettings> {
    const settings = await this.db.collection<StoreSettings>("settings").findOne({ id: "store" });
    return settings ?? seedData.storeSettings;
  }

  async saveStoreSettings(settings: StoreSettings): Promise<void> {
    await this.db
      .collection<StoreSettings>("settings")
      .updateOne({ id: "store" }, { $set: settings }, { upsert: true });
  }
}

export async function createRepositories(): Promise<{
  products: ProductRepository;
  settings: SettingsRepository;
}> {
  if (!hasUsableMongoUri()) {
    return {
      products: new MemoryProductRepository(),
      settings: {
        async getStoreSettings() {
          return seedData.storeSettings;
        },
        async saveStoreSettings(_settings: StoreSettings) {
          return undefined;
        },
      },
    };
  }

  const db = await getDb();
  return {
    products: new MongoProductRepository(db),
    settings: new MongoSettingsRepository(db),
  };
}

export async function seedDatabase(db: Db): Promise<void> {
  await ensureIndexes(db);
  await db
    .collection("settings")
    .updateOne({ id: "store" }, { $set: seedData.storeSettings }, { upsert: true });
  await db
    .collection("categories")
    .deleteMany({ id: { $in: seedData.categories.map((item) => item.id) } });
  await db.collection("brands").deleteMany({ id: { $in: seedData.brands.map((item) => item.id) } });
  await db
    .collection("products")
    .deleteMany({ id: { $in: seedData.products.map((item) => item.id) } });
  await db
    .collection("productFlavors")
    .deleteMany({ id: { $in: seedData.productFlavors.map((item) => item.id) } });
  await db
    .collection("productVariants")
    .deleteMany({ id: { $in: seedData.variants.map((item) => item.id) } });
  await db
    .collection("inventoryItems")
    .deleteMany({ id: { $in: seedData.inventoryItems.map((item) => item.id) } });
  await db
    .collection("compatibilityGroups")
    .deleteMany({ id: { $in: seedData.compatibilityGroups.map((item) => item.id) } });
  await db.collection("categories").insertMany(seedData.categories);
  await db.collection("brands").insertMany(seedData.brands);
  await db.collection("products").insertMany(seedData.products);
  await db.collection<ProductFlavor>("productFlavors").insertMany(seedData.productFlavors);
  await db.collection("productVariants").insertMany(seedData.variants);
  await db.collection("inventoryItems").insertMany(seedData.inventoryItems);
  await db.collection("compatibilityGroups").insertMany(seedData.compatibilityGroups);
}
