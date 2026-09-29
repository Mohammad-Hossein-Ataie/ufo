import {
  MAX_TABLE_COLUMNS,
  MAX_TABLE_ROWS,
  safeContentHref,
  type RichTextDocument,
  type RichTextImageBlock,
  type RichTextInline,
  type RichTextTableBlock,
} from "@/lib/content-rich-text";

export function escapeContentHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function inlinesToHtml(inlines: RichTextInline[]): string {
  return inlines
    .map((inline) => {
      let html = escapeContentHtml(inline.text).replace(/\n/g, "<br>");
      if (inline.bold) html = `<strong>${html}</strong>`;
      if (inline.italic) html = `<em>${html}</em>`;
      const href = safeContentHref(inline.href);
      if (href) html = `<a href="${escapeContentHtml(href)}">${html}</a>`;
      return html;
    })
    .join("");
}

export function imageToEditorHtml(block: RichTextImageBlock): string {
  return `<figure class="rich-editor-image" contenteditable="false" tabindex="0" aria-label="ویرایش تصویر: ${escapeContentHtml(block.alt)}"><img src="${escapeContentHtml(block.src)}" alt="${escapeContentHtml(block.alt)}" width="${block.width}" height="${block.height}"><figcaption>${escapeContentHtml(block.caption ?? "")}</figcaption></figure>`;
}

export function tableToEditorHtml(block: RichTextTableBlock): string {
  const rows = block.rows.map((row, index) => {
    const header = index === 0 && block.headerRow;
    const tag = header ? "th" : "td";
    return `<tr>${row.map((cell) => `<${tag}${header ? ' scope="col"' : ""}>${inlinesToHtml(cell) || "<br>"}</${tag}>`).join("")}</tr>`;
  });
  return `<div class="rich-editor-table-wrap"><table>${block.caption ? `<caption>${escapeContentHtml(block.caption)}</caption>` : ""}${block.headerRow ? `<thead>${rows[0]}</thead>` : ""}<tbody>${rows.slice(block.headerRow ? 1 : 0).join("")}</tbody></table></div>`;
}

export function documentToEditorHtml(document: RichTextDocument): string {
  if (!document.blocks.length) return "<p><br></p>";
  const html = document.blocks
    .map((block) => {
      if (block.type === "image") return imageToEditorHtml(block);
      if (block.type === "table") return tableToEditorHtml(block);
      if ("items" in block) {
        const tag = block.type === "orderedList" ? "ol" : "ul";
        return `<${tag}>${block.items.map((item) => `<li>${inlinesToHtml(item)}</li>`).join("")}</${tag}>`;
      }
      const tag =
        block.type === "heading2"
          ? "h2"
          : block.type === "heading3"
            ? "h3"
            : block.type === "quote"
              ? "blockquote"
              : "p";
      return `<${tag}>${inlinesToHtml(block.content) || "<br>"}</${tag}>`;
    })
    .join("");
  const last = document.blocks.at(-1)?.type;
  return html + (last === "image" || last === "table" ? "<p><br></p>" : "");
}

function inlineNodes(nodes: Node[]): RichTextInline[] {
  const result: RichTextInline[] = [];
  const walk = (node: Node, marks: Omit<RichTextInline, "type" | "text"> = {}) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.replace(/\u00a0/g, " ") ?? "";
      if (text) result.push({ type: "text", text, ...marks });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName.toLowerCase();
    if (["script", "style", "iframe", "table", "figure"].includes(tag)) return;
    if (tag === "br") {
      result.push({ type: "text", text: "\n", ...marks });
      return;
    }
    const href = tag === "a" ? safeContentHref(node.getAttribute("href")) : marks.href;
    const nextMarks = {
      ...marks,
      ...(tag === "strong" || tag === "b" ? { bold: true } : {}),
      ...(tag === "em" || tag === "i" ? { italic: true } : {}),
      ...(href ? { href } : {}),
    };
    node.childNodes.forEach((child) => walk(child, nextMarks));
    if ((tag === "p" || tag === "div") && node.nextSibling)
      result.push({ type: "text", text: "\n" });
  };
  nodes.forEach((node) => walk(node));
  return result;
}

function inlineContent(root: Node): RichTextInline[] {
  const result = inlineNodes(Array.from(root.childNodes));
  return result.filter((inline) => inline.text !== "\n" || result.length > 1);
}

const inlineTags = new Set(["a", "b", "strong", "i", "em", "span", "br", "u", "s"]);

export function editorToDocument(editor: HTMLElement): RichTextDocument {
  const blocks: RichTextDocument["blocks"] = [];
  let looseText: RichTextInline[] = [];
  const flushLooseText = () => {
    if (looseText.some((inline) => inline.text.trim()))
      blocks.push({ type: "paragraph", content: looseText });
    looseText = [];
  };
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text) looseText.push({ type: "text", text });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName.toLowerCase();
    if (["script", "style", "iframe"].includes(tag)) return;
    // Formatting commands can leave adjacent inline nodes directly in the editor.
    // Treat that run as one paragraph and include each node's own formatting.
    if (inlineTags.has(tag)) {
      looseText.push(...inlineNodes([node]));
      return;
    }
    flushLooseText();
    if (tag === "table") {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.rows)
        .slice(0, MAX_TABLE_ROWS)
        .map((row) => Array.from(row.cells).slice(0, MAX_TABLE_COLUMNS).map(inlineContent));
      const caption = table.caption?.textContent?.trim().slice(0, 240);
      if (rows.length && rows.some((row) => row.length))
        blocks.push({
          type: "table",
          rows,
          headerRow: table.rows[0]?.cells[0]?.tagName === "TH",
          ...(caption ? { caption } : {}),
        });
      return;
    }
    if (tag === "figure") {
      const image = node.querySelector("img");
      if (!image || !/^\/api\/content-images\//.test(image.getAttribute("src") ?? "")) return;
      blocks.push({
        type: "image",
        src: image.getAttribute("src") ?? "",
        alt: (image.getAttribute("alt") ?? "").slice(0, 180),
        caption: (node.querySelector("figcaption")?.textContent ?? "").trim().slice(0, 240),
        width: Number(image.getAttribute("width")) || 1600,
        height: Number(image.getAttribute("height")) || 900,
      });
      return;
    }
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(node.children)
        .filter((child) => child.tagName === "LI")
        .map(inlineContent)
        .filter((item) => item.some((inline) => inline.text.trim()));
      if (items.length) blocks.push({ type: tag === "ol" ? "orderedList" : "bulletList", items });
      return;
    }
    // Browsers can wrap inserted blocks in a div; retain their structure and order.
    if (node.querySelector("table, figure, p, h2, h3, ul, ol, blockquote")) {
      node.childNodes.forEach(visit);
      flushLooseText();
      return;
    }
    const content = inlineContent(node);
    if (content.some((inline) => inline.text.trim()))
      blocks.push({
        type:
          tag === "h2"
            ? "heading2"
            : tag === "h3"
              ? "heading3"
              : tag === "blockquote"
                ? "quote"
                : "paragraph",
        content,
      });
  };
  editor.childNodes.forEach(visit);
  flushLooseText();
  return { version: 1, blocks };
}
