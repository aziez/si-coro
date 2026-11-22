import React from "react"
import Image from "next/image"
import {
  MapPin,
  Heart,
  Users,
  Buildings,
  Train,
  Scales,
  Bed,
  Bathtub,
  ArrowsOut,
  CaretRight,
  ShieldCheck,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import {
  getDistanceToJakarta,
  getNearestStation,
  isWithinKrlService,
} from "@/lib/geoUtils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TipeRumah {
  id: number
  status: string
  nama: string
  harga: number
  kamarTidur: number
  kamarMandi: number
  luasTanah: number
  luasBangunan: number
  spesifikasiAtap?: string
  spesifikasiDinding?: string
  spesifikasiLantai?: string
  spesifikasiPondasi?: string
}

export interface KantorPemasaran {
  alamat: string
  nomor?: string
  noTelp?: string
  email?: string
}

export interface Perumahan {
  idLokasi: string
  namaPerumahan: string
  jenisPerumahan: string
  jumlahUnit: number
  jumlahUnitKomersil: number
  foto: string[]
  koordinatPerumahan?: string
  tipeRumah: TipeRumah[]
  kantorPemasaran?: KantorPemasaran[]
  wilayah: {
    provinsi: string
    kabupaten: string
    kecamatan: string
    kelurahan: string
  }
  pengembang: {
    nama: string
    asosiasi?: string
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n)

const formatCompactCicilan = (harga: number, isSubsidi: boolean) => {
  if (!harga || harga <= 0) return null
  // Standard simulation: Subsidi FLPP (1% DP, 5% fixed, 15 yrs) vs Komersil (10% DP, 8.5%, 15 yrs)
  const dpPct = isSubsidi ? 0.01 : 0.1
  const rateAnnual = isSubsidi ? 0.05 : 0.085
  const months = 15 * 12
  const plafon = harga * (1 - dpPct)
  const r = rateAnnual / 12
  const monthly =
    (plafon * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1)

  if (monthly >= 1_000_000) {
    return `~Rp${(monthly / 1_000_000).toFixed(2).replace(".", ",")} jt/bln`
  }
  return `~Rp${Math.round(monthly / 1000)} rb/bln`
}

const resolveImageUrl = (url: string) =>
  url.startsWith("http")
    ? url
    : `https://sikumbang.tapera.go.id${url.startsWith("/") ? "" : "/"}${url}`

// ─── Component ──────────────────────────────────────────────────────────────

export function HouseCard({
  data,
  index = 0,
  onClick,
  isFavorite = false,
  onToggleFavorite,
  isCompared = false,
  onToggleCompare,
  isHighlighted = false,
  onHoverChange,
}: {
  data: Perumahan
  index?: number
  onClick?: () => void
  isFavorite?: boolean
  onToggleFavorite?: (e: React.MouseEvent) => void
  isCompared?: boolean
  onToggleCompare?: (e: React.MouseEvent) => void
  isHighlighted?: boolean
  onHoverChange?: (hovered: boolean) => void
}) {
  const imageUrl = data.foto?.[0] ? resolveImageUrl(data.foto[0]) : ""

  const sortedTipe = data.tipeRumah?.length
    ? [...data.tipeRumah].sort((a, b) => a.harga - b.harga)
    : []
  const primaryTipe = sortedTipe[0]
  const hargaMulai = primaryTipe?.harga ?? 0

  const hasSubsidi = data.tipeRumah?.some((t) => t.status === "subsidi")
  const hasKomersil = data.tipeRumah?.some((t) => t.status === "komersil")
  const estCicilan = formatCompactCicilan(hargaMulai, Boolean(hasSubsidi))

  // Geo data
  let distanceToJakarta: number | null = null
  let nearestStation: { station: { name: string }; distance: number } | null =
    null

  if (data.koordinatPerumahan) {
    const [latStr, lonStr] = data.koordinatPerumahan.split(",")
    const lat = parseFloat(latStr?.trim())
    const lon = parseFloat(lonStr?.trim())
    if (!isNaN(lat) && !isNaN(lon)) {
      const nearest = getNearestStation(lat, lon)
      if (isWithinKrlService(nearest.distance)) {
        nearestStation = nearest
        distanceToJakarta = getDistanceToJakarta(lat, lon)
      }
    }
  }

  // Zero-rerender pointer spotlight coordinate update
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--spot-x", `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty("--spot-y", `${e.clientY - rect.top}px`)
  }

  const staggerDelay = `${Math.min(index % 12, 11) * 38}ms`

  return (
    <Card
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      style={{ ["--stagger-delay" as string]: staggerDelay }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-[transform,box-shadow,border-color] duration-300",
        index < 12 ? "card-stagger-in" : "scroll-reveal-card",
        "hover:-translate-y-1.5 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/10",
        isHighlighted && "border-orange-500 ring-2 ring-orange-500/30",
        onClick && "cursor-pointer"
      )}
    >
      {/* Subtle emerald cursor spotlight halo on hover (compositor opacity only) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--spot-x, 50%) var(--spot-y, 20%), rgba(16, 185, 129, 0.11), transparent 70%)",
        }}
      />

      {/* Top-right touch-friendly action buttons (36x36px) */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
        <button
          type="button"
          aria-label={
            isCompared ? "Hapus dari perbandingan" : "Tambah ke perbandingan"
          }
          title={
            isCompared ? "Hapus dari Bandingkan" : "Bandingkan Properti Ini"
          }
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            onToggleCompare?.(e)
          }}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur-md transition-all active:scale-90",
            isCompared
              ? "bg-primary text-primary-foreground ring-2 ring-white/80 dark:ring-slate-900"
              : "bg-background/85 text-foreground/80 hover:bg-background hover:text-primary"
          )}
        >
          <Scales
            weight={isCompared ? "fill" : "bold"}
            className="h-4 w-4 transition-transform group-hover:scale-105"
          />
        </button>

        <button
          type="button"
          aria-label={isFavorite ? "Hapus dari favorit" : "Simpan ke favorit"}
          title={isFavorite ? "Hapus dari Favorit" : "Simpan ke Favorit"}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            onToggleFavorite?.(e)
          }}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur-md transition-all active:scale-90",
            isFavorite
              ? "bg-red-500 text-white ring-2 ring-white/80 dark:ring-slate-900"
              : "bg-background/85 text-foreground/80 hover:bg-background hover:text-red-500"
          )}
        >
          <Heart
            weight={isFavorite ? "fill" : "bold"}
            className="h-4 w-4 transition-transform group-hover:scale-105"
          />
        </button>
      </div>

      {/* Image Banner */}
      <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={data.namaPerumahan}
            fill
            loading={index < 4 ? "eager" : "lazy"}
            fetchPriority={index < 4 ? "high" : "auto"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        ) : null}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground/40"
          style={{ display: imageUrl ? "none" : "flex" }}
        >
          <Buildings weight="duotone" className="mb-1 h-10 w-10" />
          <span className="text-xs font-medium">Foto belum tersedia</span>
        </div>

        {/* Gradient vignette at bottom of image for unit badge legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        {/* Top-left Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 pr-20">
          {hasSubsidi && (
            <Badge className="border-0 bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-xs">
              Subsidi
            </Badge>
          )}
          {hasKomersil && (
            <Badge className="border-0 bg-blue-600/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-xs">
              Komersil
            </Badge>
          )}
        </div>

        {/* Bottom-left & Bottom-right Inside Stock Overlay + Hover Quick Audit Pill */}
        <div className="absolute inset-x-2.5 bottom-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-white">
          {data.jumlahUnit > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-0.5 backdrop-blur-xs">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  data.jumlahUnit > 10 ? "bg-emerald-400" : "bg-amber-400"
                )}
              />
              {data.jumlahUnit} Unit Subsidi Tersedia
            </span>
          ) : data.jumlahUnitKomersil > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-0.5 backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              {data.jumlahUnitKomersil} Unit Komersil
            </span>
          ) : (
            <span />
          )}

          {/* Hover-reveal "Cek Isi" pill on desktop, photo count at rest */}
          <span className="relative flex items-center">
            {data.foto?.length > 1 && (
              <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-0">
                {data.foto.length} Foto
              </span>
            )}
            <span className="pointer-events-none absolute right-0 inline-flex translate-y-1 items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-extrabold whitespace-nowrap text-slate-950 opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
              <ShieldCheck weight="fill" className="h-3 w-3" />
              Cek Isi
            </span>
          </span>
        </div>
      </div>

      <CardContent className="relative z-10 flex flex-1 flex-col gap-2.5 p-4">
        {/* Title & Developer */}
        <div>
          <h3 className="line-clamp-1 text-base font-extrabold tracking-tight text-card-foreground transition-colors group-hover:text-primary">
            {data.namaPerumahan}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="line-clamp-1">
              {data.pengembang?.nama || "Pengembang Terdaftar"}
            </span>
          </p>
        </div>

        {/* Location */}
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin
            weight="fill"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/75"
          />
          <span className="line-clamp-1 leading-relaxed">
            {[
              data.wilayah?.kecamatan,
              data.wilayah?.kabupaten,
              data.wilayah?.provinsi,
            ]
              .filter(Boolean)
              .join(", ") || "Lokasi Indonesia"}
          </span>
        </div>

        {/* "Isi Rumah" Spec Strip (LB/LT, Bedrooms, Bathrooms) */}
        {primaryTipe && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/35 px-2.5 py-1.5 text-[11px] font-semibold text-foreground/85 transition-colors group-hover:border-primary/25 group-hover:bg-primary/[0.04]">
            {(primaryTipe.luasBangunan > 0 || primaryTipe.luasTanah > 0) && (
              <span className="inline-flex items-center gap-1">
                <ArrowsOut className="h-3 w-3 text-primary" />
                LB {primaryTipe.luasBangunan} / LT {primaryTipe.luasTanah} m²
              </span>
            )}
            {primaryTipe.kamarTidur > 0 && (
              <>
                <span className="text-border">•</span>
                <span className="inline-flex items-center gap-1">
                  <Bed className="h-3 w-3 text-primary" />
                  {primaryTipe.kamarTidur} KT
                </span>
              </>
            )}
            {primaryTipe.kamarMandi > 0 && (
              <>
                <span className="text-border">•</span>
                <span className="inline-flex items-center gap-1">
                  <Bathtub className="h-3 w-3 text-primary" />
                  {primaryTipe.kamarMandi} KM
                </span>
              </>
            )}
          </div>
        )}

        {/* Geo & Transit Insights */}
        {(nearestStation || distanceToJakarta !== null) && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-0.5">
            {nearestStation && (
              <span className="inline-flex max-w-full items-center gap-1 truncate rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                <Train weight="fill" className="h-3 w-3 shrink-0" />
                {nearestStation.distance.toFixed(1)} km ·{" "}
                {nearestStation.station.name.replace("Stasiun ", "St. ")}
              </span>
            )}
            {distanceToJakarta !== null && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10.5px] font-bold text-blue-700 dark:text-blue-300">
                <Buildings weight="fill" className="h-3 w-3 shrink-0" />
                {distanceToJakarta.toFixed(1)} km ke Jkt
              </span>
            )}
          </div>
        )}

        {/* Price + Estimated Monthly Installment Footer */}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/60 pt-3">
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Harga Mulai
            </p>
            <p className="text-base font-black tracking-tight text-primary">
              {hargaMulai > 0 ? formatRupiah(hargaMulai) : "Hubungi Developer"}
            </p>
          </div>

          {estCicilan ? (
            <div className="text-right">
              <p className="text-[10px] font-medium text-muted-foreground">
                Est. KPR 15th
              </p>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-extrabold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {estCicilan}
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-primary transition-transform group-hover:translate-x-0.5">
              Cek Isi <CaretRight weight="bold" className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
