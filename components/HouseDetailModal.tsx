"use client"

import React, { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Perumahan } from "./HouseCard"
import {
  MapPin,
  Users,
  Phone,
  EnvelopeSimple,
  Buildings,
  CaretLeft,
  CaretRight,
  Bed,
  Bathtub,
  ArrowsOut,
  Heart,
  Scales,
  ArrowRight,
  Train,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Credenza,
  CredenzaContent,
  CredenzaTitle,
} from "@/components/ui/credenza"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  getDistanceToJakarta,
  getNearestStation,
  isWithinKrlService,
} from "@/lib/geoUtils"

// ─── Types ──────────────────────────────────────────────────────────────────

interface HouseDetailModalProps {
  data: Perumahan
  onClose: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
  isCompared?: boolean
  onToggleCompare?: () => void
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n)

const resolveImageUrl = (url: string) =>
  url.startsWith("http")
    ? url
    : `https://sikumbang.tapera.go.id${url.startsWith("/") ? "" : "/"}${url}`

// ─── Component ──────────────────────────────────────────────────────────────

export function HouseDetailModal({
  data,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  isCompared = false,
  onToggleCompare,
}: HouseDetailModalProps) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const hasImages = data.foto?.length > 0

  const nextImage = () => setCurrentImageIdx((p) => (p + 1) % data.foto.length)
  const prevImage = () =>
    setCurrentImageIdx((p) => (p === 0 ? data.foto.length - 1 : p - 1))

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !hasImages || data.foto.length <= 1)
      return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) nextImage()
      else prevImage()
    }
    touchStartX.current = null
  }

  const hasSubsidi = data.tipeRumah?.some((t) => t.status === "subsidi")
  const hasKomersil = data.tipeRumah?.some((t) => t.status === "komersil")

  // Geo insights
  let nearestStation: { station: { name: string }; distance: number } | null =
    null
  let distanceToJakarta: number | null = null
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

  return (
    <Credenza open onOpenChange={(open) => !open && onClose()}>
      <CredenzaContent className="flex max-h-[90dvh] w-full max-w-5xl flex-col gap-0 overflow-hidden border p-0 sm:max-w-5xl md:max-w-6xl lg:max-w-6xl">
        <CredenzaTitle className="sr-only">{data.namaPerumahan}</CredenzaTitle>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          {/* ── Left: Swipeable Image Gallery ──────────────────────────── */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="group relative min-h-56 w-full shrink-0 bg-muted md:min-h-0 md:w-1/2 lg:w-3/5"
          >
            {hasImages ? (
              <>
                <Image
                  src={resolveImageUrl(data.foto[currentImageIdx])}
                  alt={`${data.namaPerumahan} – foto ${currentImageIdx + 1}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
                {data.foto.length > 1 && (
                  <>
                    {/* Nav arrows — always visible on mobile touchscreens, hover on desktop */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="Foto sebelumnya"
                        onClick={prevImage}
                        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background active:scale-95"
                      >
                        <CaretLeft weight="bold" className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Foto berikutnya"
                        onClick={nextImage}
                        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background active:scale-95"
                      >
                        <CaretRight weight="bold" className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Image counter pill */}
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                      {currentImageIdx + 1} / {data.foto.length}
                    </div>

                    {/* Dots */}
                    <div className="absolute right-0 bottom-3 left-0 flex justify-center gap-1.5">
                      {data.foto.map((_, i) => (
                        <button
                          type="button"
                          key={i}
                          aria-label={`Pilih foto ${i + 1}`}
                          onClick={() => setCurrentImageIdx(i)}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            i === currentImageIdx
                              ? "w-5 bg-white shadow-xs"
                              : "w-1.5 bg-white/50 hover:bg-white/80"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40">
                <Buildings weight="duotone" className="mb-2 h-14 w-14" />
                <span className="text-sm font-medium">Foto belum tersedia</span>
              </div>
            )}

            {/* Status badges overlay */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              {hasSubsidi && (
                <Badge className="bg-emerald-600 text-[10px] font-bold text-white shadow-sm">
                  Subsidi
                </Badge>
              )}
              {hasKomersil && (
                <Badge className="bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                  Komersil
                </Badge>
              )}
            </div>

            {/* Action buttons overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 md:right-12">
              {onToggleCompare && (
                <button
                  type="button"
                  onClick={onToggleCompare}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all",
                    isCompared
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/85 text-foreground hover:text-primary"
                  )}
                  title={
                    isCompared
                      ? "Hapus dari Bandingkan"
                      : "Tambah ke Bandingkan"
                  }
                >
                  <Scales
                    weight={isCompared ? "fill" : "bold"}
                    className="h-4 w-4"
                  />
                </button>
              )}
              <button
                type="button"
                onClick={onToggleFavorite}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all",
                  isFavorite
                    ? "bg-red-500 text-white"
                    : "bg-background/85 text-foreground hover:text-red-500"
                )}
                title={isFavorite ? "Hapus dari Favorit" : "Simpan ke Favorit"}
              >
                <Heart
                  weight={isFavorite ? "fill" : "bold"}
                  className="h-4 w-4"
                />
              </button>
            </div>
          </div>

          {/* ── Right: Detail Content ────────────────────────── */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto">
              {/* Header info */}
              <div className="p-4 pb-3 sm:p-5">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    {data.jenisPerumahan}
                  </Badge>
                  {nearestStation && (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
                    >
                      <Train weight="fill" className="mr-1 h-3 w-3" />
                      {nearestStation.distance.toFixed(1)} km ke{" "}
                      {nearestStation.station.name}
                    </Badge>
                  )}
                  {distanceToJakarta !== null && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-500/10 text-[10px] font-bold text-blue-700 dark:text-blue-300"
                    >
                      {distanceToJakarta.toFixed(1)} km ke Jakarta
                    </Badge>
                  )}
                </div>

                <h2 className="pr-2 text-lg font-extrabold tracking-tight text-foreground leading-snug sm:text-xl">
                  {data.namaPerumahan}
                </h2>
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <MapPin
                    weight="fill"
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  />
                  <p className="leading-relaxed">
                    {[
                      data.wilayah?.kelurahan,
                      data.wilayah?.kecamatan,
                      data.wilayah?.kabupaten,
                      data.wilayah?.provinsi,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Tabs: Info / Tipe Rumah */}
              <Tabs defaultValue="tipe" className="flex flex-1 flex-col">
                <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b bg-transparent p-0">
                  <TabsTrigger
                    value="tipe"
                    className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-5 sm:text-sm"
                  >
                    Tipe &amp; Spek ({data.tipeRumah?.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="info"
                    className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-5 sm:text-sm"
                  >
                    Pengembang &amp; Stok
                  </TabsTrigger>
                </TabsList>

                {/* Tipe Tab (Default so buyers immediately see "Isi Rumah") */}
                <TabsContent value="tipe" className="mt-0 space-y-3 p-4 sm:p-5">
                  {data.tipeRumah?.length > 0 ? (
                    data.tipeRumah.map((tipe, i) => (
                      <div
                        key={i}
                        className="rounded-xl border bg-card p-3.5 shadow-xs transition-shadow hover:shadow-md sm:p-4"
                      >
                        <div className="mb-2.5 flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base">
                              {tipe.nama}
                            </h4>
                            <Badge
                              variant={
                                tipe.status === "subsidi"
                                  ? "default"
                                  : "secondary"
                              }
                              className={cn(
                                "mt-1 text-[10px] font-bold uppercase",
                                tipe.status === "subsidi"
                                  ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "border-blue-500/20 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                              )}
                            >
                              {tipe.status}
                            </Badge>
                          </div>
                          <span className="text-base font-black text-primary">
                            {formatRupiah(tipe.harga)}
                          </span>
                        </div>
                        <div className="mb-2.5 flex flex-wrap gap-3 rounded-lg bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground/85">
                          <span className="flex items-center gap-1">
                            <ArrowsOut className="h-3.5 w-3.5 text-primary" />
                            LB {tipe.luasBangunan} / LT {tipe.luasTanah} m²
                          </span>
                          <span className="flex items-center gap-1">
                            <Bed className="h-3.5 w-3.5 text-primary" />
                            {tipe.kamarTidur} KT
                          </span>
                          <span className="flex items-center gap-1">
                            <Bathtub className="h-3.5 w-3.5 text-primary" />
                            {tipe.kamarMandi} KM
                          </span>
                        </div>
                        {(tipe.spesifikasiAtap ||
                          tipe.spesifikasiDinding ||
                          tipe.spesifikasiLantai ||
                          tipe.spesifikasiPondasi) && (
                          <div className="grid grid-cols-1 gap-1 border-t pt-2 text-xs text-muted-foreground sm:grid-cols-2">
                            {tipe.spesifikasiAtap && (
                              <p>
                                <span className="font-semibold text-foreground">
                                  Atap:
                                </span>{" "}
                                {tipe.spesifikasiAtap}
                              </p>
                            )}
                            {tipe.spesifikasiDinding && (
                              <p>
                                <span className="font-semibold text-foreground">
                                  Dinding:
                                </span>{" "}
                                {tipe.spesifikasiDinding}
                              </p>
                            )}
                            {tipe.spesifikasiLantai && (
                              <p>
                                <span className="font-semibold text-foreground">
                                  Lantai:
                                </span>{" "}
                                {tipe.spesifikasiLantai}
                              </p>
                            )}
                            {tipe.spesifikasiPondasi && (
                              <p>
                                <span className="font-semibold text-foreground">
                                  Pondasi:
                                </span>{" "}
                                {tipe.spesifikasiPondasi}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Klik &quot;Cek Isi Rumah Lengkap&quot; untuk memuat detail
                      tipe, audit banjir, dan simulasi KPR.
                    </div>
                  )}
                </TabsContent>

                {/* Info Tab */}
                <TabsContent value="info" className="mt-0 space-y-4 p-4 sm:p-5">
                  {/* Unit count */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {data.jumlahUnit}
                      </span>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Unit Subsidi Tersedia
                      </p>
                    </div>
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {data.jumlahUnitKomersil}
                      </span>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Unit Komersil
                      </p>
                    </div>
                  </div>

                  {/* Developer */}
                  <div className="space-y-2 rounded-xl border bg-muted/35 p-4 text-sm">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold">
                      <Buildings className="h-4 w-4 text-primary" /> Pengembang
                    </h3>
                    <div className="flex justify-between gap-2 border-b py-1.5 text-xs sm:text-sm">
                      <span className="text-muted-foreground">Nama</span>
                      <span className="text-right font-semibold">
                        {data.pengembang?.nama || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 py-1.5 text-xs sm:text-sm">
                      <span className="text-muted-foreground">Asosiasi</span>
                      <span className="text-right font-semibold">
                        {data.pengembang?.asosiasi || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Kantor Pemasaran */}
                  {data.kantorPemasaran && data.kantorPemasaran.length > 0 && (
                    <div className="space-y-3 rounded-xl border bg-muted/35 p-4 text-sm">
                      <h3 className="flex items-center gap-1.5 text-sm font-bold">
                        <Users className="h-4 w-4 text-primary" /> Kantor
                        Pemasaran
                      </h3>
                      {data.kantorPemasaran.map((k, i) => (
                        <div key={i} className="space-y-1.5 text-xs sm:text-sm">
                          <p className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {k.alamat} {k.nomor ? `No. ${k.nomor}` : ""}
                          </p>
                          {k.noTelp && (
                            <p className="flex items-center gap-2 font-medium">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                              {k.noTelp}
                            </p>
                          )}
                          {k.email && (
                            <p className="flex items-center gap-2">
                              <EnvelopeSimple className="h-3.5 w-3.5 shrink-0 text-primary" />
                              {k.email}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer actions */}
            <Separator />
            <div className="pb-safe flex shrink-0 items-center gap-2.5 bg-muted/25 p-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-11 px-4 font-semibold"
              >
                Tutup
              </Button>
              <Link
                href={`/perumahan/${data.idLokasi}`}
                className="flex-1"
                onClick={onClose}
              >
                <Button className="h-11 w-full gap-2 font-bold shadow-md shadow-primary/20">
                  Cek Risiko Banjir, KPR &amp; Tur 360°
                  <ArrowRight weight="bold" className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}
