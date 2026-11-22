"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Buildings,
  Bed,
  Bathtub,
  ArrowsOut,
  Phone,
  EnvelopeSimple,
  MapTrifold,
  CaretLeft,
  CaretRight,
  ShieldCheck,
  Heart,
  Train,
  Eye,
  Compass,
  ArrowSquareOut,
  Calculator,
  WhatsappLogo,
  Drop,
  Scales,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useFavorites } from "@/hooks/useFavorites"
import { useCompare } from "@/hooks/useCompare"
import {
  calculateKrlRoute,
  getDistanceToJakarta,
  getNearestStation,
  isWithinKrlService,
} from "@/lib/geoUtils"
import type { StationRouteCandidate } from "@/app/api/route-krl/route"
import {
  ClimateAgunanScoreCard,
  type FloodElevationData,
} from "@/components/ClimateAgunanScoreCard"
import KprCalculator from "@/components/KprCalculator"
import ShareButton from "@/components/ShareButton"
import { SiCoroLogo } from "@/components/SiCoroLogo"
import type { Perumahan } from "@/components/HouseCard"

const DetailRouteMap = dynamic(
  () =>
    import("@/components/DetailRouteMap").then(
      (module) => module.DetailRouteMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-2xl bg-muted" />
    ),
  }
)

// ─── Types ───────────────────────────────────────────────────────────────────

interface DetailData {
  namaPerumahan: string
  namaPengembang: string
  npwpPengembang: string
  jenisPerumahan: number
  alamat: string
  idLokasi: string
  siteplan: string
  foto: string[]
  koordinat: { lat: number; lon: number }
  koordinatPerumahan?: string | null
  kantorPemasaran: {
    alamat: string
    nomor: string
    noTelp: string
    email: string
    website: string
  }[]
}

interface TipeRumah {
  id: number
  idLokasi: number
  status: string
  nama: string
  harga: number
  kamarTidur: number
  kamarMandi: number
  fotoTampak: string
  fotoDenah: string
  jumlahLantai: number
  luasTanah: number
  luasBangunan: number
  spesifikasiAtap: string
  spesifikasiDinding: string
  spesifikasiLantai: string
  spesifikasiPondasi: string
}

interface BangunanItem {
  id: number
  tipeBangunan: string
  status: string
  nomor: string
  tipe: TipeRumah
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)

const formatEstCicilan = (harga: number, isSubsidi: boolean) => {
  if (!harga || harga <= 0) return "—"
  const dpPct = isSubsidi ? 0.01 : 0.1
  const rateAnnual = isSubsidi ? 0.05 : 0.085
  const months = 15 * 12
  const plafon = harga * (1 - dpPct)
  const r = rateAnnual / 12
  const monthly =
    (plafon * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1)
  return formatRupiah(Math.round(monthly))
}

const getImageUrl = (url: string | undefined | null) => {
  if (!url) return ""
  return url.startsWith("http")
    ? url
    : `https://sikumbang.tapera.go.id${url.startsWith("/") ? "" : "/"}${url}`
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="glass-header sticky top-0 z-50 h-16 border-b border-border/50" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <Skeleton className="h-[42vh] w-full rounded-2xl md:h-[54vh]" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DetailPerumahanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id: propertyId } = React.use(params)

  const [data, setData] = useState<{
    detail: DetailData
    bangunan: BangunanItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentHeroImage, setCurrentHeroImage] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const [floodData, setFloodData] = useState<FloodElevationData | null>(null)
  const [geoData, setGeoData] = useState<{
    distanceToJakarta: number
    nearestStation: {
      station: { name: string; lat: number; lon: number }
      distance: number
    }
  } | null>(null)
  const [stationRoutes, setStationRoutes] = useState<{
    bestStation: StationRouteCandidate | null
    alternatives: StationRouteCandidate[]
  }>({ bestStation: null, alternatives: [] })
  const [krlApplicable, setKrlApplicable] = useState(true)
  const [workStation, setWorkStation] = useState("Stasiun Sudirman")
  const [showcaseTab, setShowcaseTab] = useState<string>("live-siteplan")
  const [chellData, setChellData] = useState<{
    isDemoFallback: boolean
    chellTourBaseUrl: string
    project: {
      id: string
      slug: string
      name: string
      description?: string | null
      hubUrl: string
      primarySiteplan?: {
        id: string
        slug: string
        name: string
        embedUrl: string
        fullUrl: string
      } | null
      primaryTour?: {
        id: string
        slug: string
        name: string
        url: string
      } | null
      unitTypes?: {
        id: string
        name: string
        price: number | null
        landArea: number | null
        buildingArea: number | null
      }[]
    }
  } | null>(null)

  const { toggleFavorite, isFavorite } = useFavorites()
  const { toggleCompare, isCompared } = useCompare()

  // ─── Data fetch ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://sikumbang.tapera.go.id/lokasi-perumahan/${propertyId}/json`
        )
        const json = await res.json()
        if (json.error) {
          setError(json.message || "Data tidak ditemukan")
          return
        }
        setData(json)

        // Fetch Chell-Tour Integration for Interactive Siteplan & 360 Tour
        fetch(`/api/chell-tour/${propertyId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.project) {
              setChellData({
                isDemoFallback: Boolean(d.isDemoFallback),
                chellTourBaseUrl:
                  d.chellTourBaseUrl || "http://localhost:3001",
                project: d.project,
              })
            }
          })
          .catch(console.error)

        // Resolve coordinates
        let lat: number | undefined, lon: number | undefined
        if (json.detail?.koordinat?.lat !== undefined) {
          lat = parseFloat(json.detail.koordinat.lat)
          lon = parseFloat(json.detail.koordinat.lon)
        } else if (json.detail?.koordinatPerumahan) {
          const [a, b] = String(json.detail.koordinatPerumahan).split(",")
          lat = parseFloat(a?.trim())
          lon = parseFloat(b?.trim())
        }

        if (
          lat !== undefined &&
          lon !== undefined &&
          !isNaN(lat) &&
          !isNaN(lon)
        ) {
          const nearestFallback = getNearestStation(lat, lon)
          setGeoData({
            distanceToJakarta: getDistanceToJakarta(lat, lon),
            nearestStation: nearestFallback,
          })

          const krlApplicable = isWithinKrlService(nearestFallback.distance)
          setKrlApplicable(krlApplicable)

          if (krlApplicable) {
            const immediateCandidate: StationRouteCandidate = {
              station: nearestFallback.station,
              straightDistanceKm: Number(nearestFallback.distance.toFixed(2)),
              roadDistanceKm: Number(
                (nearestFallback.distance * 1.32).toFixed(2)
              ),
              roadDurationMinutes: Math.max(
                3,
                Math.round(((nearestFallback.distance * 1.32) / 26) * 60)
              ),
              routeCoordinates: [
                [lat, lon],
                [nearestFallback.station.lat, nearestFallback.station.lon],
              ],
              source: "estimated",
            }
            setStationRoutes({
              bestStation: immediateCandidate,
              alternatives: [immediateCandidate],
            })

            fetch(`/api/route-krl?lat=${lat}&lon=${lon}`)
              .then((r) => r.json())
              .then((d) => {
                if (d.success && d.bestStation) {
                  setStationRoutes({
                    bestStation: d.bestStation,
                    alternatives: d.alternatives ?? [d.bestStation],
                  })
                }
              })
              .catch(console.error)
          }

          fetch(`/api/inarisk?lat=${lat}&lon=${lon}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success) {
                setFloodData({
                  riskLevel: d.riskLevel,
                  centerRiskLevel: d.centerRiskLevel,
                  pixelValue: d.pixelValue,
                  maxSurroundingPixelValue: d.maxSurroundingPixelValue,
                  affectedSurroundingCount: d.affectedSurroundingCount,
                  sampleCount: d.sampleCount,
                  bufferWarning: d.bufferWarning,
                  isFloodFree: d.isFloodFree,
                  elevation: d.elevation,
                })
              }
            })
            .catch(console.error)
        }
      } catch {
        setError("Gagal mengambil data perumahan.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [propertyId])

  const activeKrlRoute = useMemo(() => {
    const fromSt = stationRoutes.bestStation?.station.name
    if (!fromSt) return null
    return calculateKrlRoute(fromSt, workStation)
  }, [stationRoutes.bestStation, workStation])

  // ─── States ──────────────────────────────────────────────────────────────

  if (loading) return <DetailPageSkeleton />

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <Buildings className="h-20 w-20 text-muted-foreground/25" />
        <div>
          <h1 className="mb-1 text-2xl font-bold">Properti Tidak Ditemukan</h1>
          <p className="text-muted-foreground">
            {error || "Data perumahan tidak ditemukan."}
          </p>
        </div>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </div>
    )
  }

  const { detail, bangunan } = data
  const uniqueTipe = Array.from(
    new Map(bangunan.map((b) => [b.tipe.id, b.tipe])).values()
  )
  const sortedTipe = [...uniqueTipe].sort((a, b) => a.harga - b.harga)
  const cheapestTipe = sortedTipe[0]
  const hasSubsidi = uniqueTipe.some((t) => t.status === "subsidi")
  const allImages = detail.foto?.length > 0 ? detail.foto : []

  let mapLat = "",
    mapLon = ""
  if (detail.koordinat?.lat) {
    mapLat = String(detail.koordinat.lat)
    mapLon = String(detail.koordinat.lon)
  } else if (detail.koordinatPerumahan) {
    const [a, b] = detail.koordinatPerumahan.split(",")
    mapLat = a?.trim() ?? ""
    mapLon = b?.trim() ?? ""
  }
  const hasCoordinates = Boolean(mapLat && mapLon)

  const mappedForAction: Perumahan = {
    idLokasi: detail.idLokasi,
    namaPerumahan: detail.namaPerumahan,
    pengembang: { nama: detail.namaPengembang },
    jenisPerumahan:
      detail.jenisPerumahan === 0 ? "Rumah Tapak" : "Rumah Susun",
    wilayah: {
      kecamatan: detail.alamat,
      provinsi: "",
      kabupaten: "",
      kelurahan: "",
    },
    foto: detail.foto,
    koordinatPerumahan: `${detail.koordinat?.lat},${detail.koordinat?.lon}`,
    jumlahUnit: 0,
    jumlahUnitKomersil: 0,
    tipeRumah: uniqueTipe,
  }

  const primaryKantor = detail.kantorPemasaran?.[0]
  const primaryPhone = primaryKantor?.noTelp ?? ""
  const cleanWaPhone = primaryPhone
    ? `62${primaryPhone.split(" ")[0].replace(/[^0-9]/g, "").replace(/^0/, "")}`
    : ""

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || allImages.length <= 1) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0)
        setCurrentHeroImage((p) => (p + 1) % allImages.length)
      else
        setCurrentHeroImage((p) =>
          p === 0 ? allImages.length - 1 : p - 1
        )
    }
    touchStartX.current = null
  }

  const scrollToKpr = () => {
    const el = document.getElementById("kpr-calculator")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-16">
      {/* ── Sticky Branded Nav ─────────────────────────────────── */}
      <div className="glass-header sticky top-0 z-50 border-b border-border/60 shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-full px-3 font-bold"
              onClick={() => router.back()}
            >
              <ArrowLeft weight="bold" className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <Link href="/" className="hidden sm:inline-flex">
              <SiCoroLogo size="sm" />
            </Link>
          </div>

          <p className="max-w-xs truncate text-center text-xs font-extrabold sm:max-w-md sm:text-sm">
            {detail.namaPerumahan}
          </p>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggleCompare(mappedForAction)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors",
                isCompared(detail.idLokasi)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
              title="Bandingkan Properti"
            >
              <Scales
                weight={isCompared(detail.idLokasi) ? "fill" : "bold"}
                className="h-3.5 w-3.5"
              />
              <span className="hidden md:inline">
                {isCompared(detail.idLokasi) ? "Dibandingkan" : "Bandingkan"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleFavorite(mappedForAction)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors",
                isFavorite(detail.idLokasi)
                  ? "border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
              title="Simpan ke Favorit"
            >
              <Heart
                weight={isFavorite(detail.idLokasi) ? "fill" : "bold"}
                className="h-3.5 w-3.5"
              />
              <span className="hidden sm:inline">
                {isFavorite(detail.idLokasi) ? "Tersimpan" : "Simpan"}
              </span>
            </button>

            <ShareButton
              title={`Perumahan ${detail.namaPerumahan} — Si-Coro`}
              text={`Cek isi rumah, audit banjir, rute KRL, dan simulasi KPR ${detail.namaPerumahan} di Si-Coro.`}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-5 sm:px-6 lg:px-8">
        {/* ── Touch-Friendly Hero Gallery ───────────────────────── */}
        <div className="space-y-2.5">
          <section
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="group relative flex h-[36vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-lg sm:h-[46vh] md:h-[55vh]"
          >
            {allImages[0] ? (
              <Image
                src={getImageUrl(allImages[currentHeroImage])}
                alt={`${detail.namaPerumahan} foto ${currentHeroImage + 1}`}
                fill
                priority
                className="object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            ) : null}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40"
              style={{ display: allImages[0] ? "none" : "flex" }}
            >
              <Buildings weight="duotone" className="mb-2 h-16 w-16" />
              <span className="font-medium">Foto belum tersedia</span>
            </div>

            {allImages.length > 1 && (
              <>
                {/* Always visible on mobile touchscreens, hover on desktop */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Foto sebelumnya"
                    onClick={() =>
                      setCurrentHeroImage((p) =>
                        p === 0 ? allImages.length - 1 : p - 1
                      )
                    }
                    className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-background/85 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background active:scale-95"
                  >
                    <CaretLeft weight="bold" className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Foto berikutnya"
                    onClick={() =>
                      setCurrentHeroImage((p) => (p + 1) % allImages.length)
                    }
                    className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-background/85 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background active:scale-95"
                  >
                    <CaretRight weight="bold" className="h-5 w-5" />
                  </button>
                </div>

                {/* Dots */}
                <div className="absolute right-0 bottom-3.5 left-0 flex justify-center gap-1.5">
                  {allImages.map((_, i) => (
                    <button
                      type="button"
                      key={i}
                      aria-label={`Pilih foto ${i + 1}`}
                      onClick={() => setCurrentHeroImage(i)}
                      className={cn(
                        "h-1.5 rounded-full shadow-md transition-all",
                        i === currentHeroImage
                          ? "w-6 bg-white"
                          : "w-1.5 bg-white/55 hover:bg-white/80"
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Top-left Status Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <Badge className="bg-slate-900/80 text-xs font-bold text-white backdrop-blur-xs">
                {detail.jenisPerumahan === 0 ? "Rumah Tapak" : "Rumah Susun"}
              </Badge>
              {hasSubsidi && (
                <Badge className="bg-emerald-600 text-xs font-bold text-white shadow-sm">
                  Tersedia Subsidi FLPP
                </Badge>
              )}
            </div>

            {/* Image counter */}
            {allImages.length > 1 && (
              <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
                {currentHeroImage + 1} / {allImages.length}
              </div>
            )}
          </section>

          {/* Thumbnail Strip for Multi-Photo Properties */}
          {allImages.length > 1 && (
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
              {allImages.map((imgUrl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setCurrentHeroImage(idx)}
                  className={cn(
                    "relative h-14 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                    idx === currentHeroImage
                      ? "border-primary ring-2 ring-primary/25"
                      : "border-transparent opacity-65 hover:opacity-100"
                  )}
                >
                  <Image
                    src={getImageUrl(imgUrl)}
                    alt={`Thumb ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── "Isi Rumah Sekilas" 4-Metric Quick Summary Strip ──────── */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 sm:p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Harga Mulai
            </p>
            <p className="mt-1 text-base font-black text-primary sm:text-xl">
              {cheapestTipe ? formatRupiah(cheapestTipe.harga) : "Hubungi Sales"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
              {cheapestTipe
                ? `Tipe ${cheapestTipe.nama} (${cheapestTipe.luasBangunan}/${cheapestTipe.luasTanah} m²)`
                : "Lihat tipe di bawah"}
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToKpr}
            className="group rounded-2xl border border-blue-500/25 bg-blue-500/5 p-3.5 text-left transition-colors hover:bg-blue-500/10 sm:p-4"
          >
            <p className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Est. Cicilan KPR 15th</span>
              <Calculator className="h-3.5 w-3.5 text-blue-600" />
            </p>
            <p className="mt-1 text-base font-black text-blue-700 dark:text-blue-400 sm:text-xl">
              {cheapestTipe
                ? `${formatEstCicilan(cheapestTipe.harga, cheapestTipe.status === "subsidi")}/bln`
                : "Hitung KPR"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-blue-600/80 group-hover:underline dark:text-blue-300">
              Klik untuk tambah ongkos KRL →
            </p>
          </button>

          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-3.5 sm:p-4">
            <p className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Stasiun KRL Terdekat</span>
              <Train className="h-3.5 w-3.5 text-orange-600" />
            </p>
            <p className="mt-1 truncate text-sm font-black text-foreground sm:text-base">
              {krlApplicable && stationRoutes.bestStation
                ? stationRoutes.bestStation.station.name.replace(
                    "Stasiun ",
                    "St. "
                  )
                : krlApplicable
                  ? "Menghitung rute…"
                  : "Di luar area KRL"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
              {krlApplicable && stationRoutes.bestStation
                ? `${stationRoutes.bestStation.roadDistanceKm} km jalan (~${stationRoutes.bestStation.roadDurationMinutes} mnt)`
                : "Transit non-KRL"}
            </p>
          </div>

          <div
            className={cn(
              "rounded-2xl border p-3.5 sm:p-4",
              floodData?.isFloodFree === false
                ? "border-red-500/30 bg-red-500/8"
                : "border-emerald-500/25 bg-emerald-500/5"
            )}
          >
            <p className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Audit Banjir BNPB</span>
              <Drop
                className={cn(
                  "h-3.5 w-3.5",
                  floodData?.isFloodFree === false
                    ? "text-red-600"
                    : "text-emerald-600"
                )}
              />
            </p>
            <p
              className={cn(
                "mt-1 text-sm font-black sm:text-base",
                floodData?.isFloodFree === false
                  ? "text-red-700 dark:text-red-400"
                  : "text-emerald-700 dark:text-emerald-400"
              )}
            >
              {floodData
                ? floodData.isFloodFree === null
                  ? "Data Belum Tersedia"
                  : `Risiko ${floodData.riskLevel}`
                : "Menganalisis…"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
              {floodData?.elevation?.elevationMeters != null
                ? `Elevasi ${floodData.elevation.elevationMeters} mdpl`
                : "Radius buffer 250m"}
            </p>
          </div>
        </section>

        {/* ── Header Info + Sidebar ─────────────────────────────── */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Main info */}
          <div className="space-y-5 lg:col-span-2">
            {/* Title & address */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  ID SiKumbang: {detail.idLokasi}
                </Badge>
                {hasCoordinates && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-500/20 dark:text-blue-300"
                  >
                    <MapPin weight="fill" className="h-3.5 w-3.5" /> Buka Google
                    Maps
                  </a>
                )}
              </div>

              <h1 className="text-2xl font-black tracking-tight leading-tight sm:text-3xl md:text-4xl">
                {detail.namaPerumahan}
              </h1>
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                  weight="fill"
                />
                <span>{detail.alamat}</span>
              </p>
            </div>

            {/* Developer card */}
            <Card className="rounded-2xl border-border/60">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <ShieldCheck
                    className="h-6 w-6 text-primary"
                    weight="duotone"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Dikembangkan Oleh
                  </p>
                  <p className="truncate font-extrabold text-foreground">
                    {detail.namaPengembang}
                  </p>
                  {detail.npwpPengembang && (
                    <p className="text-xs text-muted-foreground">
                      NPWP: {detail.npwpPengembang}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Smart Insights: Climate, Flood Buffer, Elevation & OSRM KRL Route */}
            {(geoData || floodData) && (
              <ClimateAgunanScoreCard
                distanceToJakartaKm={geoData?.distanceToJakarta}
                bestStationRoute={stationRoutes.bestStation}
                alternatives={stationRoutes.alternatives}
                krlApplicable={krlApplicable}
                floodData={floodData}
                sampleSpec={uniqueTipe[0] ?? null}
              />
            )}
          </div>

          {/* Sidebar: Kantor Pemasaran & Quick KPR Jump */}
          <div className="space-y-4">
            <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs">
              <CardContent className="p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold">
                  <MapTrifold
                    className="h-5 w-5 text-primary"
                    weight="duotone"
                  />
                  Kantor Pemasaran Resmi
                </h3>

                {detail.kantorPemasaran?.length > 0 ? (
                  <div className="space-y-5">
                    {detail.kantorPemasaran.map((kantor, i) => (
                      <div key={i} className="space-y-3">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {kantor.alamat}{" "}
                          {kantor.nomor ? `No. ${kantor.nomor}` : ""}
                        </p>
                        <div className="space-y-2">
                          {kantor.noTelp && (
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary shadow-xs">
                                <Phone className="h-4 w-4" weight="fill" />
                              </div>
                              <a
                                href={`tel:${kantor.noTelp.split(" ")[0]}`}
                                className="text-sm font-bold transition-colors hover:text-primary"
                              >
                                {kantor.noTelp}
                              </a>
                            </div>
                          )}
                          {kantor.email && (
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary shadow-xs">
                                <EnvelopeSimple
                                  className="h-4 w-4"
                                  weight="fill"
                                />
                              </div>
                              <a
                                href={`mailto:${kantor.email}`}
                                className="truncate text-sm font-medium transition-colors hover:text-primary"
                              >
                                {kantor.email}
                              </a>
                            </div>
                          )}
                        </div>
                        {kantor.noTelp && (
                          <a
                            href={`https://wa.me/62${kantor.noTelp.split(" ")[0].replace(/[^0-9]/g, "").replace(/^0/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block pt-1"
                          >
                            <Button className="h-11 w-full gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700">
                              <WhatsappLogo weight="fill" className="h-5 w-5" />
                              Hubungi via WhatsApp
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Informasi kontak pemasaran belum tersedia.
                  </p>
                )}

                <Separator className="my-4" />

                <Button
                  type="button"
                  variant="outline"
                  onClick={scrollToKpr}
                  className="h-11 w-full gap-2 rounded-xl border-primary/30 bg-background font-bold text-primary hover:bg-primary/10"
                >
                  <Calculator weight="duotone" className="h-5 w-5" />
                  Simulasi KPR BTN &amp; Komuter
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* ── Lokasi, Rute KRL, Siteplan & Tur 360 (Interactive Showcase Tabs) ── */}
        <section id="showcase-tabs" className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Eksplorasi Imersif, Rute KRL &amp; Siteplan
                </h2>
                {chellData && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-xs font-bold text-primary"
                  >
                    {chellData.isDemoFallback
                      ? "Contoh Demo Chell-Tour"
                      : "Live Chell-Tour"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Pilih kavling langsung di Siteplan Interaktif 3D, jelajahi rumah
                contoh 360°, atau cek rute jalan raya OSRM ke stasiun KRL.
              </p>
              {chellData?.isDemoFallback && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  *Developer perumahan ini belum memakai Chell-Tour. Siteplan
                  dan tur di bawah adalah contoh interaktif untuk menunjukkan
                  fiturnya.
                </p>
              )}
            </div>
            {chellData?.project?.primarySiteplan && (
              <a
                href={`${chellData.chellTourBaseUrl}${chellData.project.primarySiteplan.fullUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-primary hover:underline sm:self-auto"
              >
                Buka Layar Penuh <ArrowSquareOut className="h-4 w-4" />
              </a>
            )}
          </div>

          <Tabs
            value={showcaseTab}
            onValueChange={setShowcaseTab}
            className="space-y-4"
          >
            {/* Mobile-scrollable single-row tab strip */}
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex h-auto min-w-max justify-start gap-1 rounded-xl border bg-muted/50 p-1">
                {chellData?.project?.primarySiteplan && (
                  <TabsTrigger
                    value="live-siteplan"
                    className="gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                  >
                    <MapTrifold className="h-4 w-4" weight="duotone" />
                    Siteplan Kavling Live
                  </TabsTrigger>
                )}
                {chellData?.project?.primaryTour && (
                  <TabsTrigger
                    value="tour-360"
                    className="gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                  >
                    <Compass className="h-4 w-4" weight="duotone" />
                    Tur 360° Rumah Contoh
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="route-map"
                  className="gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
                >
                  <Train
                    className="h-4 w-4 text-orange-500"
                    weight="duotone"
                  />
                  Rute KRL (OSRM) &amp; Audit Banjir
                </TabsTrigger>
                <TabsTrigger
                  value="siteplan"
                  className="gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
                >
                  <MapTrifold
                    className="h-4 w-4 text-primary"
                    weight="duotone"
                  />
                  Siteplan SiKumbang
                </TabsTrigger>
                <TabsTrigger
                  value="gmaps"
                  className="gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
                >
                  <MapPin className="h-4 w-4 text-blue-500" weight="duotone" />
                  Google Maps
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Chell-Tour Live Siteplan Embed */}
            {chellData?.project?.primarySiteplan && (
              <TabsContent value="live-siteplan" className="mt-0">
                <div className="relative h-[460px] overflow-hidden rounded-2xl border border-border/50 bg-slate-900 shadow-md md:h-[580px]">
                  <iframe
                    src={`${chellData.chellTourBaseUrl}${chellData.project.primarySiteplan.embedUrl}`}
                    title={chellData.project.primarySiteplan.name}
                    className="h-full w-full border-0"
                    allow="accelerometer; gyroscope; magnetometer"
                  />
                </div>
              </TabsContent>
            )}

            {/* Chell-Tour 360 Virtual Tour Embed */}
            {chellData?.project?.primaryTour && (
              <TabsContent value="tour-360" className="mt-0">
                <div className="relative h-[460px] overflow-hidden rounded-2xl border border-border/50 bg-slate-900 shadow-md md:h-[580px]">
                  <iframe
                    src={`${chellData.chellTourBaseUrl}${chellData.project.primaryTour.url}`}
                    title={chellData.project.primaryTour.name}
                    className="h-full w-full border-0"
                    allow="accelerometer; gyroscope; magnetometer; fullscreen"
                    loading="lazy"
                  />
                </div>
              </TabsContent>
            )}

            <TabsContent value="route-map" className="mt-0">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="relative h-80 overflow-hidden rounded-2xl border border-border/50 bg-muted shadow-sm md:h-[420px] lg:col-span-2">
                  {hasCoordinates ? (
                    <DetailRouteMap
                      propertyName={detail.namaPerumahan}
                      lat={Number(mapLat)}
                      lon={Number(mapLon)}
                      bestStationRoute={stationRoutes.bestStation}
                      alternatives={stationRoutes.alternatives}
                      krlRoute={activeKrlRoute}
                      isFloodFree={floodData?.isFloodFree ?? true}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40">
                      <MapPin weight="duotone" className="mb-2 h-10 w-10" />
                      <span className="text-sm font-medium">
                        Koordinat peta tidak tersedia
                      </span>
                    </div>
                  )}
                </div>

                {/* Side summary of 3 candidate KRL stations */}
                <div className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold">
                      <Train
                        className="h-4 w-4 text-orange-500"
                        weight="duotone"
                      />
                      Perbandingan 3 Stasiun KRL Terdekat
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Diurutkan berdasarkan{" "}
                      <strong>jarak tempuh jalan raya aktual (OSRM)</strong>,
                      bukan sekadar garis lurus udara.
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {stationRoutes.alternatives.length > 0 ? (
                        stationRoutes.alternatives.map((cand, idx) => (
                          <div
                            key={cand.station.name}
                            className={cn(
                              "rounded-xl border p-3 text-xs transition-colors",
                              idx === 0
                                ? "border-orange-500/40 bg-orange-500/10"
                                : "border-border/50 bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-foreground">
                                {idx + 1}. {cand.station.name}
                              </span>
                              {idx === 0 && (
                                <Badge className="bg-orange-600 text-[10px] text-white">
                                  Tercepat
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-muted-foreground">
                              <span>
                                Jalan raya:{" "}
                                <strong className="text-foreground">
                                  {cand.roadDistanceKm} km
                                </strong>{" "}
                                (~{cand.roadDurationMinutes} mnt)
                              </span>
                              <span className="text-[11px]">
                                Udara: {cand.straightDistanceKm} km
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                          Data stasiun belum tersedia.
                        </p>
                      )}
                    </div>
                  </div>

                  {activeKrlRoute && (
                    <div className="mt-4 rounded-xl border bg-muted/40 p-3 text-xs">
                      <p className="font-bold text-foreground">
                        Simulasi Rute KRL ke {activeKrlRoute.toStation}:
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Jarak rel{" "}
                        <strong className="text-foreground">
                          {activeKrlRoute.railDistanceKm} km
                        </strong>{" "}
                        ({activeKrlRoute.stationCount} stasiun) · ~
                        {activeKrlRoute.railDurationMinutes} menit di kereta ·
                        Tarif{" "}
                        <strong className="text-orange-600 dark:text-orange-400">
                          Rp
                          {activeKrlRoute.fareOneWay.toLocaleString("id-ID")}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="siteplan" className="mt-0">
              <div className="relative h-80 overflow-hidden rounded-2xl border border-border/50 bg-muted shadow-sm md:h-[420px]">
                {detail.siteplan ? (
                  <Image
                    src={getImageUrl(detail.siteplan)}
                    alt={`Siteplan ${detail.namaPerumahan}`}
                    fill
                    className="object-contain p-4"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : null}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40"
                  style={{ display: detail.siteplan ? "none" : "flex" }}
                >
                  <MapTrifold weight="duotone" className="mb-2 h-10 w-10" />
                  <span className="text-sm font-medium">
                    Siteplan tidak tersedia
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gmaps" className="mt-0">
              <div className="relative h-80 overflow-hidden rounded-2xl border border-border/50 bg-muted shadow-sm md:h-[420px]">
                {hasCoordinates ? (
                  <iframe
                    src={`https://maps.google.com/maps?q=${mapLat},${mapLon}&hl=id&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40">
                    <MapPin weight="duotone" className="mb-2 h-10 w-10" />
                    <span className="text-sm font-medium">
                      Peta tidak tersedia
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* ── Tipe Rumah ────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold sm:text-2xl">
                Pilihan Tipe Rumah &amp; Spesifikasi
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Cek tampak depan, denah ruangan, serta material bangunan
              </p>
            </div>
            <Badge variant="secondary" className="font-bold">
              {uniqueTipe.length} Tipe
            </Badge>
          </div>

          {uniqueTipe.length > 0 ? (
            <div className="space-y-8">
              {uniqueTipe.map((tipe) => (
                <Card
                  key={tipe.id}
                  className="overflow-hidden rounded-2xl border-border/60 shadow-xs transition-all duration-300 hover:shadow-lg"
                >
                  {/* Tipe header */}
                  <div className="border-b border-border/50 bg-gradient-to-b from-muted/35 to-transparent p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                      <div>
                        <div className="mb-2 flex items-center gap-2.5">
                          <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                            Tipe {tipe.nama}
                          </h3>
                          <Badge
                            className={cn(
                              "text-xs font-bold uppercase shadow-2xs",
                              tipe.status === "subsidi"
                                ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "border border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                            )}
                          >
                            {tipe.status}
                          </Badge>
                        </div>
                        <p className="text-2xl font-black text-primary sm:text-3xl">
                          {formatRupiah(tipe.harga)}
                        </p>
                      </div>

                      {/* Quick stats */}
                      <div className="flex flex-wrap items-center gap-4 self-start rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-2xs sm:gap-6 sm:px-5 sm:py-3.5">
                        {[
                          {
                            icon: (
                              <ArrowsOut className="h-4 w-4" weight="bold" />
                            ),
                            label: "Luas B/T",
                            value: `${tipe.luasBangunan}/${tipe.luasTanah} m²`,
                          },
                          {
                            icon: <Bed className="h-4 w-4" weight="fill" />,
                            label: "K. Tidur",
                            value: tipe.kamarTidur,
                          },
                          {
                            icon: <Bathtub className="h-4 w-4" weight="fill" />,
                            label: "K. Mandi",
                            value: tipe.kamarMandi,
                          },
                        ].map(({ icon, label, value }, i, arr) => (
                          <React.Fragment key={label}>
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[11px] font-bold text-muted-foreground">
                                {label}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  {icon}
                                </div>
                                <span className="text-base font-extrabold sm:text-lg">
                                  {value}
                                </span>
                              </div>
                            </div>
                            {i < arr.length - 1 && (
                              <div className="hidden h-9 w-px bg-border sm:block" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Images: Tampak & Denah */}
                  <div className="flex flex-col border-b border-border/50 md:flex-row">
                    {/* Tampak */}
                    <div className="group relative h-64 w-full overflow-hidden border-b border-border/50 bg-muted md:h-88 md:w-1/2 md:border-r md:border-b-0">
                      {tipe.fotoTampak ? (
                        <Image
                          src={getImageUrl(tipe.fotoTampak)}
                          alt={`Tampak ${tipe.nama}`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display =
                              "none"
                          }}
                        />
                      ) : null}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground/40"
                        style={{ display: tipe.fotoTampak ? "none" : "flex" }}
                      >
                        <Buildings weight="duotone" className="mb-2 h-10 w-10" />
                        <span className="text-sm">
                          Tampak Depan Tidak Tersedia
                        </span>
                      </div>
                      <div className="absolute top-3 left-3 rounded-lg border border-border/50 bg-background/90 px-3 py-1.5 text-xs font-bold shadow-xs backdrop-blur-md">
                        Foto Tampak Depan
                      </div>
                    </div>

                    {/* Denah */}
                    <div className="group relative h-64 w-full overflow-hidden bg-background/50 p-4 md:h-88 md:w-1/2">
                      {tipe.fotoDenah ? (
                        <Image
                          src={getImageUrl(tipe.fotoDenah)}
                          alt={`Denah ${tipe.nama}`}
                          fill
                          className="object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display =
                              "none"
                          }}
                        />
                      ) : null}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40"
                        style={{ display: tipe.fotoDenah ? "none" : "flex" }}
                      >
                        <ArrowsOut weight="duotone" className="mb-2 h-10 w-10" />
                        <span className="text-sm">Denah Tidak Tersedia</span>
                      </div>
                      <div className="absolute top-3 left-3 z-10 rounded-lg border border-border/50 bg-muted/90 px-3 py-1.5 text-xs font-bold shadow-xs backdrop-blur-md">
                        Denah Ruangan
                      </div>
                    </div>
                  </div>

                  {/* Spesifikasi */}
                  <div className="bg-background p-5 sm:p-6">
                    <h4 className="mb-4 flex items-center gap-2 text-base font-extrabold">
                      <ShieldCheck
                        className="h-5 w-5 text-primary"
                        weight="duotone"
                      />
                      Spesifikasi Material Bangunan
                    </h4>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                      {[
                        { label: "Atap", value: tipe.spesifikasiAtap },
                        { label: "Dinding", value: tipe.spesifikasiDinding },
                        { label: "Lantai", value: tipe.spesifikasiLantai },
                        { label: "Pondasi", value: tipe.spesifikasiPondasi },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="rounded-xl border border-border/50 bg-muted/20 p-3"
                        >
                          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {label}
                          </span>
                          <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground">
                            {value || "Spesifikasi tidak tersedia"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Action Bar (Siteplan 3D & 360 Tour) */}
                  {(chellData?.project?.primarySiteplan ||
                    chellData?.project?.primaryTour) && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-muted/30 px-5 py-3.5 sm:px-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        <span className="font-semibold">
                          Eksplorasi digital tersedia untuk Tipe {tipe.nama}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {chellData?.project?.primarySiteplan && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs font-bold hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                            onClick={() => {
                              setShowcaseTab("live-siteplan")
                              const el =
                                document.getElementById("showcase-tabs")
                              if (el)
                                el.scrollIntoView({ behavior: "smooth" })
                            }}
                          >
                            <MapTrifold
                              className="h-3.5 w-3.5 text-emerald-600"
                              weight="bold"
                            />
                            Pilih Unit di Siteplan Live
                          </Button>
                        )}
                        {chellData?.project?.primaryTour && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                            onClick={() => {
                              setShowcaseTab("tour-360")
                              const el =
                                document.getElementById("showcase-tabs")
                              if (el)
                                el.scrollIntoView({ behavior: "smooth" })
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" weight="bold" />
                            Tur Virtual 360° Interior
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/50 bg-muted/30 p-12 text-center">
              <Buildings className="mx-auto mb-3 h-14 w-14 text-muted-foreground/30" />
              <h3 className="mb-1.5 text-base font-bold">
                Belum Ada Tipe Rumah
              </h3>
              <p className="text-sm text-muted-foreground">
                Informasi tipe rumah belum tersedia dari SiKumbang.
              </p>
            </div>
          )}
        </section>

        {/* ── KPR Calculator ────────────────────────────────────── */}
        {uniqueTipe.length > 0 && (
          <>
            <Separator />
            <section>
              <KprCalculator
                tipeRumahList={uniqueTipe}
                bestStationRoute={stationRoutes.bestStation}
                workStation={workStation}
                onWorkStationChange={setWorkStation}
                propertyName={detail.namaPerumahan}
                developerName={detail.namaPengembang}
                propertyAddress={detail.alamat}
                developerPhone={primaryPhone}
                floodRiskLabel={
                  floodData
                    ? floodData.isFloodFree === null
                      ? "Belum Terpetakan InaRISK"
                      : `Risiko ${floodData.riskLevel} (InaRISK BNPB)`
                    : "Terverifikasi InaRISK"
                }
              />
            </section>
          </>
        )}
      </main>

      {/* ── Sticky Mobile Bottom Action Bar ───────────────────── */}
      <div className="glass-header pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border/70 px-4 pt-2.5 shadow-2xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {cheapestTipe ? `Mulai Tipe ${cheapestTipe.nama}` : "Harga"}
            </p>
            <p className="truncate text-base font-black text-primary">
              {cheapestTipe ? formatRupiah(cheapestTipe.harga) : "Hubungi Sales"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={scrollToKpr}
              className="h-10 gap-1.5 rounded-xl border-primary/30 px-3 text-xs font-bold text-primary"
            >
              <Calculator weight="bold" className="h-4 w-4" />
              Hitung KPR
            </Button>

            {cleanWaPhone ? (
              <a
                href={`https://wa.me/${cleanWaPhone}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  size="sm"
                  className="h-10 gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <WhatsappLogo weight="fill" className="h-4 w-4" />
                  WhatsApp
                </Button>
              </a>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={scrollToKpr}
                className="h-10 gap-1.5 rounded-xl bg-blue-700 px-3.5 text-xs font-bold text-white"
              >
                Ajukan KPR
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
