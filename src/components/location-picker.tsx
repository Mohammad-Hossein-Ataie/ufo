"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Search, MapPin } from "lucide-react";
import type { ShippingAddress, SalesChannel } from "@ufo/types";
import { authHeaders } from "@/lib/customer-client";

type Point = NonNullable<ShippingAddress["location"]>;
export function LocationPicker({
  value,
  onChange,
  channel,
}: {
  value?: Point | undefined;
  onChange: (point: Point | undefined) => void;
  channel: SalesChannel;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const change = useRef(onChange);
  change.current = onChange;
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [results, setResults] = useState<Array<Point & { label: string; id: string }>>([]);
  useEffect(() => {
    let disposed = false;
    void import("leaflet")
      .then((L) => {
        if (disposed || !container.current) return;
        const instance = L.map(container.current, { scrollWheelZoom: false }).setView(
          [35.6892, 51.389],
          11,
        );
        map.current = instance;
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
          .addTo(instance)
          .on("tileerror", () =>
            setMessage("نقشه بارگیری نشد؛ می‌توانید مختصات را دستی وارد کنید."),
          );
        const pin = L.marker([35.6892, 51.389], {
          draggable: true,
          opacity: 0,
          icon: L.divIcon({
            className: "",
            html: '<span style="display:block;width:24px;height:24px;border-radius:50% 50% 50% 0;background:#06b6d4;border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 8px #0008"></span>',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          }),
        }).addTo(instance);
        marker.current = pin;
        const select = (latitude: number, longitude: number) => {
          if (latitude < 24 || latitude > 40 || longitude < 43 || longitude > 64) {
            setMessage("موقعیت را در ایران انتخاب کنید.");
            return;
          }
          change.current({ latitude, longitude });
          setMessage("");
        };
        instance.on("click", (event) => select(event.latlng.lat, event.latlng.lng));
        pin.on("dragend", () => {
          const p = pin.getLatLng();
          select(p.lat, p.lng);
        });
        setReady(true);
      })
      .catch(() => setMessage("بارگیری نقشه انجام نشد. مختصات را دستی وارد کنید."));
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (value) {
      marker.current?.setLatLng([value.latitude, value.longitude]).setOpacity(1);
      map.current?.setView([value.latitude, value.longitude], 16);
    } else marker.current?.setOpacity(0);
  }, [value, ready]);
  async function search() {
    setBusy(true);
    setMessage("");
    setResults([]);
    try {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`, {
        headers: authHeaders(channel),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "جست‌وجو انجام نشد.");
      setResults(payload.results);
      if (!payload.results.length) setMessage("مکانی پیدا نشد؛ نام شهر و خیابان را وارد کنید.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "جست‌وجو انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      setMessage("مرورگر موقعیت‌یابی را پشتیبانی نمی‌کند.");
      return;
    }
    setMessage("در حال دریافت موقعیت...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (
          coords.latitude < 24 ||
          coords.latitude > 40 ||
          coords.longitude < 43 ||
          coords.longitude > 64
        ) {
          setMessage("موقعیت دریافت‌شده در محدوده ایران نیست.");
          return;
        }
        onChange({ latitude: coords.latitude, longitude: coords.longitude });
        setMessage("");
      },
      () => setMessage("دسترسی به موقعیت ممکن نیست؛ روی نقشه انتخاب کنید یا مختصات را وارد کنید."),
      { timeout: 12000, enableHighAccuracy: true },
    );
  }
  return (
    <section className="grid gap-3 rounded-2xl border border-white/10 p-4 sm:col-span-2">
      <h3 className="flex items-center gap-2 font-bold">
        <MapPin size={18} /> موقعیت روی نقشه <span className="text-xs font-normal">(اختیاری)</span>
      </h3>
      <p className="text-xs leading-6">
        نام شهر، محله یا خیابان را جست‌وجو کنید و روی محل تحویل بزنید. جست‌وجو توسط OpenStreetMap
        انجام می‌شود؛ پلاک و اطلاعات شخصی را در نشانی کامل بنویسید.
      </p>
      <div className="flex gap-2">
        <input
          aria-label="جست‌وجوی مکان"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (query.trim().length >= 3 && !busy) void search();
            }
          }}
          className="min-w-0 flex-1 rounded-xl border border-white/20 bg-[#090d13] p-3 text-white"
          placeholder="مثلاً تهران، میدان آزادی"
          maxLength={120}
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={busy || query.trim().length < 3}
          className="rounded-xl bg-cyan-400 px-3 text-slate-950 disabled:opacity-40"
          aria-label="جست‌وجو"
        >
          <Search size={20} />
        </button>
      </div>
      {results.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => {
            onChange({ latitude: r.latitude, longitude: r.longitude });
            setResults([]);
          }}
          className="rounded-lg border border-current/20 p-3 text-right text-sm"
        >
          {r.label}
        </button>
      ))}
      <div
        ref={container}
        className="relative z-0 h-72 overflow-hidden rounded-xl"
        aria-label="نقشه انتخاب موقعیت"
      />
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={locate} className="flex min-h-11 items-center gap-2 text-sm">
          <LocateFixed size={18} /> موقعیت فعلی من
        </button>
        {value && (
          <button type="button" onClick={() => onChange(undefined)} className="text-sm">
            حذف موقعیت
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["latitude", "longitude"] as const).map((key) => (
          <label key={key} className="grid gap-1 text-xs">
            {key === "latitude" ? "عرض جغرافیایی" : "طول جغرافیایی"}
            <input
              type="number"
              step="any"
              min={key === "latitude" ? 24 : 43}
              max={key === "latitude" ? 40 : 64}
              dir="ltr"
              value={value?.[key] ?? ""}
              onChange={(e) => {
                if (e.target.value === "") {
                  onChange(undefined);
                  return;
                }
                onChange({
                  latitude: value?.latitude ?? 35.6892,
                  longitude: value?.longitude ?? 51.389,
                  [key]: Number(e.target.value),
                });
              }}
              className="min-w-0 rounded-lg border border-white/20 bg-[#090d13] p-3 text-white"
            />
          </label>
        ))}
      </div>
      {message && (
        <p role="status" className="text-xs leading-6">
          {message}
        </p>
      )}
    </section>
  );
}
