import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const publicDirectory = join(process.cwd(), "public");

async function readPublicFile(name: string) {
  return readFile(join(publicDirectory, name), "utf8");
}

describe("AI discovery files", () => {
  it("keeps the aliases concise and points them to the canonical guide", async () => {
    const [ai, llm] = await Promise.all([readPublicFile("ai.txt"), readPublicFile("llm.txt")]);

    for (const content of [ai, llm]) {
      expect(content).toContain("https://ufopuff.com/llms.txt");
      expect(content).toContain("https://ufopuff.com/sitemap.xml");
      expect(content).not.toContain("�");
      expect(Buffer.byteLength(content, "utf8")).toBeLessThan(5_000);
    }
  });

  it("follows the llms.txt discovery structure without exposing private paths", async () => {
    const content = await readPublicFile("llms.txt");
    const lines = content.split(/\r?\n/);
    const nonEmptyLines = lines.filter((line) => line.trim());
    const linkedUrls = [...content.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(
      (match) => match[1],
    );

    expect(nonEmptyLines[0]).toBe("# UFO Puff | یوفوپاف");
    expect(nonEmptyLines[1]).toMatch(/^> /);
    expect(content).toContain("## دسته‌بندی محصولات");
    expect(content).toContain("## پاسخ‌های آموزشی و راهنمای خرید");
    expect(content).toContain("قیمت، موجودی، گزینه‌های قابل‌سفارش");
    expect(content).not.toContain("�");
    expect(Buffer.byteLength(content, "utf8")).toBeLessThan(12_000);
    expect(linkedUrls.length).toBeGreaterThanOrEqual(20);
    expect(linkedUrls.every((url) => url.startsWith("https://ufopuff.com/"))).toBe(true);

    for (const privatePath of ["/admin", "/api/", "/account", "/cart", "/checkout", "/orders"]) {
      expect(linkedUrls.some((url) => new URL(url).pathname.startsWith(privatePath))).toBe(false);
    }
  });
});
