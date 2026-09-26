import { describe, expect, it } from "vitest";
import {
  contentBodyHasHeading,
  contentBodyImageCount,
  contentBodyPlainText,
  normalizeContentBody,
  parseRichTextDocument,
  type RichTextDocument,
} from "@/lib/content-rich-text";

describe("content rich text", () => {
  it("normalizes supported blocks and strips unsafe destinations", () => {
    const document: RichTextDocument = {
      version: 1,
      blocks: [
        { type: "heading2", content: [{ type: "text", text: "راهنمای خرید" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "متن امن", bold: true, href: "javascript:alert(1)" },
            { type: "text", text: " و لینک داخلی", href: "/products" },
          ],
        },
        {
          type: "image",
          src: "/api/content-images/4e4f4c31-1ea7-4f63-96c2-2f467098a8ae",
          alt: "تصویر محصول روی میز",
          width: 1200,
          height: 800,
        },
      ],
    };
    const normalized = normalizeContentBody(JSON.stringify(document));
    const parsed = parseRichTextDocument(normalized.body)!;
    expect(parsed.blocks).toHaveLength(3);
    expect("content" in parsed.blocks[1]! ? parsed.blocks[1].content[0]?.href : undefined).toBeUndefined();
    expect(contentBodyHasHeading(normalized.body)).toBe(true);
    expect(contentBodyImageCount(normalized.body)).toBe(1);
    expect(contentBodyPlainText(normalized.body)).toContain("متن امن");
  });

  it("keeps legacy markdown readable", () => {
    const body = "مقدمه مطلب\n\n## تیتر بخش\nمتن بخش\n\n- مورد اول";
    expect(contentBodyHasHeading(body)).toBe(true);
    expect(contentBodyPlainText(body)).toContain("تیتر بخش");
  });
});
