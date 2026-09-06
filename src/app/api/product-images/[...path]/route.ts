import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { listCatalogRows } from "@/lib/catalog-data";
import { checkRateLimit } from "@/lib/customer-session";
import {
  generateProtectedProductImage,
  generatedProductKey,
  isProductImagePreset,
  maxProductImageBytes,
  originalProductKey,
  productImageAssetId,
  type ProductImagePreset,
} from "@/lib/product-image-protection";
import { getStorageProvider } from "@ufo/storage";
import type { Product } from "@ufo/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const assetIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safeIdPattern = /^[a-zA-Z0-9_-]{1,100}$/;

function imageHeaders(cacheId: string): HeadersInit {
  return {
    "Content-Type": "image/webp",
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: `"${cacheId}"`,
    "Content-Disposition": 'inline; filename="ufo-puff-product.webp"',
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-site",
  };
}

function responseImage(body: Uint8Array, cacheId: string): Response {
  return new Response(Buffer.from(body), { status: 200, headers: imageHeaders(cacheId) });
}

function resolveCatalogSource(product: Product, slot: string): string | undefined {
  if (slot === "primary") return product.image;
  const galleryMatch = slot.match(/^gallery-(\d{1,3})$/);
  if (galleryMatch) return product.images[Number(galleryMatch[1])];
  const variantMatch = slot.match(/^variant-(\d{1,3})$/);
  if (variantMatch) {
    return Object.entries(product.variantImages ?? product.colorImages ?? {})[
      Number(variantMatch[1])
    ]?.[1];
  }
  const descriptionMatch = slot.match(/^description-(\d{1,3})$/);
  if (descriptionMatch) {
    const block = product.descriptionFa
      .split(/\n{2,}/)
      .map((value) => value.trim())
      .filter(Boolean)[Number(descriptionMatch[1])];
    return block?.match(/^!\[.*]\((.+)\)$/)?.[1];
  }
  return undefined;
}

function allowedRemoteHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const value of [process.env.LIARA_PUBLIC_BASE_URL, process.env.LIARA_ENDPOINT]) {
    if (!value) continue;
    try {
      hosts.add(new URL(value).hostname.toLowerCase());
    } catch {
      // Invalid server configuration is ignored, never widened into an open proxy.
    }
  }
  for (const host of (process.env.PRODUCT_IMAGE_SOURCE_HOSTS ?? "").split(",")) {
    const normalized = host.trim().toLowerCase();
    if (/^(?:[a-z0-9-]+\.)*[a-z0-9-]+$/.test(normalized)) hosts.add(normalized);
  }
  return hosts;
}

async function boundedResponseBody(response: Response): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > maxProductImageBytes) throw new Error("Image is too large");
  if (!response.body) throw new Error("Image has no body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxProductImageBytes) {
      await reader.cancel();
      throw new Error("Image is too large");
    }
    chunks.push(value);
  }
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function readLegacySource(source: string): Promise<Uint8Array> {
  if (source.startsWith("/")) {
    const publicRoot = path.resolve(process.cwd(), "public");
    const filePath = path.resolve(publicRoot, source.replace(/^\/+/, ""));
    if (!filePath.startsWith(`${publicRoot}${path.sep}`)) throw new Error("Invalid image path");
    const body = await readFile(filePath);
    if (body.byteLength > maxProductImageBytes) throw new Error("Image is too large");
    return new Uint8Array(body);
  }

  const url = new URL(source);
  if (url.protocol !== "https:" || !allowedRemoteHosts().has(url.hostname.toLowerCase())) {
    throw new Error("Remote image host is not allowed");
  }
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
    headers: { Accept: "image/avif,image/webp,image/png,image/jpeg" },
  });
  if (!response.ok) throw new Error("Image could not be loaded");
  return boundedResponseBody(response);
}

async function readGenerated(key: string): Promise<Uint8Array | undefined> {
  try {
    return (await getStorageProvider().read(key)).body;
  } catch {
    return undefined;
  }
}

async function serveAsset(assetId: string, preset: ProductImagePreset): Promise<Response> {
  if (!assetIdPattern.test(assetId)) return new NextResponse(null, { status: 404 });
  const cacheId = assetId.toLowerCase();
  const generatedKey = generatedProductKey(cacheId, preset);
  const cached = await readGenerated(generatedKey);
  if (cached) return responseImage(cached, generatedKey);
  if (!checkRateLimit(`product-image-generation:${cacheId}`, 5, 60_000).allowed) {
    return new NextResponse(null, { status: 429, headers: { "Retry-After": "60" } });
  }

  const original = await getStorageProvider().read(originalProductKey(cacheId));
  const generated = await generateProtectedProductImage(original.body, preset);
  await getStorageProvider().upload({
    key: generatedKey,
    body: generated,
    contentType: "image/webp",
    visibility: "private",
  });
  return responseImage(generated, generatedKey);
}

async function serveCatalog(
  productId: string,
  slot: string,
  preset: ProductImagePreset,
): Promise<Response> {
  if (!safeIdPattern.test(productId) || !safeIdPattern.test(slot)) {
    return new NextResponse(null, { status: 404 });
  }
  const row = (await listCatalogRows()).find((item) => item.product.id === productId);
  const source = row ? resolveCatalogSource(row.product, slot) : undefined;
  if (!source) return new NextResponse(null, { status: 404 });

  const storedAssetId = productImageAssetId(source);
  if (storedAssetId) return serveAsset(storedAssetId, preset);

  const cacheId = createHash("sha256")
    .update(`${productId}\0${slot}\0${source}`)
    .digest("hex")
    .slice(0, 32);
  const generatedKey = generatedProductKey(cacheId, preset);
  const cached = await readGenerated(generatedKey);
  if (cached) return responseImage(cached, generatedKey);
  if (!checkRateLimit(`product-image-generation:${cacheId}`, 5, 60_000).allowed) {
    return new NextResponse(null, { status: 429, headers: { "Retry-After": "60" } });
  }

  const original = await readLegacySource(source);
  const generated = await generateProtectedProductImage(original, preset);
  await getStorageProvider().upload({
    key: generatedKey,
    body: generated,
    contentType: "image/webp",
    visibility: "private",
  });
  return responseImage(generated, generatedKey);
}

async function serveVariant(variantId: string, preset: ProductImagePreset): Promise<Response> {
  if (!safeIdPattern.test(variantId)) return new NextResponse(null, { status: 404 });
  const row = (await listCatalogRows()).find((item) => item.variant.id === variantId);
  if (!row) return new NextResponse(null, { status: 404 });
  return serveCatalog(row.product.id, "primary", preset);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  try {
    const segments = (await params).path;
    const preset = segments.at(-1);
    if (!preset || !isProductImagePreset(preset)) {
      return new NextResponse(null, { status: 404 });
    }
    const etag = request.headers.get("if-none-match");

    let response: Response;
    if (segments.length === 3 && segments[0] === "asset") {
      response = await serveAsset(segments[1] ?? "", preset);
    } else if (segments.length === 3 && segments[0] === "variant") {
      response = await serveVariant(segments[1] ?? "", preset);
    } else if (segments.length === 4 && segments[0] === "catalog") {
      response = await serveCatalog(segments[1] ?? "", segments[2] ?? "", preset);
    } else {
      return new NextResponse(null, { status: 404 });
    }

    if (response.ok && etag && etag === response.headers.get("etag")) {
      return new NextResponse(null, { status: 304, headers: response.headers });
    }
    return response;
  } catch {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff" },
    });
  }
}
