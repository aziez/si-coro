"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCompare } from "@/hooks/useCompare"
import {
  ArrowLeft,
  MapPin,
  Scales,
  Buildings,
  Train,
  Drop,
  ShieldCheck,
  WarningCircle,
  X,
  Trophy,
  ArrowRight,
  Trash,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getDistanceToJakarta,
  getNearestStation,
  isWithinKrlService,
} from "@/lib/geoUtils"
import { cn } from "@/lib/utils"
import { SiCoroLogo } from "@/components/SiCoroLogo"
import type { Perumahan } from "@/components/HouseCard"

// ─── Types ───────────────────────────────────────────────────────────────────

interface TipeItem {
  harga: number
  status?: string
  luasTanah?: number
  luasBangunan?: number
  spesifikasiAtap?: string
  spesifikasiDinding?: string
}

interface DetailData {
  namaPerumahan: string
  namaPengembang: string
  jenisPerumahan: number
  alamat: string
  idLokasi: string
  foto: string[]
  koordinat: { lat: number; lon: number }
  koordinatPerumahan?: string | null
  tipeRumah?: TipeItem[]
  tipeRusun?: TipeItem[]
}

interface CompareData {
  detail: DetailData
  tipeList: TipeItem[]
  minPrice: number | null
  maxLand: number | null
  distanceToJakarta: number | null
  nearestStation: string | null
  nearestStationKm: number | null
  floodRisk: string | null
  floodSafe: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)

const formatEstCicilan = (harga: number) => {
  if (!harga || harga <= 0) return "—"
  const plafon = harga * 0.99
  const r = 0.05 / 12
  const months = 15 * 12
  const monthly =
    (plafon * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1)
  return `${formatRupiah(Math.round(monthly))}/bln`
}

const getImageUrl = (url: string | undefined | null) => {
  if (!url) return ""
  return url.startsWith("http")
    ? url
    : `https://sikumbang.tapera.go.id${url.startsWith("/") ? "" : "/"}${url}`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ComparePage() {
  const router = useRouter()
  const { compareList, toggleCompare, clearCompare } = useCompare()
  const [dataList, setDataList] = useState<CompareData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (compareList.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all(
      compareList.map(async (house) => {
        const res = await fetch(
          `https://sikumbang.tapera.go.id/lokasi-perumahan/${house.idLokasi}/json`
        )
        const json = await res.json()
        const detail = json.detail as DetailData
        const bangunanTipe = Array.isArray(json.bangunan)
          ? json.bangunan.map((b: { tipe: TipeItem }) => b.tipe).filter(Boolean)
          : []
        const tipeList = [
          ...(detail.tipeRumah ?? []),
          ...(detail.tipeRusun ?? []),
          ...bangunanTipe,
        ]

        const sortedPrices = tipeList
          .map((t) => t.harga)
          .filter((h) => typeof h === "number" && h > 0)
          .sort((a, b) => a - b)
        const minPrice = sortedPrices[0] ?? null

        const sortedLand = tipeList
          .map((t) => t.luasTanah ?? 0)
          .filter((l) => l > 0)
          .sort((a, b) => b - a)
        const maxLand = sortedLand[0] ?? null

        let lat: number | undefined, lon: number | undefined
        if (detail?.koordinat?.lat !== undefined) {
          lat = parseFloat(String(detail.koordinat.lat))
          lon = parseFloat(String(detail.koordinat.lon))
        } else if (detail?.koordinatPerumahan) {
          const [a, b] = String(detail.koordinatPerumahan).split(",")
          lat = parseFloat(a?.trim())
          lon = parseFloat(b?.trim())
        }

        let distanceToJakarta = null
        let nearestStation = null
        let nearestStationKm = null
        let floodRisk = null
        let floodSafe = false

        if (
          lat !== undefined &&
          lon !== undefined &&
          !isNaN(lat) &&
          !isNaN(lon)
        ) {
          distanceToJakarta = getDistanceToJakarta(lat, lon)
          const s = getNearestStation(lat, lon)
          if (isWithinKrlService(s.distance)) {
            nearestStation = `${s.station.name} (${s.distance.toFixed(1)} km)`
            nearestStationKm = s.distance
          } else {
            nearestStation = "Di luar jangkauan KRL"
          }
          try {
            const fd = await fetch(`/api/inarisk?lat=${lat}&lon=${lon}`)
            const fj = await fd.json()
            if (fj.success && fj.isFloodFree !== null) {
              floodRisk = fj.riskLevel
              floodSafe = fj.isFloodFree
            }
          } catch {
            /* silently fail */
          }
        }

        return {
          detail,
          tipeList,
          minPrice,
          maxLand,
          distanceToJakarta,
          nearestStation,
          nearestStationKm,
          floodRisk,
          floodSafe,
        }
      })
    )
      .then(setDataList)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [compareList])

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="glass-header sticky top-0 z-50 h-16 border-b border-border/50" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-2xl border p-4">
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Empty ──────────────────────────────────────────────────────────────

  if (compareList.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Scales className="h-10 w-10" weight="duotone" />
        </div>
        <div>
          <h2 className="mb-1.5 text-2xl font-black">
            Belum Ada Perumahan Dipilih
          </h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Pilih minimal 2 perumahan dari halaman utama menggunakan ikon ⚖
            untuk membandingkan harga, risiko banjir, dan akses KRL.
          </p>
        </div>
        <Button
          onClick={() => router.push("/")}
          size="lg"
          className="rounded-full px-8 font-bold shadow-md shadow-primary/20"
        >
          Cari Perumahan Sekarang
        </Button>
      </div>
    )
  }

  // ─── Compute Winner Benchmarks ───────────────────────────────────────────

  const validPrices = dataList
    .map((d) => d.minPrice)
    .filter((v): v is number => v !== null && v > 0)
  const bestPrice = validPrices.length > 1 ? Math.min(...validPrices) : null

  const validKrlKm = dataList
    .map((d) => d.nearestStationKm)
    .filter((v): v is number => v !== null)
  const bestKrlKm = validKrlKm.length > 1 ? Math.min(...validKrlKm) : null

  const validJakartaKm = dataList
    .map((d) => d.distanceToJakarta)
    .filter((v): v is number => v !== null)
  const bestJakartaKm =
    validJakartaKm.length > 1 ? Math.min(...validJakartaKm) : null

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Branded Header */}
      <div className="glass-header sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full font-bold"
              onClick={() => router.push("/")}
            >
              <ArrowLeft weight="bold" className="mr-1.5 h-4 w-4" /> Kembali
            </Button>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <Link href="/" className="hidden sm:inline-flex">
              <SiCoroLogo size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-sm font-extrabold">
            <Scales weight="fill" className="h-4 w-4 text-primary" />
            <span>Bandingkan ({dataList.length}/3)</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompare}
            className="h-8 gap-1 rounded-full text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash weight="bold" className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kosongkan</span>
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Perbandingan Isi &amp; Risiko Perumahan
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Bandingkan harga, estimasi cicilan FLPP, jarak stasiun KRL, risiko
              banjir InaRISK, dan spesifikasi bangunan berdampingan.
            </p>
          </div>
          {dataList.length < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="self-start rounded-full text-xs font-bold sm:self-auto"
            >
              + Tambah {3 - dataList.length} Perumahan Lagi
            </Button>
          )}
        </div>

        {/* Horizontal Scrollable Comparison Grid on Mobile, 3-Col Grid on Desktop */}
        <div className="-mx-4 overflow-x-auto px-4 pb-6 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-4 lg:grid lg:min-w-0 lg:grid-cols-3">
            {dataList.map((d, idx) => {
              const sorted = [...d.tipeList].sort((a, b) => a.harga - b.harga)
              const cheap = sorted[0]
              const exp = sorted[sorted.length - 1]
              const priceRange =
                cheap && exp && cheap.harga !== exp.harga
                  ? `${formatRupiah(cheap.harga)} – ${formatRupiah(exp.harga)}`
                  : cheap
                    ? formatRupiah(cheap.harga)
                    : "Hubungi Pengembang"

              const isCheapest =
                bestPrice !== null && d.minPrice === bestPrice
              const isClosestKrl =
                bestKrlKm !== null && d.nearestStationKm === bestKrlKm
              const isClosestJakarta =
                bestJakartaKm !== null &&
                d.distanceToJakarta === bestJakartaKm

              return (
                <div
                  key={d.detail?.idLokasi ?? idx}
                  className="w-80 shrink-0 lg:w-auto"
                >
                  <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-border/70 shadow-sm transition-shadow hover:shadow-md">
                    {/* Card Image & Always-Accessible Remove Button */}
                    <div className="relative h-44 w-full overflow-hidden bg-muted">
                      {d.detail?.foto?.[0] ? (
                        <Image
                          src={getImageUrl(d.detail.foto[0])}
                          alt={d.detail.namaPerumahan}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Buildings className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}

                      {/* Top-left type badge */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pr-12">
                        <Badge className="bg-slate-900/80 text-[10px] font-bold text-white backdrop-blur-xs">
                          {d.detail?.jenisPerumahan === 0
                            ? "Rumah Tapak"
                            : "Rumah Susun"}
                        </Badge>
                        {d.floodRisk && d.floodSafe && (
                          <Badge className="bg-emerald-600 text-[10px] font-bold text-white">
                            Aman Banjir
                          </Badge>
                        )}
                      </div>

                      {/* Always-visible remove button (mobile-friendly) */}
                      <button
                        type="button"
                        onClick={() =>
                          toggleCompare({
                            idLokasi: d.detail.idLokasi,
                            namaPerumahan: d.detail.namaPerumahan,
                            foto: d.detail.foto,
                          } as Perumahan)
                        }
                        aria-label={`Hapus ${d.detail?.namaPerumahan}`}
                        title="Hapus dari perbandingan"
                        className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur-md transition-colors hover:bg-destructive hover:text-white"
                      >
                        <X weight="bold" className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Title & Developer */}
                    <CardContent className="space-y-1.5 p-4">
                      <Link
                        href={`/perumahan/${d.detail?.idLokasi}`}
                        className="hover:text-primary transition-colors"
                      >
                        <h3 className="line-clamp-1 text-base font-extrabold leading-tight">
                          {d.detail?.namaPerumahan}
                        </h3>
                      </Link>
                      <p className="line-clamp-1 text-xs font-medium text-muted-foreground">
                        {d.detail?.namaPengembang}
                      </p>
                      <p className="flex items-start gap-1 text-xs text-muted-foreground">
                        <MapPin
                          weight="fill"
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                        />
                        <span className="line-clamp-1">{d.detail?.alamat}</span>
                      </p>
                    </CardContent>

                    <Separator />

                    {/* Comparison Rows */}
                    <div className="flex-1 divide-y divide-border/50 text-sm">
                      {/* Harga & Est Cicilan */}
                      <div className="space-y-1 bg-primary/4 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Harga &amp; Est. KPR 15th
                          </p>
                          {isCheapest && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                              <Trophy weight="fill" className="h-3 w-3" />
                              Termurah
                            </span>
                          )}
                        </div>
                        <p className="text-base font-black text-primary">
                          {priceRange}
                        </p>
                        {cheap?.harga && (
                          <p className="text-xs font-semibold text-muted-foreground">
                            Cicilan mulai{" "}
                            <strong className="text-foreground">
                              {formatEstCicilan(cheap.harga)}
                            </strong>
                          </p>
                        )}
                      </div>

                      {/* Luas Tanah & Bangunan */}
                      <div className="grid grid-cols-2 gap-2 px-4 py-3 text-xs">
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                            Luas Tanah
                          </span>
                          <span className="font-extrabold text-foreground">
                            {cheap?.luasTanah ? `${cheap.luasTanah} m²` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                            Luas Bangunan
                          </span>
                          <span className="font-extrabold text-foreground">
                            {cheap?.luasBangunan
                              ? `${cheap.luasBangunan} m²`
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Stasiun KRL Terdekat */}
                      <div className="space-y-1 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                            <Train
                              weight="fill"
                              className="h-3.5 w-3.5 text-orange-500"
                            />
                            Stasiun KRL Terdekat
                          </span>
                          {isClosestKrl && (
                            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-extrabold text-orange-700 dark:text-orange-300">
                              Terdekat KRL
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold leading-snug text-foreground">
                          {d.nearestStation ?? "—"}
                        </p>
                      </div>

                      {/* Jarak ke Jakarta */}
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin
                            weight="duotone"
                            className="h-3.5 w-3.5 shrink-0 text-blue-500"
                          />
                          Jarak ke Jakarta
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isClosestJakarta && (
                            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 dark:text-blue-300">
                              Terdekat
                            </span>
                          )}
                          <span className="text-xs font-extrabold">
                            {d.distanceToJakarta
                              ? `${d.distanceToJakarta.toFixed(1)} km`
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Flood risk */}
                      <div
                        className={cn(
                          "flex items-center justify-between px-4 py-3",
                          d.floodRisk == null
                            ? ""
                            : d.floodSafe
                              ? "bg-emerald-500/8"
                              : "bg-red-500/8"
                        )}
                      >
                        <span className="text-xs font-semibold text-muted-foreground">
                          Audit Banjir BNPB
                        </span>
                        <div className="flex items-center gap-1.5">
                          {d.floodRisk == null ? (
                            <Drop
                              weight="duotone"
                              className="h-4 w-4 shrink-0 text-muted-foreground"
                            />
                          ) : d.floodSafe ? (
                            <ShieldCheck
                              weight="fill"
                              className="h-4 w-4 shrink-0 text-emerald-600"
                            />
                          ) : (
                            <WarningCircle
                              weight="fill"
                              className="h-4 w-4 shrink-0 text-red-600"
                            />
                          )}
                          <span
                            className={cn(
                              "text-xs font-extrabold",
                              d.floodRisk == null
                                ? "text-muted-foreground"
                                : d.floodSafe
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-red-700 dark:text-red-400"
                            )}
                          >
                            {d.floodRisk
                              ? `Risiko ${d.floodRisk}`
                              : "Belum Terpetakan"}
                          </span>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="space-y-2 px-4 py-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">
                            Spesifikasi Atap
                          </p>
                          <p className="line-clamp-2 text-xs font-medium">
                            {cheap?.spesifikasiAtap ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">
                            Spesifikasi Dinding
                          </p>
                          <p className="line-clamp-2 text-xs font-medium">
                            {cheap?.spesifikasiDinding ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="border-t bg-muted/20 p-3.5">
                      <Link
                        href={`/perumahan/${d.detail?.idLokasi}`}
                        className="block"
                      >
                        <Button className="h-10 w-full gap-1.5 rounded-xl text-xs font-bold">
                          Cek Isi Rumah &amp; Hitung KPR
                          <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
