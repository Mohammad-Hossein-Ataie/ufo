// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { documentToEditorHtml, editorToDocument } from "@/lib/content-editor-dom";
import {
  normalizeContentBody,
  parseRichTextDocument,
  type RichTextDocument,
} from "@/lib/content-rich-text";

describe("article editor round trips", () => {
  it("preserves tables, blank cells, rich text and images between paragraphs", () => {
    const original: RichTextDocument = {
      version: 1,
      blocks: [
        { type: "paragraph", content: [{ type: "text", text: "مقدمه قبل از تصویر" }] },
        {
          type: "image",
          src: "/api/content-images/4e4f4c31-1ea7-4f63-96c2-2f467098a8ae",
          width: 320,
          height: 500,
          alt: "نمای عمودی آزمایشی",
          caption: "زیرنویس مستقل",
        },
        {
          type: "table",
          headerRow: true,
          caption: "برنامه مطالعه",
          rows: [
            [[{ type: "text", text: "روز" }], [{ type: "text", text: "موضوع" }]],
            [
              [],
              [{ type: "text", text: "یادداشت", bold: true, href: "https://example.com/notes" }],
            ],
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: "پاراگراف پس از جدول" }] },
      ],
    };
    const editor = document.createElement("div");
    editor.innerHTML = documentToEditorHtml(original);
    const persisted = normalizeContentBody(JSON.stringify(editorToDocument(editor))).body;
    expect(parseRichTextDocument(persisted)).toEqual(original);
    editor.innerHTML = documentToEditorHtml(parseRichTextDocument(persisted)!);
    expect(normalizeContentBody(JSON.stringify(editorToDocument(editor))).body).toBe(persisted);
    expect(editor.querySelectorAll("th[scope=col]")).toHaveLength(2);
  });

  it("does not accumulate empty paragraphs after media when reopened", () => {
    const editor = document.createElement("div");
    editor.innerHTML =
      "<p>قبل</p><div><table><tbody><tr><td>یک</td><td></td></tr></tbody></table></div><p><br></p>";
    for (let i = 0; i < 3; i += 1)
      editor.innerHTML = documentToEditorHtml(editorToDocument(editor));
    expect(editor.querySelectorAll("p")).toHaveLength(2);
    expect(editorToDocument(editor).blocks.map((block) => block.type)).toEqual([
      "paragraph",
      "table",
    ]);
  });

  it("keeps formatting and spaces when the browser leaves inline nodes at the editor root", () => {
    const editor = document.createElement("div");
    editor.innerHTML =
      'متن <b>پررنگ</b> <a href="https://example.com/notes">منبع</a><br><em>ادامه</em><p>بند بعد</p>';
    const result = editorToDocument(editor);
    expect(result.blocks).toEqual([
      {
        type: "paragraph",
        content: [
          { type: "text", text: "متن " },
          { type: "text", text: "پررنگ", bold: true },
          { type: "text", text: " " },
          { type: "text", text: "منبع", href: "https://example.com/notes" },
          { type: "text", text: "\n" },
          { type: "text", text: "ادامه", italic: true },
        ],
      },
      { type: "paragraph", content: [{ type: "text", text: "بند بعد" }] },
    ]);
    editor.innerHTML = documentToEditorHtml(result);
    expect(editorToDocument(editor)).toEqual(result);
  });
});
