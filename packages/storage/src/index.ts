import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StoredFile {
  key: string;
  size?: number;
  contentType?: string;
  lastModified?: string;
}

export interface UploadObjectInput {
  key: string;
  body: Uint8Array;
  contentType: string;
}

export interface StorageProvider {
  upload(input: UploadObjectInput): Promise<StoredFile>;
  list(prefix?: string): Promise<StoredFile[]>;
  presignGet(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
  listBuckets(): Promise<string[]>;
}

export interface LiaraStorageConfig {
  endpoint: string;
  bucketName: string;
  accessKey: string;
  secretKey: string;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

export function getPublicObjectUrl(
  key: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const publicBaseUrl = env.LIARA_PUBLIC_BASE_URL?.trim();
  if (!publicBaseUrl) return undefined;
  return `${trimTrailingSlash(publicBaseUrl)}/${key.replace(/^\/+/, "")}`;
}

export function rewriteLiaraPublicUrl(
  value: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const publicBaseUrl = env.LIARA_PUBLIC_BASE_URL?.trim();
  const bucketName = env.LIARA_BUCKET_NAME?.trim();
  if (!publicBaseUrl || !bucketName) return value;

  let source: URL;
  let target: URL;
  try {
    source = new URL(value);
    target = new URL(publicBaseUrl);
  } catch {
    return value;
  }

  const liaraHostnames = new Set([
    "storage.c2.liara.space",
    "storage.c2.liara.site",
    "storage.iran.liara.space",
    "storage.iran.liara.site",
    `${bucketName}.storage.iran.liara.space`,
    `${bucketName}.storage.iran.liara.site`,
    `${bucketName}.storage.c2.liara.space`,
    `${bucketName}.storage.c2.liara.site`,
  ]);
  if (!liaraHostnames.has(source.hostname)) return value;

  const bucketPrefix = `/${bucketName}/`;
  const keyPath = source.pathname.startsWith(bucketPrefix)
    ? source.pathname.slice(bucketPrefix.length)
    : source.pathname.replace(/^\/+/, "");
  if (!keyPath) return value;

  const rewritten = new URL(`${trimTrailingSlash(target.toString())}/${keyPath}`);
  rewritten.search = source.search;
  return rewritten.toString();
}

export function createS3Client(config: LiaraStorageConfig): S3Client {
  return new S3Client({
    region: "default",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true,
  });
}

export class LiaraStorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor(private readonly config: LiaraStorageConfig) {
    this.client = createS3Client(config);
  }

  async upload(input: UploadObjectInput): Promise<StoredFile> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    return { key: input.key, size: input.body.byteLength, contentType: input.contentType };
  }

  async list(prefix?: string): Promise<StoredFile[]> {
    const data = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        ...(prefix ? { Prefix: prefix } : {}),
      }),
    );
    return (data.Contents ?? []).map((file) => ({
      key: file.Key ?? "",
      ...(typeof file.Size === "number" ? { size: file.Size } : {}),
      ...(file.LastModified ? { lastModified: file.LastModified.toISOString() } : {}),
    }));
  }

  async presignGet(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.config.bucketName, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucketName, Key: key }));
  }

  async listBuckets(): Promise<string[]> {
    const data = await this.client.send(new ListBucketsCommand({}));
    return (data.Buckets ?? []).map((bucket) => bucket.Name ?? "").filter(Boolean);
  }
}

export class MemoryStorageProvider implements StorageProvider {
  private readonly files = new Map<string, StoredFile & { body: Uint8Array }>();

  async upload(input: UploadObjectInput): Promise<StoredFile> {
    const file = {
      key: input.key,
      size: input.body.byteLength,
      contentType: input.contentType,
      lastModified: new Date().toISOString(),
      body: input.body,
    };
    this.files.set(input.key, file);
    return file;
  }

  async list(prefix = ""): Promise<StoredFile[]> {
    return Array.from(this.files.values())
      .filter((file) => file.key.startsWith(prefix))
      .map(({ body: _body, ...file }) => file);
  }

  async presignGet(key: string): Promise<string> {
    if (!this.files.has(key)) throw new Error("فایل پیدا نشد.");
    return `mock://storage/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }

  async listBuckets(): Promise<string[]> {
    return ["mock-ufopuff"];
  }
}

export function createStorageProvider(env: NodeJS.ProcessEnv = process.env): StorageProvider {
  const endpoint = env.LIARA_ENDPOINT;
  const bucketName = env.LIARA_BUCKET_NAME;
  const accessKey = env.LIARA_ACCESS_KEY;
  const secretKey = env.LIARA_SECRET_KEY;
  const explicitLiara = env.STORAGE_PROVIDER === "liara";

  if (explicitLiara || (endpoint && bucketName && accessKey && secretKey)) {
    if (!endpoint || !bucketName || !accessKey || !secretKey) {
      throw new Error("متغیرهای Liara Object Storage کامل نیستند.");
    }
    return new LiaraStorageProvider({ endpoint, bucketName, accessKey, secretKey });
  }

  return new MemoryStorageProvider();
}

const globalStorage = globalThis as typeof globalThis & {
  __ufoStorageProvider?: StorageProvider;
};

export function getStorageProvider(env: NodeJS.ProcessEnv = process.env): StorageProvider {
  if (!globalStorage.__ufoStorageProvider) {
    globalStorage.__ufoStorageProvider = createStorageProvider(env);
  }
  return globalStorage.__ufoStorageProvider;
}
