"use client";

import { type ChangeEvent, useId, useLayoutEffect, useRef, useState } from "react";
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
  Table2,
  Type,
  Undo2,
  X,
} from "lucide-react";
import {
  contentBodyToDocument,
  MAX_TABLE_COLUMNS,
  MAX_TABLE_ROWS,
  richTextPlainText,
  safeContentHref,
  type RichTextTableBlock,
} from "@/lib/content-rich-text";
import {
  documentToEditorHtml,
  editorToDocument,
  imageToEditorHtml,
  tableToEditorHtml,
} from "@/lib/content-editor-dom";

const toolbarButton =
  "inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 disabled:opacity-40";
const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-cyan-600";
const actionClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40";

export function RichTextEditor({
  value,
  onChange,
  onUploadingChange,
  onError,
  onMessage,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onUploadingChange: (uploading: boolean) => void;
  onError: (message: string) => void;
  onMessage: (message: string) => void;
  disabled?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const selectedFigure = useRef<HTMLElement | null>(null);
  const selectedCell = useRef<HTMLTableCellElement | null>(null);
  const [panel, setPanel] = useState<"image" | "table" | null>(null);
  const [editingImage, setEditingImage] = useState(false);
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [tableRows, setTableRows] = useState(3);
  const [tableColumns, setTableColumns] = useState(3);
  const [tableCaption, setTableCaption] = useState("");
  const [tableHeader, setTableHeader] = useState(true);
  const [tableActive, setTableActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialDocument] = useState(() => contentBodyToDocument(value));
  const [characters, setCharacters] = useState(() => richTextPlainText(initialDocument).length);
  const uploadId = useId();
  const locked = disabled || uploading;

  useLayoutEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = documentToEditorHtml(initialDocument);
  }, [initialDocument]);

  function rememberSelection() {
    const selection = window.getSelection();
    if (
      selection?.rangeCount &&
      editorRef.current?.contains(selection.anchorNode) &&
      editorRef.current.contains(selection.focusNode)
    ) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
      const node = selection.anchorNode;
      const element = node instanceof HTMLElement ? node : node?.parentElement;
      selectedCell.current = element?.closest<HTMLTableCellElement>("td, th") ?? null;
      setTableActive(Boolean(selectedCell.current));
    }
  }

  function sync() {
    if (!editorRef.current) return;
    const document = editorToDocument(editorRef.current);
    setCharacters(richTextPlainText(document).length);
    onChange(JSON.stringify(document));
    rememberSelection();
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus({ preventScroll: true });
    const selection = window.getSelection();
    const range = savedRange.current;
    if (selection && range && editor.contains(range.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (selection) {
      const end = document.createRange();
      end.selectNodeContents(editor);
      end.collapse(false);
      selection.removeAllRanges();
      selection.addRange(end);
    }
  }

  function command(name: string, value?: string) {
    restoreSelection();
    document.execCommand(name, false, value);
    sync();
  }

  function insertHtml(html: string, block = false) {
    const editor = editorRef.current;
    if (!editor) return;
    const previousEditable = editor.contentEditable;
    editor.contentEditable = "true";
    restoreSelection();
    const selection = window.getSelection();
    // Block media cannot live inside a cell or another non-editable figure.
    if (block && selection?.anchorNode) {
      const node = selection.anchorNode;
      const element = node instanceof HTMLElement ? node : node.parentElement;
      const container = element?.closest(".rich-editor-table-wrap, figure");
      if (container && editorRef.current?.contains(container)) {
        const range = document.createRange();
        range.setStartAfter(container);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    document.execCommand("insertHTML", false, html);
    savedRange.current = null;
    sync();
    editor.contentEditable = previousEditable;
  }

  function replaceBlock(element: HTMLElement, html: string) {
    if (!editorRef.current?.contains(element)) return;
    const range = document.createRange();
    range.selectNode(element);
    savedRange.current = range;
    insertHtml(html);
  }

  function addLink() {
    const href = window.prompt(
      "نشانی لینک را وارد کنید؛ لینک داخلی، HTTPS یا ایمیل مجاز است.",
      "https://",
    );
    if (!href) return;
    const safeHref = safeContentHref(href);
    if (!safeHref) {
      onError("نشانی لینک معتبر نیست.");
      return;
    }
    command("createLink", safeHref);
  }

  function openImage(figure?: HTMLElement) {
    rememberSelection();
    selectedFigure.current = figure ?? null;
    setEditingImage(Boolean(figure));
    setImageAlt(figure?.querySelector("img")?.getAttribute("alt") ?? "");
    setImageCaption(figure?.querySelector("figcaption")?.textContent ?? "");
    setPanel("image");
  }

  function saveImageDetails() {
    const figure = selectedFigure.current;
    const image = figure?.querySelector("img");
    if (!figure || !image || imageAlt.trim().length < 3) return;
    replaceBlock(
      figure,
      imageToEditorHtml({
        type: "image",
        src: image.getAttribute("src") ?? "",
        width: Number(image.getAttribute("width")),
        height: Number(image.getAttribute("height")),
        alt: imageAlt.trim(),
        caption: imageCaption.trim(),
      }),
    );
    selectedFigure.current = null;
    setPanel(null);
    onMessage("توضیحات تصویر به‌روز شد؛ برای ثبت نهایی، مطلب را ذخیره کنید.");
  }

  async function uploadInlineImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const alt = imageAlt.trim();
    if (!file || alt.length < 3 || locked) return;
    if (file.size > 8 * 1024 * 1024) {
      onError("حداکثر حجم تصویر ۸ مگابایت است.");
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
      const payload = (await response.json()) as {
        url?: string;
        width?: number;
        height?: number;
        message?: string;
        error?: string;
      };
      if (!response.ok || !payload.url || !payload.width || !payload.height) {
        throw new Error(payload.error ?? "آپلود تصویر داخل متن انجام نشد.");
      }
      insertHtml(
        imageToEditorHtml({
          type: "image",
          src: payload.url,
          width: payload.width,
          height: payload.height,
          alt,
          caption: imageCaption.trim(),
        }) + "<p><br></p>",
        true,
      );
      setPanel(null);
      onMessage("تصویر در محل انتخاب‌شده قرار گرفت؛ برای ثبت نهایی، مطلب را ذخیره کنید.");
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "آپلود تصویر داخل متن انجام نشد.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  function insertTable() {
    const rows = Math.min(MAX_TABLE_ROWS, Math.max(1, Math.trunc(tableRows) || 1));
    const columns = Math.min(MAX_TABLE_COLUMNS, Math.max(1, Math.trunc(tableColumns) || 1));
    insertHtml(
      tableToEditorHtml({
        type: "table",
        headerRow: tableHeader,
        caption: tableCaption.trim(),
        rows: Array.from({ length: rows }, () => Array.from({ length: columns }, () => [])),
      }) + "<p><br></p>",
      true,
    );
    setPanel(null);
    onMessage("جدول اضافه شد. برای نوشتن یا تغییر سطر و ستون، داخل خانه‌های آن کلیک کنید.");
  }

  function changeTable(
    action: "add-row" | "add-column" | "remove-row" | "remove-column" | "remove",
  ) {
    const cell = selectedCell.current;
    const table = cell?.closest("table");
    const wrapper = table?.closest<HTMLElement>(".rich-editor-table-wrap") ?? table;
    if (!cell || !table || !wrapper || !editorRef.current?.contains(table)) return;
    if (action === "remove") {
      replaceBlock(wrapper, "<p><br></p>");
      setTableActive(false);
      return;
    }
    const rowIndex = (cell.parentElement as HTMLTableRowElement).rowIndex;
    const columnIndex = cell.cellIndex;
    const holder = document.createElement("div");
    holder.append(table.cloneNode(true));
    const block = editorToDocument(holder).blocks[0] as RichTextTableBlock | undefined;
    if (!block || block.type !== "table" || !block.rows[0]) return;
    const columns = block.rows[0].length;
    if (action === "add-row") {
      if (block.rows.length >= MAX_TABLE_ROWS) {
        onError("حداکثر تعداد سطر جدول ۳۰ است.");
        return;
      }
      block.rows.splice(
        rowIndex + 1,
        0,
        Array.from({ length: columns }, () => []),
      );
    }
    if (action === "add-column") {
      if (columns >= MAX_TABLE_COLUMNS) {
        onError("حداکثر تعداد ستون جدول ۸ است.");
        return;
      }
      block.rows.forEach((row) => row.splice(columnIndex + 1, 0, []));
    }
    if (action === "remove-row") {
      block.rows.splice(rowIndex, 1);
      if (rowIndex === 0) block.headerRow = false;
    }
    if (action === "remove-column") block.rows.forEach((row) => row.splice(columnIndex, 1));
    replaceBlock(wrapper, block.rows[0]?.length ? tableToEditorHtml(block) : "<p><br></p>");
    setTableActive(false);
    selectedCell.current = null;
  }

  const formatting = [
    { name: "متن معمولی", command: "formatBlock", value: "p", icon: Type },
    { name: "تیتر سطح دو", command: "formatBlock", value: "h2", icon: Heading2 },
    { name: "تیتر سطح سه", command: "formatBlock", value: "h3", icon: Heading3 },
    { name: "پررنگ", command: "bold", icon: Bold },
    { name: "مورب", command: "italic", icon: Italic },
    { name: "پاک‌کردن قالب‌بندی", command: "removeFormat", icon: RemoveFormatting },
    { name: "فهرست نشانه‌دار", command: "insertUnorderedList", icon: List },
    { name: "فهرست شماره‌دار", command: "insertOrderedList", icon: ListOrdered },
    { name: "نقل‌قول", command: "formatBlock", value: "blockquote", icon: Quote },
  ];

  return (
    <div className="mt-2 min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-100">
      <div
        role="toolbar"
        aria-label="ابزارهای ویرایش متن"
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2"
      >
        <button
          type="button"
          disabled={locked}
          className={toolbarButton}
          aria-label="بازگشت"
          title="بازگشت"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("undo")}
        >
          <Undo2 size={17} />
        </button>
        <button
          type="button"
          disabled={locked}
          className={toolbarButton}
          aria-label="انجام دوباره"
          title="انجام دوباره"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("redo")}
        >
          <Redo2 size={17} />
        </button>
        {formatting.map((item) => (
          <button
            key={item.name}
            type="button"
            disabled={locked}
            className={toolbarButton}
            aria-label={item.name}
            title={item.name}
            onMouseDown={(event) => {
              event.preventDefault();
              rememberSelection();
            }}
            onClick={() => command(item.command, item.value)}
          >
            <item.icon size={18} aria-hidden="true" />
          </button>
        ))}
        <button
          type="button"
          disabled={locked}
          className={toolbarButton}
          aria-label="لینک"
          title="لینک"
          onMouseDown={(event) => {
            event.preventDefault();
            rememberSelection();
          }}
          onClick={addLink}
        >
          <Link2 size={17} />
        </button>
        <span className="mr-auto flex flex-wrap gap-1">
          <button
            type="button"
            disabled={locked}
            className={toolbarButton + " text-cyan-800"}
            aria-label="افزودن جدول"
            aria-expanded={panel === "table"}
            onMouseDown={(event) => {
              event.preventDefault();
              rememberSelection();
            }}
            onClick={() => {
              setPanel(panel === "table" ? null : "table");
            }}
          >
            <Table2 size={18} aria-hidden="true" />
            جدول
          </button>
          <button
            type="button"
            disabled={locked}
            className={toolbarButton + " text-cyan-800"}
            aria-label="افزودن تصویر به متن"
            aria-expanded={panel === "image"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => openImage()}
          >
            <ImagePlus size={18} aria-hidden="true" />
            تصویر میان متن
          </button>
        </span>
      </div>

      {panel === "table" ? (
        <div className="border-b border-cyan-100 bg-cyan-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-900">افزودن جدول به متن</p>
            <button
              type="button"
              aria-label="بستن افزودن جدول"
              onClick={() => setPanel(null)}
              className={toolbarButton}
            >
              <X size={17} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs font-bold text-slate-700">
              تعداد سطرها
              <input
                type="number"
                min={1}
                max={MAX_TABLE_ROWS}
                value={tableRows}
                onChange={(event) => setTableRows(Number(event.target.value))}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              تعداد ستون‌ها
              <input
                type="number"
                min={1}
                max={MAX_TABLE_COLUMNS}
                value={tableColumns}
                onChange={(event) => setTableColumns(Number(event.target.value))}
                className={inputClass}
              />
            </label>
            <label className="col-span-2 text-xs font-bold text-slate-700">
              عنوان جدول (اختیاری)
              <input
                maxLength={240}
                value={tableCaption}
                onChange={(event) => setTableCaption(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={tableHeader}
              onChange={(event) => setTableHeader(event.target.checked)}
              className="size-4 accent-cyan-700"
            />
            سطر اول عنوان ستون‌ها باشد
          </label>
          <button
            type="button"
            onClick={insertTable}
            className="mt-4 min-h-11 rounded-lg bg-cyan-700 px-4 text-sm font-bold text-white hover:bg-cyan-800"
          >
            درج جدول در متن
          </button>
        </div>
      ) : null}

      {panel === "image" ? (
        <div className="border-b border-cyan-100 bg-cyan-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-900">
                {editingImage ? "ویرایش تصویر میان متن" : "افزودن تصویر میان متن"}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-600">
                ابتدا محل تصویر را در متن انتخاب کنید. تصویر با نسبت اصلی نمایش داده می‌شود.
              </p>
            </div>
            <button
              type="button"
              disabled={uploading}
              aria-label="بستن افزودن تصویر"
              onClick={() => setPanel(null)}
              className={toolbarButton}
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-700">
              توضیح تصویر برای دسترس‌پذیری
              <input
                value={imageAlt}
                maxLength={180}
                disabled={uploading}
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="محتوای تصویر را توصیف کنید"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              زیرنویس تصویر (اختیاری)
              <input
                value={imageCaption}
                maxLength={240}
                disabled={uploading}
                onChange={(event) => setImageCaption(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {editingImage ? (
              <>
                <button
                  type="button"
                  disabled={imageAlt.trim().length < 3}
                  onClick={saveImageDetails}
                  className={actionClass}
                >
                  ثبت توضیحات تصویر
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedFigure.current) replaceBlock(selectedFigure.current, "<p><br></p>");
                    selectedFigure.current = null;
                    setPanel(null);
                  }}
                  className={actionClass + " text-rose-700"}
                >
                  حذف تصویر از متن
                </button>
              </>
            ) : (
              <label
                htmlFor={uploadId}
                className={
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black text-white focus-within:ring-2 focus-within:ring-cyan-400 " +
                  (imageAlt.trim().length >= 3 && !locked
                    ? "cursor-pointer bg-cyan-700 hover:bg-cyan-800"
                    : "cursor-not-allowed bg-slate-400")
                }
              >
                {uploading ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <ImagePlus size={17} />
                )}
                {uploading ? "در حال آپلود..." : "انتخاب تصویر"}
                <input
                  id={uploadId}
                  aria-label="فایل تصویر میان متن"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  disabled={locked || imageAlt.trim().length < 3}
                  onChange={(event) => void uploadInlineImage(event)}
                />
              </label>
            )}
          </div>
          {!editingImage ? (
            <p className="mt-2 text-xs text-slate-600">
              JPEG، PNG، WebP یا AVIF؛ حداکثر ۸ مگابایت.
            </p>
          ) : null}
        </div>
      ) : null}

      {tableActive && !panel ? (
        <div
          role="group"
          aria-label="ویرایش جدول انتخاب‌شده"
          className="flex flex-wrap gap-2 border-b border-slate-200 bg-cyan-50 p-3"
        >
          {(
            [
              { action: "add-row", label: "افزودن سطر بعد" },
              { action: "add-column", label: "افزودن ستون بعد" },
              { action: "remove-row", label: "حذف سطر" },
              { action: "remove-column", label: "حذف ستون" },
              { action: "remove", label: "حذف جدول" },
            ] as const
          ).map((item) => (
            <button
              type="button"
              disabled={locked}
              key={item.action}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => changeTable(item.action)}
              className={actionClass}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={editorRef}
        contentEditable={!locked}
        aria-disabled={locked}
        role="textbox"
        aria-label="متن اصلی"
        aria-multiline="true"
        data-placeholder="مقدمه را بنویسید و با تیتر، فهرست، جدول و تصویر ساختار دهید…"
        suppressContentEditableWarning
        onInput={sync}
        onBlur={rememberSelection}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          const figure = target.closest<HTMLElement>("figure");
          if (figure && !locked) openImage(figure);
        }}
        onKeyDown={(event) => {
          const figure = (event.target as HTMLElement).closest<HTMLElement>("figure");
          if (figure && (event.key === "Enter" || event.key === " ") && !locked) {
            event.preventDefault();
            openImage(figure);
          }
        }}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
          sync();
        }}
        className="rich-text-editor min-h-[36rem] min-w-0 px-5 py-5 text-base leading-8 text-slate-800 outline-none sm:px-7 sm:py-6 lg:min-h-[42rem]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
        <span>برای ویرایش توضیحات یا حذف تصویر، روی آن کلیک کنید.</span>
        <span className={characters >= 300 ? "font-bold text-emerald-700" : "text-amber-700"}>
          {characters.toLocaleString("fa-IR")} کاراکتر
        </span>
      </div>
    </div>
  );
}
