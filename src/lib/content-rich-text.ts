export type RichTextInline = {
  type: "text";
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
};

export type RichTextTextBlock = {
  type: "paragraph" | "heading2" | "heading3" | "quote";
  content: RichTextInline[];
};

export type RichTextListBlock = {
  type: "bulletList" | "orderedList";
  items: RichTextInline[][];
};

export type RichTextImageBlock = {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
};

export const MAX_TABLE_ROWS = 30;
export const MAX_TABLE_COLUMNS = 8;

export type RichTextTableBlock = {
  type: "table";
  caption?: string;
  headerRow: boolean;
  rows: RichTextInline[][][];
};

export type RichTextBlock =
  | RichTextTextBlock
  | RichTextListBlock
  | RichTextImageBlock
  | RichTextTableBlock;

export type RichTextDocument = {
  version: 1;
  blocks: RichTextBlock[];
};

const contentImagePattern =
  /^\/api\/content-images\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const textBlockTypes = new Set(["paragraph", "heading2", "heading3", "quote"]);
const listBlockTypes = new Set(["bulletList", "orderedList"]);

function boundedText(value: unknown, max: number): string {
  return typeof value === "string" ? value.split("\u0000").join("").slice(0, max) : "";
}

export function safeContentHref(value: unknown): string | undefined {
  const href = boundedText(value, 1_000).trim();
  if (!href) return undefined;
  if (
    /^\/(?!\/)/.test(href) ||
    /^https:\/\//i.test(href) ||
    /^mailto:[^\s@]+@[^\s@]+$/i.test(href)
  ) {
    return href;
  }
  return undefined;
}

function normalizeInline(value: unknown): RichTextInline | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<RichTextInline>;
  if (candidate.type !== "text") return undefined;
  const text = boundedText(candidate.text, 10_000);
  if (!text) return undefined;
  const href = safeContentHref(candidate.href);
  return {
    type: "text",
    text,
    ...(candidate.bold === true ? { bold: true } : {}),
    ...(candidate.italic === true ? { italic: true } : {}),
    ...(href ? { href } : {}),
  };
}

function normalizeInlines(value: unknown): RichTextInline[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 1_000)
    .map(normalizeInline)
    .filter((item): item is RichTextInline => Boolean(item));
}

function normalizeBlock(value: unknown): RichTextBlock | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  const type = candidate.type;
  if (typeof type !== "string") return undefined;

  if (textBlockTypes.has(type)) {
    const content = normalizeInlines(candidate.content);
    if (!content.length) return undefined;
    return { type: type as RichTextTextBlock["type"], content };
  }

  if (listBlockTypes.has(type)) {
    if (!Array.isArray(candidate.items)) return undefined;
    const items = candidate.items
      .slice(0, 200)
      .map(normalizeInlines)
      .filter((item) => item.length > 0);
    if (!items.length) return undefined;
    return { type: type as RichTextListBlock["type"], items };
  }

  if (type === "table") {
    if (!Array.isArray(candidate.rows)) return undefined;
    const rows = candidate.rows
      .slice(0, MAX_TABLE_ROWS)
      .filter((row): row is unknown[] => Array.isArray(row))
      .map((row) => row.slice(0, MAX_TABLE_COLUMNS).map(normalizeInlines));
    const columns = Math.max(0, ...rows.map((row) => row.length));
    if (!rows.length || !columns) return undefined;
    const caption = boundedText(candidate.caption, 240).trim();
    return {
      type: "table",
      headerRow: candidate.headerRow === true,
      rows: rows.map((row) => Array.from({ length: columns }, (_, index) => row[index] ?? [])),
      ...(caption ? { caption } : {}),
    };
  }

  if (type === "image") {
    const src = boundedText(candidate.src, 1_000).trim();
    const alt = boundedText(candidate.alt, 180).trim();
    const caption = boundedText(candidate.caption, 240).trim();
    const width = Math.round(Number(candidate.width));
    const height = Math.round(Number(candidate.height));
    if (!contentImagePattern.test(src) || alt.length < 3) return undefined;
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 1 ||
      height < 1 ||
      width > 4_000 ||
      height > 4_000
    ) {
      return undefined;
    }
    return { type: "image", src, alt, width, height, ...(caption ? { caption } : {}) };
  }

  return undefined;
}

export function parseRichTextDocument(value: string): RichTextDocument | undefined {
  const source = value.trim();
  if (!source.startsWith("{")) return undefined;
  try {
    const candidate = JSON.parse(source) as { version?: unknown; blocks?: unknown };
    if (candidate.version !== 1 || !Array.isArray(candidate.blocks)) return undefined;
    const blocks = candidate.blocks
      .slice(0, 500)
      .map(normalizeBlock)
      .filter((block): block is RichTextBlock => Boolean(block));
    return { version: 1, blocks };
  } catch {
    return undefined;
  }
}

export function richTextPlainText(document: RichTextDocument): string {
  return document.blocks
    .flatMap((block) => {
      if (block.type === "image") return [block.alt, block.caption ?? ""];
      if (block.type === "table") {
        return [
          block.caption ?? "",
          ...block.rows.map((row) =>
            row.map((cell) => cell.map((inline) => inline.text).join("")).join("\t"),
          ),
        ];
      }
      if ("items" in block) {
        return block.items.map((item) => item.map((inline) => inline.text).join(""));
      }
      return [block.content.map((inline) => inline.text).join("")];
    })
    .join("\n")
    .trim();
}

export function contentBodyPlainText(body: string): string {
  const document = parseRichTextDocument(body);
  if (document) return richTextPlainText(document);
  return body
    .replace(/^#{2,3}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function contentBodyHasHeading(body: string): boolean {
  const document = parseRichTextDocument(body);
  return document
    ? document.blocks.some((block) => block.type === "heading2" || block.type === "heading3")
    : /^#{2,3}\s+\S/m.test(body);
}

export function contentBodyImageCount(body: string): number {
  return parseRichTextDocument(body)?.blocks.filter((block) => block.type === "image").length ?? 0;
}

export function normalizeContentBody(value: unknown): { body: string; plainText: string } {
  const source = typeof value === "string" ? value.trim() : "";
  if (source.length > 120_000) throw new Error("حجم متن محتوا بیش از حد مجاز است.");
  if (!source.startsWith("{"))
    return { body: source.slice(0, 50_000), plainText: contentBodyPlainText(source) };

  const document = parseRichTextDocument(source);
  if (!document) throw new Error("ساختار متن غنی معتبر نیست.");
  const body = JSON.stringify(document);
  const plainText = richTextPlainText(document);
  if (plainText.length > 50_000) throw new Error("متن محتوا بیش از حد مجاز است.");
  return { body, plainText };
}

function legacyInlines(value: string): RichTextInline[] {
  return value ? [{ type: "text", text: value }] : [];
}

export function contentBodyToDocument(body: string): RichTextDocument {
  const rich = parseRichTextDocument(body);
  if (rich) return rich;

  const blocks: RichTextBlock[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", content: legacyInlines(paragraph.join(" ")) });
    paragraph = [];
  };
  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push({ type: "bulletList", items: bullets.map(legacyInlines) });
    bullets = [];
  };

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushBullets();
    } else if (line.startsWith("### ")) {
      flushParagraph();
      flushBullets();
      blocks.push({ type: "heading3", content: legacyInlines(line.slice(4).trim()) });
    } else if (line.startsWith("## ")) {
      flushParagraph();
      flushBullets();
      blocks.push({ type: "heading2", content: legacyInlines(line.slice(3).trim()) });
    } else if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      bullets.push(line.replace(/^[-*]\s+/, ""));
    } else {
      flushBullets();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushBullets();
  return { version: 1, blocks };
}
