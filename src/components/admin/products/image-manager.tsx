"use client";
import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Eye, GripVertical, UploadCloud } from "lucide-react";
import { Button, Input } from "@ufo/ui";
// Uses existing protected derivative URLs; never requests private originals.
function Preview({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-contain"
    />
  );
}
export default function ImageManager({
  images,
  busy,
  onUpload,
  onChange,
  renderAssignment,
  pending,
}: {
  images: string[];
  busy: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onChange: (images: string[]) => void;
  renderAssignment?: (url: string) => ReactNode;
  pending: Array<{ id: string; previewUrl: string; name: string; failed: boolean }>;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [preview, setPreview] = useState("");
  const [url, setUrl] = useState("");
  function move(from: number, to: number) {
    if (busy || to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    onChange(next);
  }
  return (
    <section className="grid gap-4" aria-label="مدیریت تصاویر">
      <div>
        <h3 className="font-black">تصاویر محصول</h3>
        <p className="mt-2 text-sm text-slate-500">
          اولین تصویر، تصویر اصلی است. برای مرتب‌سازی بکشید یا از دکمه‌های جابه‌جایی استفاده کنید.
        </p>
      </div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!busy) void onUpload(Array.from(e.dataTransfer.files));
        }}
        className={`relative grid min-h-36 cursor-pointer place-items-center rounded-lg border-2 border-dashed p-5 text-center ${over ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"}`}
      >
        <input
          aria-label="آپلود تصاویر محصول"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void onUpload(files);
          }}
        />
        <span className="grid justify-items-center gap-2">
          <UploadCloud className="text-blue-500" />
          <strong>{busy ? "در حال آپلود…" : "تصاویر را رها کنید یا انتخاب کنید"}</strong>
          <span className="text-xs text-slate-500">
            PNG، JPG، WebP، AVIF · حداکثر ۸ مگابایت برای هر تصویر
          </span>
        </span>
      </label>
      <div className="flex gap-2">
        <Input
          dir="ltr"
          aria-label="نشانی تصویر"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/images/product.png یا https://…"
        />
        <Button
          variant="secondary"
          disabled={busy || !/^(https:\/\/|\/(?!\/))/.test(url.trim())}
          onClick={() => {
            onChange([...images, url.trim()]);
            setUrl("");
          }}
        >
          افزودن نشانی
        </Button>
      </div>
      {!images.length && !pending.length && (
        <p className="rounded-md bg-slate-50 p-6 text-center text-sm text-slate-500">
          هنوز تصویری اضافه نشده است.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pending.map((item) => (
          <div key={item.id} className="rounded-md border p-3">
            <div className="h-32">
              <Preview src={item.previewUrl} alt={item.name} />
            </div>
            <p role="status" className="mt-2 text-sm">
              {item.failed ? "آپلود ناموفق؛ فایل را دوباره انتخاب کنید." : "در حال آپلود…"}
            </p>
          </div>
        ))}
        {images.map((image, index) => (
          <div
            key={image}
            draggable={!busy}
            onDragStart={(e) => {
              setDrag(index);
              e.dataTransfer.setData("text/plain", String(index));
            }}
            onDragEnd={() => setDrag(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (drag !== null) move(drag, index);
              setDrag(null);
            }}
            className={`overflow-hidden rounded-md border bg-white ${index === 0 ? "border-blue-400 ring-2 ring-blue-50" : "border-slate-200"}`}
          >
            <div className="relative h-44 bg-slate-50 p-3">
              <Preview src={image} alt={`تصویر ${index + 1}`} />
              <span className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs">
                {index === 0 ? "تصویر اصلی" : `تصویر ${(index + 1).toLocaleString("fa-IR")}`}
              </span>
              <GripVertical size={18} className="absolute left-2 top-3 text-slate-400" />
            </div>
            <div className="flex flex-wrap gap-1 p-2">
              <Button
                variant="secondary"
                disabled={busy || index === 0}
                onClick={() => move(index, 0)}
              >
                اصلی
              </Button>
              <button
                type="button"
                aria-label={`انتقال تصویر ${index + 1} به قبل`}
                disabled={busy || index === 0}
                onClick={() => move(index, index - 1)}
                className="rounded border p-2 disabled:opacity-30"
              >
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                aria-label={`انتقال تصویر ${index + 1} به بعد`}
                disabled={busy || index === images.length - 1}
                onClick={() => move(index, index + 1)}
                className="rounded border p-2 disabled:opacity-30"
              >
                <ArrowLeft size={15} />
              </button>
              <button
                type="button"
                aria-label={`پیش‌نمایش تصویر ${index + 1}`}
                onClick={() => setPreview(image)}
                className="rounded border p-2"
              >
                <Eye size={15} />
              </button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => onChange(images.filter((_, i) => i !== index))}
              >
                حذف
              </Button>
            </div>
            {renderAssignment?.(image)}
          </div>
        ))}
      </div>
      <Dialog.Root
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview("");
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70" />
          <Dialog.Content
            dir="rtl"
            className="fixed left-1/2 top-1/2 z-[85] w-[min(90vw,48rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-5"
          >
            <Dialog.Title className="font-bold">پیش‌نمایش تصویر</Dialog.Title>
            <Dialog.Description className="sr-only">تصویر انتخاب‌شدهٔ محصول</Dialog.Description>
            <div className="my-4 h-[60vh]">
              {preview && <Preview src={preview} alt="پیش‌نمایش محصول" />}
            </div>
            <Dialog.Close asChild>
              <Button variant="secondary">بستن پیش‌نمایش</Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
