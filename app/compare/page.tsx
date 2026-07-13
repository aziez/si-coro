"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompare } from "@/hooks/useCompare";
import { ArrowLeft, MapPin, Scales, Buildings, Train, Drop, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getDistanceToJakarta, getNearestStation } from "@/lib/geoUtils";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TipeItem {
  harga: number;
  luasTanah?: number;
  luasBangunan?: number;
  spesifikasiAtap?: string;
  spesifikasiDinding?: string;
}

interface DetailData {
  namaPerumahan: string;
  namaPengembang: string;
  jenisPerumahan: number;
  alamat: string;
  idLokasi: string;
  foto: string[];
  koordinat: { lat: number; lon: number };
  koordinatPerumahan?: string | null;
  tipeRumah?: TipeItem[];
  tipeRusun?: TipeItem[];
}

interface CompareData {
  detail: DetailData;
  tipeList: TipeItem[];
  distanceToJakarta: number | null;
  nearestStation: string | null;
  floodRisk: string | null;
  floodSafe: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const getImageUrl = (url: string | undefined | null) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://sikumbang.tapera.go.id${url.startsWith("/") ? "" : "/"}${url}`;
};

// Row for compare table
function CompareRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr] gap-0 border-t border-border/50">
      <div className="bg-muted/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ComparePage() {
  const router = useRouter();
  const { compareList, toggleCompare } = useCompare();
  const [dataList, setDataList] = useState<CompareData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareList.length === 0) { setLoading(false); return; }

    setLoading(true);
    Promise.all(
      compareList.map(async house => {
        const res = await fetch(`https://sikumbang.tapera.go.id/lokasi-perumahan/${house.idLokasi}/json`);
        const json = await res.json();
        const detail = json.detail as DetailData;
        const tipeList = [...(detail.tipeRumah ?? []), ...(detail.tipeRusun ?? [])];

        let lat: number | undefined, lon: number | undefined;
        if (detail?.koordinat?.lat !== undefined) {
          lat = parseFloat(String(detail.koordinat.lat));
          lon = parseFloat(String(detail.koordinat.lon));
        } else if (detail?.koordinatPerumahan) {
          const [a, b] = String(detail.koordinatPerumahan).split(",");
          lat = parseFloat(a?.trim());
          lon = parseFloat(b?.trim());
        }

        let distanceToJakarta = null;
        let nearestStation = null;
        let floodRisk = null;
        let floodSafe = false;

        if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
          distanceToJakarta = getDistanceToJakarta(lat, lon);
          const s = getNearestStation(lat, lon);
          nearestStation = `${s.station.name} (${s.distance.toFixed(1)} km)`;
          try {
            const fd = await fetch(`/api/inarisk?lat=${lat}&lon=${lon}`);
            const fj = await fd.json();
            if (fj.success) { floodRisk = fj.riskLevel; floodSafe = fj.isFloodFree; }
          } catch { /* silently fail */ }
        }

        return { detail, tipeList, distanceToJakarta, nearestStation, floodRisk, floodSafe };
      })
    )
      .then(setDataList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [compareList]);

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 glass-header border-b border-border/50 h-14" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-3">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Empty ──────────────────────────────────────────────────────────────

  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-5">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <Scales className="w-10 h-10 text-muted-foreground" weight="duotone" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-1.5">Belum ada properti dipilih</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Pilih minimal 2 properti dari halaman utama menggunakan tombol ⚖ untuk membandingkannya.
          </p>
        </div>
        <Button onClick={() => router.push("/")} size="lg" className="rounded-full px-8">
          Cari Properti Sekarang
        </Button>
      </div>
    );
  }

  // ─── Compare Table ───────────────────────────────────────────────────────

  const COMPARE_ROWS: { key: keyof CompareData | string; label: string }[] = [
    { key: "priceRange", label: "Rentang Harga" },
    { key: "luasTanah", label: "Luas Tanah (Min)" },
    { key: "luasBangunan", label: "Luas Bangunan (Min)" },
    { key: "distanceToJakarta", label: "Jarak ke Jakarta" },
    { key: "nearestStation", label: "Stasiun KRL Terdekat" },
    { key: "floodRisk", label: "Risiko Banjir" },
    { key: "spesifikasiAtap", label: "Spesifikasi Atap" },
    { key: "spesifikasiDinding", label: "Spesifikasi Dinding" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Nav */}
      <div className="sticky top-0 z-50 glass-header border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali
          </Button>
          <div className="font-bold text-sm flex items-center gap-1.5">
            <Scales weight="fill" className="text-primary" />
            Bandingkan {dataList.length} Properti
          </div>
          <div className="w-20" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-6">
          {/* Compare grid */}
          <div className="flex gap-3 min-w-max">
            {dataList.map((d, idx) => {
              const sorted = [...d.tipeList].sort((a, b) => a.harga - b.harga);
              const cheap = sorted[0];
              const exp = sorted[sorted.length - 1];
              const priceRange = cheap && exp && cheap.harga !== exp.harga
                ? `${formatRupiah(cheap.harga)} – ${formatRupiah(exp.harga)}`
                : cheap ? formatRupiah(cheap.harga) : "Hubungi Pengembang";

              return (
                <div key={d.detail?.idLokasi ?? idx} className="w-72 shrink-0">
                  <Card className="overflow-hidden border-border/50 shadow-sm">
                    {/* Card header */}
                    <div className="relative group">
                      <button
                        onClick={() => toggleCompare({ idLokasi: d.detail.idLokasi, namaPerumahan: d.detail.namaPerumahan, foto: d.detail.foto } as any)}
                        className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground text-xs font-semibold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Hapus
                      </button>
                      <div className="relative h-40 w-full bg-muted overflow-hidden">
                        {d.detail?.foto?.[0] ? (
                          <Image src={getImageUrl(d.detail.foto[0])} alt={d.detail.namaPerumahan} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Buildings className="w-8 h-8 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4 pb-3 space-y-1.5">
                      <Link href={`/perumahan/${d.detail?.idLokasi}`} className="hover:underline">
                        <h3 className="font-bold leading-tight line-clamp-2 text-sm">{d.detail?.namaPerumahan}</h3>
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-1">{d.detail?.namaPengembang}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" /> {d.detail?.alamat}
                      </p>
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        {d.detail?.jenisPerumahan === 0 ? "Rumah Tapak" : "Rumah Susun"}
                      </Badge>
                    </CardContent>

                    <Separator />

                    {/* Data rows */}
                    <div className="divide-y divide-border/50 text-sm">
                      {/* Harga */}
                      <div className="px-4 py-3">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">Rentang Harga</p>
                        <span className="font-bold text-primary text-sm">{priceRange}</span>
                      </div>

                      {/* Luas */}
                      <div className="px-4 py-2.5 flex justify-between">
                        <span className="text-muted-foreground text-xs">Luas Tanah</span>
                        <span className="font-medium text-xs">{cheap?.luasTanah ?? "—"} m²</span>
                      </div>
                      <div className="px-4 py-2.5 flex justify-between">
                        <span className="text-muted-foreground text-xs">Luas Bangunan</span>
                        <span className="font-medium text-xs">{cheap?.luasBangunan ?? "—"} m²</span>
                      </div>

                      {/* Geo */}
                      <div className="px-4 py-2.5 flex items-center gap-1.5">
                        <MapPin weight="duotone" className="text-blue-500 w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs">{d.distanceToJakarta ? `${d.distanceToJakarta.toFixed(1)} km ke Jakarta` : "—"}</span>
                      </div>
                      <div className="px-4 py-2.5 flex items-start gap-1.5">
                        <Train weight="duotone" className="text-emerald-500 w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="text-xs line-clamp-2 leading-relaxed">{d.nearestStation ?? "—"}</span>
                      </div>

                      {/* Flood risk */}
                      <div className={cn("px-4 py-2.5 flex items-center gap-1.5",
                        d.floodRisk == null ? "" : d.floodSafe ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "bg-red-50/50 dark:bg-red-900/10"
                      )}>
                        {d.floodRisk == null
                          ? <Drop weight="duotone" className="text-muted-foreground w-3.5 h-3.5 shrink-0" />
                          : d.floodSafe
                            ? <ShieldCheck weight="duotone" className="text-emerald-600 w-3.5 h-3.5 shrink-0" />
                            : <WarningCircle weight="duotone" className="text-red-600 w-3.5 h-3.5 shrink-0" />
                        }
                        <span className={cn("text-xs font-medium",
                          d.floodRisk == null ? "text-muted-foreground" : d.floodSafe ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                        )}>
                          {d.floodRisk ? `Risiko ${d.floodRisk}` : "Data tidak tersedia"}
                        </span>
                      </div>

                      {/* Specs */}
                      <div className="px-4 py-2.5">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">Atap</p>
                        <p className="text-xs line-clamp-2">{cheap?.spesifikasiAtap ?? "—"}</p>
                      </div>
                      <div className="px-4 py-2.5">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">Dinding</p>
                        <p className="text-xs line-clamp-2">{cheap?.spesifikasiDinding ?? "—"}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
