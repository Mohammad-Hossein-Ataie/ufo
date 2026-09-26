"use client";

import { ChangeEvent, useLayoutEffect, useRef, useState } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Quote,
  Redo2,
  RemoveFormatting,
  Type,
  Undo2,
  X,
} from "lucide-react";
import {
  contentBodyToDocument,
  richTextPlainText,
  safeContentHref,
  type RichTextDocument,
  type RichTextInline,
} from "@/lib/content-rich-text";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function inlinesToHtml(inlines: RichTextInline[]): string {
  return inlines.map((inline) => {
    let html = escapeHtml(inline.text).replace(/\n/g, "<br>");
    if (inline.bold) html = `<strong>${html}</strong>`;
    if (inline.italic) html = `<em>${html}</em>`;
    if (inline.href) html = `<a href="${escapeHtml(inline.href)}">${html}</a>`;
    return html;
  }).join("");
}

function documentToEditorHtml(document: RichTextDocument): string {
  if (!document.blocks.length) return "<p><br></p>";
  return document.blocks.map((block) => {
    if (block.type === "image") {
      return `<figure class="rich-editor-image" contenteditable="false"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" width="${block.width}" height="${block.height}"><figcaption>${escapeHtml(block.caption ?? block.alt)}</figcaption></figure><p><br></p>`;
    }
    if ("items" in block) {
      const tag = block.type === "orderedList" ? "ol" : "ul";
      return `<${tag}>${block.items.map((item) => `<li>${inlinesToHtml(item)}</li>`).join("")}</${tag}>`;
    }
    const tag = block.type === "heading2" ? "h2" : block.type === "heading3" ? "h3" : block.type === "quote" ? "blockquote" : "p";
    return `<${tag}>${inlinesToHtml(block.content) || "<br>"}</${tag}>`;
  }).join("");
}

function inlineContent(root: Node): RichTextInline[] {
  const result: RichTextInline[] = [];
  const walk = (node: Node, marks: Omit<RichTextInline, "type" | "text"> = {}) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.replace(/\u00a0/g, " ") ?? "";
      if (text) result.push({ type: "text", text, ...marks });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName.toLowerCase();
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
  };
  root.childNodes.forEach((node) => walk(node));
  return result.filter((inline) => inline.text !== "\n" || result.length > 1);
}

function editorToDocument(editor: HTMLElement): RichTextDocument {
  const blocks: RichTextDocument["blocks"] = [];
  let looseText: RichTextInline[] = [];
  const flushLooseText = () => {
    if (!looseText.some((inline) => inline.text.trim())) return;
    blocks.push({ type: "paragraph", content: looseText });
    looseText = [];
  };

  editor.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.trim()) looseText.push({ type: "text", text });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    flushLooseText();
    const tag = node.tagName.toLowerCase();
    if (tag === "figure") {
      const image = node.querySelector("img");
      if (!image || !/^\/api\/content-images\//.test(image.getAttribute("src") ?? "")) return;
      const width = Number(image.getAttribute("width"));
      const height = Number(image.getAttribute("height"));
      blocks.push({
        type: "image",
        src: image.getAttribute("src") ?? "",
        alt: (image.getAttribute("alt") ?? "").slice(0, 180),
        caption: (node.querySelector("figcaption")?.textContent ?? "").trim().slice(0, 240),
        width: Number.isFinite(width) && width > 0 ? width : 1600,
        height: Number.isFinite(height) && height > 0 ? height : 900,
      });
      return;
    }
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(node.children)
        .filter((child) => child.tagName.toLowerCase() === "li")
        .map((item) => inlineContent(item))
        .filter((item) => item.some((inline) => inline.text.trim()));
      if (items.length) blocks.push({ type: tag === "ol" ? "orderedList" : "bulletList", items });
      return;
    }
    const content = inlineContent(node);
    if (!content.some((inline) => inline.text.trim())) return;
    blocks.push({
      type: tag === "h2" ? "heading2" : tag === "h3" ? "heading3" : tag === "blockquote" ? "quote" : "paragraph",
      content,
    });
  });
  flushLooseText();
  return { version: 1, blocks };
}

const toolbarButton = "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500";

export function RichTextEditor({
  value,
  onChange,
  onUploadingChange,
  onError,
  onMessage,
}: {
  value: string;
  onChange: (value: string) => void;
  onUploadingChange: (uploading: boolean) => void;
  onError: (message: string) => void;
  onMessage: (message: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [showImageInsert, setShowImageInsert] = useState(false);
  const [imageAlt, setImageAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const initialDocument = useRef(contentBodyToDocument(value));
  const [characters, setCharacters] = useState(() => richTextPlainText(initialDocument.current).length);

  useLayoutEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = documentToEditorHtml(initialDocument.current);
  }, []);

  function sync() {
    if (!editorRef.current) return;
    const document = editorToDocument(editorRef.current);
    setCharacters(richTextPlainText(document).length);
    onChange(JSON.stringify(document));
  }

  function command(name: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    sync();
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function insertHtml(html: string) {
    const selection = window.getSelection();
    editorRef.current?.focus();
    if (selection && savedRange.current) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    }
    document.execCommand("insertHTML", false, html);
    savedRange.current = null;
    sync();
  }

  function addLink() {
    rememberSelection();
    const href = window.prompt("نشانی لینک را وارد کنید؛ فقط لینک داخلی یا HTTPS مجاز است.", "https://");
    if (!href) return;
    const safeHref = safeContentHref(href);
    if (!safeHref) {
      onError("نشانی لینک معتبر نیست؛ از HTTPS یا مسیر داخلی سایت استفاده کنید.");
      return;
    }
    command("createLink", safeHref);
  }

  async function uploadInlineImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const alt = imageAlt.trim();
    if (!file) return;
    if (alt.length < 3) {
      onError("پیش از انتخاب تصویر، متن جایگزین توصیفی بنویسید.");
      return;
    }
    setUploading(true);
    onUploadingChange(true);
    onError("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("purpose", "body");
      const response = await fetch("/api/admin/content/upload", { method: "POST", body });
      const payload = (await response.json()) as { url?: string; width?: number; height?: number; message?: string; error?: string };
      if (!response.ok || !payload.url || !payload.width || !payload.height) {
        throw new Error(payload.error ?? "آپلود تصویر داخل متن انجام نشد.");
      }
      insertHtml(`<figure class="rich-editor-image" contenteditable="false"><img src="${escapeHtml(payload.url)}" alt="${escapeHtml(alt)}" width="${payload.width}" height="${payload.height}"><figcaption>${escapeHtml(alt)}</figcaption></figure><p><br></p>`);
      setImageAlt("");
      setShowImageInsert(false);
      onMessage(payload.message ?? "تصویر در متن قرار گرفت.");
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "آپلود تصویر داخل متن انجام نشد.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm transition focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-100">
      <div role="toolbar" aria-label="ابزارهای ویرایش متن" className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50/80 p-2 sm:flex-wrap sm:overflow-x-visible">
        <button type="button" className={toolbarButton} aria-label="بازگشت" title="بازگشت" onClick={() => command("undo")}><Undo2 size={17} /></button>
        <button type="button" className={toolbarButton} aria-label="انجام دوباره" title="انجام دوباره" onClick={() => command("redo")}><Redo2 size={17} /></button>
        <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" />
        <button type="button" className={toolbarButton} aria-label="متن معمولی" title="متن معمولی" onMouseDown={(event) => event.preventDefault()} onClick={() => command("formatBlock", "p")}><Type size={17} /></button>
        <button type="button" className={toolbarButton} aria-label="تیتر سطح دو" title="تیتر سطح دو" onMouseDown={(event) => event.preventDefault()} onClick={() => command("formatBlock", "h2")}><Heading2 size={18} /></button>
        <button type="button" className={toolbarButton} aria-label="تیتر سطح سه" title="تیتر سطح سه" onMouseDown={(event) => event.preventDefault()} onClick={() => command("formatBlock", "h3")}><Heading3 size={18} /></button>
        <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" />
        <button type="button" className={toolbarButton} aria-label="پررنگ" title="پررنگ" onMouseDown={(event) => event.preventDefault()} onClick={() => command("bold")}><Bold size={17} /></button>
        <button type="button" className={toolbarButton} aria-label="مورب" title="مورب" onMouseDown={(event) => event.preventDefault()} onClick={() => command("italic")}><Italic size={17} /></button>
        <button type="button" className={toolbarButton} aria-label="لینک" title="لینک" onMouseDown={(event) => { event.preventDefault(); rememberSelection(); }} onClick={addLink}><Link2 size={17} /></button>
        <button type="button" className={toolbarButton} aria-label="پاک‌کردن قالب‌بندی" title="پاک‌کردن قالب‌بندی" onMouseDown={(event) => event.preventDefault()} onClick={() => command("removeFormat")}><RemoveFormatting size={17} /></button>
        <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" />
        <button type="button" className={toolbarButton} aria-label="فهرست نشانه‌دار" title="فهرست نشانه‌دار" onMouseDown={(event) => event.preventDefault()} onClick={() => command("insertUnorderedList")}><List size={18} /></button>
        <button type="button" className={toolbarButton} aria-label="فهرست شماره‌دار" title="فهرست شماره‌دار" onMouseDown={(event) => event.preventDefault()} onClick={() => command("insertOrderedList")}><ListOrdered size={18} /></button>
        <button type="button" className={toolbarButton} aria-label="نقل‌قول" title="نقل‌قول" onMouseDown={(event) => event.preventDefault()} onClick={() => command("formatBlock", "blockquote")}><Quote size={17} /></button>
        <button
          type="button"
          className={`${toolbarButton} mr-auto text-cyan-700`}
          aria-label="افزودن تصویر به متن"
          title="افزودن تصویر به متن"
          onMouseDown={(event) => { event.preventDefault(); rememberSelection(); }}
          onClick={() => setShowImageInsert((current) => !current)}
        >
          <ImagePlus size={18} />
        </button>
      </div>

      {showImageInsert ? (
        <div className="border-b border-cyan-100 bg-cyan-50/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm font-black text-slate-900">افزودن تصویر میان متن</p><p className="mt-1 text-xs leading-5 text-slate-600">تصویر بدون برش، بهینه و در فضای ابری خصوصی ذخیره می‌شود.</p></div>
            <button type="button" aria-label="بستن افزودن تصویر" onClick={() => setShowImageInsert(false)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-white"><X size={16} /></button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <label className="text-xs font-bold text-slate-700">
              متن جایگزین تصویر
              <input value={imageAlt} maxLength={180} onChange={(event) => setImageAlt(event.target.value)} placeholder="محتوای تصویر را دقیق توصیف کنید" className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600" />
            </label>
            <label className={`mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black text-white ${imageAlt.trim().length >= 3 && !uploading ? "cursor-pointer bg-cyan-700 hover:bg-cyan-800" : "cursor-not-allowed bg-slate-400"}`}>
              {uploading ? <LoaderCircle size={17} className="animate-spin" /> : <ImagePlus size={17} />}
              {uploading ? "در حال آپلود..." : "انتخاب تصویر"}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={uploading || imageAlt.trim().length < 3} onChange={(event) => void uploadInlineImage(event)} />
            </label>
          </div>
        </div>
      ) : null}

      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-label="متن اصلی"
        aria-multiline="true"
        data-placeholder="مقدمه را بنویسید و با تیترها، فهرست‌ها، لینک و تصویر ساختار دهید…"
        suppressContentEditableWarning
        onInput={sync}
        onBlur={rememberSelection}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
          sync();
        }}
        className="rich-text-editor min-h-[36rem] px-5 py-5 text-base leading-8 text-slate-800 outline-none sm:px-7 sm:py-6 lg:min-h-[42rem]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500">
        <span>برای خوانایی و SEO از تیتر سطح دو و سه استفاده کنید.</span>
        <span className={characters >= 300 ? "font-bold text-emerald-700" : "text-amber-700"}>{characters.toLocaleString("fa-IR")} کاراکتر</span>
      </div>
    </div>
  );
}
