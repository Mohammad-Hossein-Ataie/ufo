const { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID, scryptSync } = require("node:crypto");
const { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } = require("node:fs");
const { resolve, relative, join, dirname, sep } = require("node:path");
const { gzipSync, gunzipSync } = require("node:zlib");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const dataDirectory = resolve(process.env.UFO_MOCK_DATA_DIR || "./mock-data");
const markerName = ".ufo-data-restored.json";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function storage() {
  const { LIARA_ENDPOINT, LIARA_BUCKET_NAME, LIARA_ACCESS_KEY, LIARA_SECRET_KEY } = process.env;
  if (!LIARA_ENDPOINT || !LIARA_BUCKET_NAME || !LIARA_ACCESS_KEY || !LIARA_SECRET_KEY) {
    throw new Error("Liara object storage is not configured for data migration.");
  }
  return {
    bucket: LIARA_BUCKET_NAME,
    client: new S3Client({
      region: "default",
      endpoint: LIARA_ENDPOINT,
      forcePathStyle: true,
      credentials: { accessKeyId: LIARA_ACCESS_KEY, secretAccessKey: LIARA_SECRET_KEY },
    }),
  };
}

function encryptionKey(salt) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET is required for encrypted data migration.");
  return scryptSync(secret, salt, 32);
}

function listFiles(directory = dataDirectory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === markerName) return [];
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Data migration refuses symbolic links.");
    if (entry.isDirectory()) return listFiles(path);
    if (!entry.isFile()) throw new Error("Data migration found an unsupported file type.");
    const body = readFileSync(path);
    return [{ path: relative(dataDirectory, path).split(sep).join("/"), sha256: digest(body), body: body.toString("base64") }];
  });
}

function validateSnapshot(snapshot) {
  if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.files)) {
    throw new Error("Data backup has an invalid format.");
  }
  const paths = new Set();
  for (const file of snapshot.files) {
    if (
      typeof file.path !== "string" ||
      !file.path ||
      file.path.startsWith("/") ||
      file.path.split("/").some((part) => !part || part === "." || part === "..") ||
      paths.has(file.path) ||
      typeof file.body !== "string" ||
      typeof file.sha256 !== "string" ||
      digest(Buffer.from(file.body, "base64")) !== file.sha256
    ) throw new Error("Data backup contains an invalid file.");
    paths.add(file.path);
  }
  if (!paths.has("customer-accounts.json") || !paths.has("orders.json")) {
    throw new Error("Data backup is missing the customer or order file.");
  }
  const customers = JSON.parse(Buffer.from(snapshot.files.find((file) => file.path === "customer-accounts.json").body, "base64"));
  const orders = JSON.parse(Buffer.from(snapshot.files.find((file) => file.path === "orders.json").body, "base64"));
  if (!Array.isArray(customers.customers) || !Array.isArray(customers.addresses)) {
    throw new Error("Data backup has an invalid customer file.");
  }
  if (!Array.isArray(orders.orders)) throw new Error("Data backup has an invalid order file.");
  return { customers: customers.customers.length, addresses: customers.addresses.length };
}

function mountedAtDataDirectory() {
  if (process.platform !== "linux") return true;
  const mountInfo = readFileSync("/proc/self/mountinfo", "utf8");
  return mountInfo.split("\n").some((line) => line.split(" - ")[0].split(" ")[4] === dataDirectory);
}

function verifyPersistentData() {
  if (!mountedAtDataDirectory()) throw new Error("Persistent data disk is not mounted at the configured directory.");
  if (!existsSync(join(dataDirectory, "customer-accounts.json"))) {
    throw new Error("Customer data is missing from the persistent disk.");
  }
  const customerStore = JSON.parse(readFileSync(join(dataDirectory, "customer-accounts.json"), "utf8"));
  if (!Array.isArray(customerStore.customers) || !Array.isArray(customerStore.addresses)) {
    throw new Error("Customer data on the persistent disk is invalid.");
  }
}

async function backup() {
  if (!existsSync(dataDirectory)) throw new Error("Data directory does not exist.");
  const snapshot = { version: 1, createdAt: new Date().toISOString(), files: listFiles() };
  const counts = validateSnapshot(snapshot);
  const plaintext = gzipSync(Buffer.from(JSON.stringify(snapshot)));
  const salt = randomBytes(16);
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(salt), nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const body = Buffer.concat([salt, nonce, cipher.getAuthTag(), encrypted]);
  const key = `private-backups/mock-data/${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.bin`;
  const { bucket, client } = storage();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: "application/octet-stream", ACL: "private" }));
  const uploaded = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!uploaded.Body || digest(Buffer.from(await uploaded.Body.transformToByteArray())) !== digest(body)) {
    throw new Error("Uploaded backup could not be verified.");
  }
  return { key, sha256: digest(body), files: snapshot.files.length, ...counts };
}

async function restore(key) {
  if (!key || !key.startsWith("private-backups/mock-data/")) throw new Error("Data backup key is invalid.");
  if (!mountedAtDataDirectory()) throw new Error("Persistent data disk is not mounted.");
  const markerPath = join(dataDirectory, markerName);
  if (existsSync(markerPath)) {
    const marker = JSON.parse(readFileSync(markerPath, "utf8"));
    if (marker.key !== key) throw new Error("A different data backup was already restored.");
    verifyPersistentData();
    return { restored: false, ...marker };
  }
  const { bucket, client } = storage();
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) throw new Error("Data backup is empty.");
  const body = Buffer.from(await response.Body.transformToByteArray());
  if (body.length < 45) throw new Error("Data backup is truncated.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(body.subarray(0, 16)), body.subarray(16, 28));
  decipher.setAuthTag(body.subarray(28, 44));
  const snapshot = JSON.parse(gunzipSync(Buffer.concat([decipher.update(body.subarray(44)), decipher.final()])));
  const counts = validateSnapshot(snapshot);
  mkdirSync(dataDirectory, { recursive: true });
  const expected = new Map(snapshot.files.map((file) => [file.path, file.sha256]));
  for (const file of listFiles()) {
    if (expected.get(file.path) !== file.sha256) {
      throw new Error("Existing data differs from the backup; refusing to mix files.");
    }
  }
  for (const file of snapshot.files) {
    const target = join(dataDirectory, ...file.path.split("/"));
    const bytes = Buffer.from(file.body, "base64");
    if (existsSync(target)) {
      if (!lstatSync(target).isFile() || digest(readFileSync(target)) !== file.sha256) {
        throw new Error("An existing data file differs from the backup; refusing to overwrite it.");
      }
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes, { flag: "wx", mode: 0o600 });
  }
  const marker = { key, sha256: digest(body), files: snapshot.files.length, ...counts };
  writeFileSync(markerPath, JSON.stringify(marker), { flag: "wx", mode: 0o600 });
  verifyPersistentData();
  return { restored: true, ...marker };
}

module.exports = { backup, restore, verifyPersistentData };
