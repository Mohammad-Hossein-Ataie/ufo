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
    expect(
      "content" in parsed.blocks[1]! ? parsed.blocks[1].content[0]?.href : undefined,
    ).toBeUndefined();
    expect(contentBodyHasHeading(normalized.body)).toBe(true);
    expect(contentBodyImageCount(normalized.body)).toBe(1);
    expect(contentBodyPlainText(normalized.body)).toContain("متن امن");
  });

  it("keeps legacy markdown readable", () => {
    const body = "مقدمه مطلب\n\n## تیتر بخش\nمتن بخش\n\n- مورد اول";
    expect(contentBodyHasHeading(body)).toBe(true);
    expect(contentBodyPlainText(body)).toContain("تیتر بخش");
  });

  it("normalizes uneven tables without shifting blank cells and strips unsafe links", () => {
    const result = normalizeContentBody(
      JSON.stringify({
        version: 1,
        blocks: [
          {
            type: "table",
            headerRow: true,
            caption: "برنامه هفتگی",
            rows: [
              [[{ type: "text", text: "روز" }], [{ type: "text", text: "فعالیت" }]],
              [[], [{ type: "text", text: "مطالعه", bold: true, href: "javascript:alert(1)" }]],
              [[{ type: "text", text: "شنبه" }]],
            ],
          },
        ],
      }),
    );
    const table = parseRichTextDocument(result.body)!.blocks[0];
    expect(table?.type).toBe("table");
    if (table?.type !== "table") return;
    expect(table.rows.map((row) => row.length)).toEqual([2, 2, 2]);
    expect(table.rows[1]?.[0]).toEqual([]);
    expect(table.rows[1]?.[1]?.[0]).toEqual({ type: "text", text: "مطالعه", bold: true });
    expect(table.rows[2]?.[1]).toEqual([]);
    expect(result.plainText).toContain("برنامه هفتگی");
    expect(result.plainText).toContain("مطالعه");
  });

  it("bounds oversized tables and ignores malformed blocks", () => {
    const document = parseRichTextDocument(
      JSON.stringify({
        version: 1,
        blocks: [
          { type: "table", rows: [] },
          { type: "table", rows: "invalid" },
          {
            type: "table",
            headerRow: "true",
            rows: Array.from({ length: 40 }, () =>
              Array.from({ length: 15 }, () => [{ type: "text", text: "متن" }]),
            ),
          },
        ],
      }),
    );
    expect(document?.blocks).toHaveLength(1);
    const table = document?.blocks[0];
    if (table?.type !== "table") throw new Error("Expected table");
    expect(table.headerRow).toBe(false);
    expect(table.rows).toHaveLength(30);
    expect(table.rows[0]).toHaveLength(8);
  });
});
