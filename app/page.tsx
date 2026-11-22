"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { HouseCard, type Perumahan } from "@/components/HouseCard"
import { HouseDetailModal } from "@/components/HouseDetailModal"
import { FloatingHeader } from "@/components/FloatingHeader"
import { CompareFloatingBar } from "@/components/CompareFloatingBar"
import { XRayHeroScanner } from "@/components/XRayHeroScanner"
import { BentoCommandCenter } from "@/components/BentoCommandCenter"
import ShareButton from "@/components/ShareButton"
import { useFavorites } from "@/hooks/useFavorites"
import { useCompare } from "@/hooks/useCompare"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MagnifyingGlass,
  Heart,
  MapPin,
  List,
  MapTrifold,
  SealCheck,
  ArrowCounterClockwise,
  CheckCircle,
  CaretUp,
  CaretDown,
  Sparkle,
} from "@phosphor-icons/react"
import type { Wilayah, Asosiasi } from "@/components/SearchPanel"
import { getDistanceToJakarta } from "@/lib/geoUtils"
import { useMapAreaSearch } from "@/hooks/useMapAreaSearch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// ─── Constants ───────────────────────────────────────────────────────────────

const QUICK_FILTERS = [
  { name: "Kab. Bogor", code: "3201", prov: "32" },
  { name: "Kab. Bekasi", code: "3216", prov: "32" },
  { name: "Kab. Tangerang", code: "3603", prov: "36" },
  { name: "Kota Depok", code: "3276", prov: "32" },
  { name: "Kota Bogor", code: "3271", prov: "32" },
  { name: "Tangsel", code: "3674", prov: "36" },
]

const API_BASE = "https://sikumbang.tapera.go.id"
const LIMIT = 50

const PropertyMap = dynamic(
  () => import("@/components/PropertyMap").then((module) => module.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[min(66dvh,640px)] min-h-[420px] animate-pulse rounded-2xl border bg-muted" />
    ),
  }
)

// ─── Page Component ──────────────────────────────────────────────────────────

export default function Page() {
  // ── Data state ──
  const [data, setData] = useState<Perumahan[]>([])
  const [loading, setLoading] = useState(true)
  const [totalData, setTotalData] = useState(0)
  const [page, setPage] = useState(1)

  // ── Search / filter state ──
  const [keyword, setKeyword] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProvinsi, setSelectedProvinsi] = useState("")
  const [selectedKabupaten, setSelectedKabupaten] = useState("")
  const [selectedKecamatan, setSelectedKecamatan] = useState("")
  const [selectedAsosiasi, setSelectedAsosiasi] = useState("")
  const [activeKodeWilayah, setActiveKodeWilayah] = useState("")
  const [localSort, setLocalSort] = useState<
    "default" | "closest-jakarta" | "price-asc"
  >("default")
  const [isSubsidi, setIsSubsidi] = useState(false)
  const [searchTrigger, setSearchTrigger] = useState(0)

  // ── Dropdown options ──
  const [provinces, setProvinces] = useState<Wilayah[]>([])
  const [kabupatens, setKabupatens] = useState<Wilayah[]>([])
  const [kecamatans, setKecamatans] = useState<Wilayah[]>([])
  const [asosiasiList, setAsosiasiList] = useState<Asosiasi[]>([])

  // ── UI state ──
  const [selectedHouse, setSelectedHouse] = useState<Perumahan | null>(null)
  const [hoveredMapHouse, setHoveredMapHouse] = useState<Perumahan | null>(null)
  const [mapFloodAutoEnable, setMapFloodAutoEnable] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [sharedFavoritesMode, setSharedFavoritesMode] = useState(false)
  const [sharedData, setSharedData] = useState<Perumahan[]>([])
  const [isRestored, setIsRestored] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [mapListLimit, setMapListLimit] = useState(60)
  const [heroCollapsed, setHeroCollapsed] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg)
  }, [])

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 3200)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // ── Hooks ──
  const { favorites, toggleFavorite, isFavorite, addMultipleFavorites } =
    useFavorites()
  const { compareList, toggleCompare, isCompared, clearCompare } =
    useCompare(triggerToast)
  const { area: mapArea, searchAt: handleMapViewportChange } = useMapAreaSearch(
    {
      keyword: searchQuery,
      asosiasi: selectedAsosiasi,
    }
  )

  const handleToggleFavoriteWithToast = useCallback(
    (house: Perumahan) => {
      const currentlyFav = isFavorite(house.idLokasi)
      toggleFavorite(house)
      triggerToast(
        currentlyFav
          ? `${house.namaPerumahan} dihapus dari Favorit.`
          : `${house.namaPerumahan} disimpan ke Favorit.`
      )
    },
    [isFavorite, toggleFavorite, triggerToast]
  )

  // ── Refs ──
  const loaderRef = useRef<HTMLDivElement>(null)
  const catalogRef = useRef<HTMLElement>(null)
  const scrollYRef = useRef(0)
  const lastFetchedPage = useRef(0)

  const scrollToCatalog = useCallback(() => {
    window.setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 60)
  }, [])

  // ─── Restore session state / shared URL ────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedIds = params.get("shared")

    if (sharedIds) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSharedFavoritesMode(true)
      const ids = sharedIds.split(",").filter(Boolean)
      setLoading(true)
      Promise.all(
        ids.map((id) =>
          fetch(`${API_BASE}/lokasi-perumahan/${id}/json`)
            .then((r) => r.json())
            .then((res) => {
              const d = res.detail ?? {}
              return {
                idLokasi: d.idLokasi,
                namaPerumahan: d.namaPerumahan,
                pengembang: { nama: d.namaPengembang },
                jenisPerumahan:
                  d.jenisPerumahan === 0 ? "Rumah Tapak" : "Rumah Susun",
                wilayah: {
                  kecamatan: d.alamat,
                  provinsi: "",
                  kabupaten: "",
                  kelurahan: "",
                },
                foto: d.foto ?? [],
                koordinatPerumahan: d.koordinat?.lat
                  ? `${d.koordinat.lat},${d.koordinat.lon}`
                  : d.koordinatPerumahan,
                jumlahUnit: 0,
                jumlahUnitKomersil: 0,
                tipeRumah: [],
              } as Perumahan
            })
        )
      )
        .then(setSharedData)
        .catch(console.error)
        .finally(() => {
          setLoading(false)
          setIsRestored(true)
        })
      return
    }

    // Restore from sessionStorage
    try {
      const saved = sessionStorage.getItem("si_coro_state")
      if (saved) {
        const s = JSON.parse(saved)
        if (s.data?.length > 0) {
          setData(s.data)
          setPage(s.page ?? 1)
          setTotalData(s.totalData ?? 0)
          lastFetchedPage.current = s.page ?? 0
        }
        setKeyword(s.keyword ?? "")
        setSearchQuery(s.searchQuery ?? "")
        setSelectedProvinsi(s.selectedProvinsi ?? "")
        setSelectedKabupaten(s.selectedKabupaten ?? "")
        setSelectedKecamatan(s.selectedKecamatan ?? "")
        setSelectedAsosiasi(s.selectedAsosiasi ?? "")
        setActiveKodeWilayah(s.activeKodeWilayah ?? "")
        setIsSubsidi(s.isSubsidi ?? false)
        setLocalSort(s.localSort ?? "default")
        if (s.scrollY) setTimeout(() => window.scrollTo(0, s.scrollY), 100)
      }
    } catch (e) {
      console.error("Restore state failed", e)
    }
    setIsRestored(true)
  }, [])

  // ─── Track scroll ──────────────────────────────────────────────────────────

  useEffect(() => {
    let tid: NodeJS.Timeout
    const handler = () => {
      clearTimeout(tid)
      tid = setTimeout(() => {
        scrollYRef.current = window.scrollY
      }, 100)
    }
    window.addEventListener("scroll", handler, { passive: true })
    return () => {
      clearTimeout(tid)
      window.removeEventListener("scroll", handler)
    }
  }, [])

  // ─── Persist state to sessionStorage ──────────────────────────────────────

  useEffect(() => {
    if (!isRestored || sharedFavoritesMode) return
    const save = () =>
      sessionStorage.setItem(
        "si_coro_state",
        JSON.stringify({
          data,
          page,
          totalData,
          keyword,
          searchQuery,
          selectedProvinsi,
          selectedKabupaten,
          selectedKecamatan,
          selectedAsosiasi,
          activeKodeWilayah,
          scrollY: scrollYRef.current,
          isSubsidi,
          localSort,
        })
      )
    save()
    return () => save()
  }, [
    data,
    page,
    totalData,
    keyword,
    searchQuery,
    selectedProvinsi,
    selectedKabupaten,
    selectedKecamatan,
    selectedAsosiasi,
    activeKodeWilayah,
    isSubsidi,
    localSort,
    isRestored,
    sharedFavoritesMode,
  ])

  // ─── Fetch provinces & asosiasi on mount ───────────────────────────────────

  useEffect(() => {
    fetch(`${API_BASE}/ajax/wilayah/get-provinsi`)
      .then((r) => r.json())
      .then(setProvinces)
      .catch(console.error)
    fetch(`${API_BASE}/ajax/asosiasi/get`)
      .then((r) => r.json())
      .then(setAsosiasiList)
      .catch(console.error)
  }, [])

  // ─── Fetch kabupatens when provinsi changes ────────────────────────────────

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedKabupaten("")
    if (!selectedProvinsi) {
      setKabupatens([])
      return
    }
    fetch(`${API_BASE}/ajax/wilayah/get-kabupaten/${selectedProvinsi}`)
      .then((r) => r.json())
      .then(setKabupatens)
      .catch(console.error)
  }, [selectedProvinsi])

  // ─── Fetch kecamatans when kabupaten changes ───────────────────────────────

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedKecamatan("")
    if (!selectedKabupaten) {
      setKecamatans([])
      return
    }
    fetch(`${API_BASE}/ajax/wilayah/get-kecamatan/${selectedKabupaten}`)
      .then((r) => r.json())
      .then(setKecamatans)
      .catch(console.error)
  }, [selectedKabupaten])

  // ─── Main data fetch ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!isRestored || sharedFavoritesMode) return
    if (page <= lastFetchedPage.current) {
      setLoading(false)
      return
    }

    setLoading(true)
    const url = new URL(`${API_BASE}/ajax/lokasi/search`)
    url.searchParams.set("selectedSearch", "wilayah")
    url.searchParams.set("skalaPerumahan", "semua")
    url.searchParams.set("sort", "terbaru")
    url.searchParams.set("searchBy", "nama-perumahan")
    url.searchParams.set("limit", String(LIMIT))
    url.searchParams.set("page", String(page))
    if (activeKodeWilayah)
      url.searchParams.set("kodeWilayah", activeKodeWilayah)
    if (selectedAsosiasi) url.searchParams.set("asosiasi", selectedAsosiasi)
    if (searchQuery) url.searchParams.set("keyword", searchQuery)

    fetch(url.toString())
      .then((r) => r.json())
      .then((json) => {
        setData((prev) =>
          page === 1 ? (json.data ?? []) : [...prev, ...(json.data ?? [])]
        )
        setTotalData(json.count?.totalLokasi ?? 0)
        lastFetchedPage.current = page
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [
    searchQuery,
    activeKodeWilayah,
    selectedAsosiasi,
    page,
    searchTrigger,
    isRestored,
    sharedFavoritesMode,
  ])

  // ─── Infinite scroll observer ──────────────────────────────────────────────

  useEffect(() => {
    if (
      !isRestored ||
      loading ||
      viewMode === "map" ||
      showFavoritesOnly ||
      data.length >= totalData ||
      totalData === 0
    )
      return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setPage((p) => p + 1)
      },
      { threshold: 0.1 }
    )
    if (loaderRef.current) obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [loading, viewMode, showFavoritesOnly, data.length, totalData, isRestored])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      setSearchQuery(keyword)
      setActiveKodeWilayah(
        selectedKecamatan || selectedKabupaten || selectedProvinsi
      )
      setData([])
      setPage(1)
      lastFetchedPage.current = 0
      setSearchTrigger((t) => t + 1)
    },
    [keyword, selectedKecamatan, selectedKabupaten, selectedProvinsi]
  )

  const handleResetFilters = useCallback(() => {
    setKeyword("")
    setSearchQuery("")
    setSelectedProvinsi("")
    setSelectedKabupaten("")
    setSelectedKecamatan("")
    setSelectedAsosiasi("")
    setActiveKodeWilayah("")
    setIsSubsidi(false)
    setLocalSort("default")
    setData([])
    setPage(1)
    lastFetchedPage.current = 0
    setSearchTrigger((t) => t + 1)
    triggerToast("Semua filter pencarian telah direset.")
  }, [triggerToast])

  const handleQuickFilter = useCallback(
    (qf: (typeof QUICK_FILTERS)[0]) => {
      // Clicking the active quick filter again resets it
      if (activeKodeWilayah === qf.code) {
        handleResetFilters()
        return
      }
      setSelectedProvinsi(qf.prov)
      setSelectedKecamatan("")
      fetch(`${API_BASE}/ajax/wilayah/get-kabupaten/${qf.prov}`)
        .then((r) => r.json())
        .then((d: Wilayah[]) => {
          setKabupatens(d)
          const kab = d.find((k) => k.kodeWilayah === qf.code)
          if (kab) setSelectedKabupaten(kab.kodeWilayah)
          setActiveKodeWilayah(qf.code)
          setData([])
          setPage(1)
          lastFetchedPage.current = 0
          setSearchTrigger((t) => t + 1)
        })
    },
    [activeKodeWilayah, handleResetFilters]
  )

  // ─── Derived state ─────────────────────────────────────────────────────────

  const dataSource = sharedFavoritesMode
    ? sharedData
    : showFavoritesOnly
      ? favorites
      : data
  const filteredData = isSubsidi
    ? dataSource.filter(
        (item) =>
          item.tipeRumah?.some((t) => t.status === "subsidi") &&
          item.jumlahUnit > 0
      )
    : dataSource

  const finalData = [...filteredData]
  if (localSort === "closest-jakarta") {
    finalData.sort((a, b) => {
      let distA = Infinity
      let distB = Infinity
      if (a.koordinatPerumahan) {
        const [latA, lonA] = a.koordinatPerumahan.split(",").map(Number)
        distA = getDistanceToJakarta(latA, lonA)
      }
      if (b.koordinatPerumahan) {
        const [latB, lonB] = b.koordinatPerumahan.split(",").map(Number)
        distB = getDistanceToJakarta(latB, lonB)
      }
      return distA - distB
    })
  } else if (localSort === "price-asc") {
    finalData.sort((a, b) => {
      const priceA = a.tipeRumah?.length
        ? Math.min(...a.tipeRumah.map((t) => t.harga))
        : Infinity
      const priceB = b.tipeRumah?.length
        ? Math.min(...b.tipeRumah.map((t) => t.harga))
        : Infinity
      return priceA - priceB
    })
  }

  const mapDataSource = mapArea.region ? mapArea.properties : finalData
  const mapData = isSubsidi
    ? mapDataSource.filter(
        (item) =>
          item.tipeRumah?.some((type) => type.status === "subsidi") &&
          item.jumlahUnit > 0
      )
    : mapDataSource

  const sharedUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?shared=${favorites.map((f) => f.idLokasi).join(",")}`
      : ""

  // Build active search label for header pill
  const activeSearchParts = [
    searchQuery,
    kecamatans.find((k) => k.kodeWilayah === selectedKecamatan)?.namaWilayah ||
      kabupatens.find((k) => k.kodeWilayah === selectedKabupaten)
        ?.namaWilayah ||
      QUICK_FILTERS.find((q) => q.code === activeKodeWilayah)?.name ||
      provinces.find((p) => p.kodeWilayah === selectedProvinsi)?.namaWilayah,
    asosiasiList.find((a) => String(a.id) === selectedAsosiasi)?.singkatan,
    isSubsidi ? "Subsidi" : "",
  ].filter(Boolean)

  const activeSearchLabel = activeSearchParts.join(" · ")
  const activeFilterCount = activeSearchParts.length

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Floating Header — always visible */}
      <FloatingHeader
        provinces={provinces}
        kabupatens={kabupatens}
        kecamatans={kecamatans}
        asosiasiList={asosiasiList}
        selectedProvinsi={selectedProvinsi}
        selectedKabupaten={selectedKabupaten}
        selectedKecamatan={selectedKecamatan}
        selectedAsosiasi={selectedAsosiasi}
        keyword={keyword}
        isSubsidi={isSubsidi}
        onProvinsiChange={setSelectedProvinsi}
        onKabupatenChange={setSelectedKabupaten}
        onKecamatanChange={setSelectedKecamatan}
        onAsosiasiChange={setSelectedAsosiasi}
        onKeywordChange={setKeyword}
        onSubsidiChange={setIsSubsidi}
        onSearch={handleSearch}
        favoritesCount={favorites.length}
        compareCount={compareList.length}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly((v) => !v)}
        activeSearchLabel={activeSearchLabel}
        activeFilterCount={activeFilterCount}
        onResetFilters={handleResetFilters}
        isScanning={loading || mapArea.status === "loading"}
      />

      {/* Spacer for fixed 64px header */}
      <div className="h-16" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        {/* ── Interactive Hero: X-Ray Scanner (Concept 1) + Animated Bento Command Center (Concept 3) ── */}
        {!sharedFavoritesMode && !showFavoritesOnly && (
          <div className="space-y-3.5">
            {!heroCollapsed ? (
              <>
                <XRayHeroScanner
                  totalIndexed={totalData > 0 ? totalData : 35483}
                  isSubsidiActive={isSubsidi}
                  onOpenMapView={() => {
                    setMapFloodAutoEnable(false)
                    setViewMode("map")
                    scrollToCatalog()
                  }}
                  onToggleSubsidiQuick={() => {
                    setIsSubsidi((v) => !v)
                    scrollToCatalog()
                  }}
                />

                <BentoCommandCenter
                  onLaunchFloodMap={() => {
                    setMapFloodAutoEnable(true)
                    setViewMode("map")
                    scrollToCatalog()
                    triggerToast(
                      "Layer Peta Bahaya Banjir InaRISK BNPB diaktifkan."
                    )
                  }}
                  onLaunchKrlMap={() => {
                    setMapFloodAutoEnable(false)
                    setViewMode("map")
                    scrollToCatalog()
                    triggerToast(
                      "Menampilkan 7 koridor rel KRL asli OSM & 84 stasiun aktif."
                    )
                  }}
                  onSortClosestJakarta={() => {
                    setLocalSort("closest-jakarta")
                    scrollToCatalog()
                    triggerToast(
                      "Diurutkan berdasarkan jarak terdekat ke pusat Jakarta."
                    )
                  }}
                  onOpenFirstPropertyTour={() => {
                    if (finalData.length > 0) {
                      setSelectedHouse(finalData[0])
                    } else {
                      scrollToCatalog()
                      triggerToast(
                        "Pilih perumahan di katalog untuk membuka Siteplan Live & Tur 360°."
                      )
                    }
                  }}
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setHeroCollapsed(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
                  >
                    Ringkas Hero <CaretUp weight="bold" className="h-3 w-3" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/20 bg-gradient-to-r from-emerald-500/10 via-card to-sky-500/10 px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Sparkle
                    weight="fill"
                    className="h-4 w-4 text-emerald-500"
                  />
                  <span>
                    Si-Coro — Cek Isi Rumah, Bukan Kulitnya (35.483+ Perumahan ·
                    84 Stasiun KRL)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHeroCollapsed(false)}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-background px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                >
                  Tampilkan X-Ray &amp; Command Center{" "}
                  <CaretDown weight="bold" className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Shared favorites banner */}
        {sharedFavoritesMode && (
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/8 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-primary">
                <Heart weight="fill" className="h-5 w-5 text-red-500" />
                Daftar Rekomendasi Rumah Pilihan
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Seseorang telah membagikan daftar perumahan pilihan ini kepada
                Anda.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSharedFavoritesMode(false)
                  window.history.replaceState({}, "", "/")
                }}
              >
                Jelajahi Semua
              </Button>
              <Button
                onClick={() => {
                  addMultipleFavorites(sharedData)
                  triggerToast(
                    "Berhasil! Semua perumahan ditambahkan ke Favorit Anda."
                  )
                }}
                className="shrink-0 font-bold"
              >
                Simpan ke Favorit Saya
              </Button>
            </div>
          </div>
        )}

        {/* ── One-Tap Quick Filter Strip (Horizontal Scroll on Mobile) ── */}
        {!sharedFavoritesMode && (
          <div className="flex items-center justify-between gap-3">
            <div className="no-scrollbar -mx-4 flex flex-1 items-center gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
              {/* Instant 1-Tap Subsidi Filter Chip */}
              <button
                type="button"
                onClick={() => setIsSubsidi((v) => !v)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-all active:scale-95",
                  isSubsidi
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/25"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300"
                )}
              >
                <SealCheck weight="fill" className="h-4 w-4" />
                Rumah Subsidi
              </button>

              <div className="h-5 w-px shrink-0 bg-border" />

              {QUICK_FILTERS.map((qf) => {
                const isActive = activeKodeWilayah === qf.code
                return (
                  <button
                    type="button"
                    key={qf.code}
                    onClick={() => handleQuickFilter(qf)}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1 rounded-full border px-3.5 text-xs font-bold transition-all active:scale-95",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "border-border/80 bg-card text-foreground/80 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    <MapPin
                      weight={isActive ? "fill" : "regular"}
                      className="h-3.5 w-3.5"
                    />
                    {qf.name}
                  </button>
                )
              })}

              {(activeKodeWilayah ||
                searchQuery ||
                selectedAsosiasi ||
                isSubsidi) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/20"
                >
                  <ArrowCounterClockwise weight="bold" className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>

            {favorites.length > 0 && (
              <div className="shrink-0">
                <ShareButton
                  title="Daftar Rumah Favorit Si-Coro"
                  text="Lihat daftar perumahan impian yang sudah saya cek risiko & biayanya di Si-Coro!"
                  customUrl={sharedUrl}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Results Section ── */}
        <section ref={catalogRef} className="scroll-mt-20">
          {/* Mobile-Friendly Results Toolbar */}
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">
                {showFavoritesOnly
                  ? "Properti Favorit Saya"
                  : activeSearchLabel
                    ? `Hasil: ${activeSearchLabel}`
                    : "Eksplorasi Perumahan Terbaru"}
              </h2>
              {!loading && !showFavoritesOnly && !sharedFavoritesMode && (
                <span className="text-xs font-semibold text-muted-foreground sm:text-sm">
                  ({finalData.length} dari{" "}
                  {totalData.toLocaleString("id-ID")} lokasi)
                </span>
              )}
            </div>

            {/* View Toggle & Sort Controls */}
            {((!loading && finalData.length > 0) || viewMode === "map") && (
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                {/* Daftar / Peta Segmented Control */}
                <div className="flex rounded-xl border border-border/80 bg-muted/50 p-1">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 gap-1.5 rounded-lg px-3 text-xs font-bold",
                      viewMode === "list" && "shadow-xs"
                    )}
                    onClick={() => setViewMode("list")}
                  >
                    <List weight="bold" className="h-3.5 w-3.5" /> Daftar
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 gap-1.5 rounded-lg px-3 text-xs font-bold",
                      viewMode === "map" && "shadow-xs"
                    )}
                    onClick={() => setViewMode("map")}
                  >
                    <MapTrifold weight="bold" className="h-3.5 w-3.5" /> Peta
                    KRL &amp; Banjir
                  </Button>
                </div>

                {/* Sort Select */}
                {!showFavoritesOnly && !sharedFavoritesMode && (
                  <div className="w-44 sm:w-48">
                    <Select
                      value={localSort}
                      onValueChange={(
                        v:
                          | "default"
                          | "closest-jakarta"
                          | "price-asc"
                          | null
                      ) => {
                        if (v) setLocalSort(v)
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-xl bg-card text-xs font-semibold">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin
                            className="h-3.5 w-3.5 shrink-0 text-primary"
                            weight="fill"
                          />
                          <SelectValue placeholder="Urutkan" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          Terbaru Diperbarui
                        </SelectItem>
                        <SelectItem value="closest-jakarta">
                          Terdekat ke Jakarta
                        </SelectItem>
                        <SelectItem value="price-asc">
                          Harga Termurah
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Loading skeletons (list view only so map opens instantly) */}
          {viewMode !== "map" && loading && data.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border bg-card"
                >
                  <Skeleton className="aspect-[16/10] w-full" />
                  <div className="space-y-2.5 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-7 w-full rounded-lg" />
                    <div className="mt-3 flex justify-between border-t pt-3">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-5 w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === "map" ? (
            <div className="space-y-5">
              <PropertyMap
                properties={mapData}
                selectedProperty={selectedHouse}
                hoveredProperty={hoveredMapHouse}
                onSelectProperty={setSelectedHouse}
                onViewportChange={handleMapViewportChange}
                loading={mapArea.status === "loading"}
                error={mapArea.error}
                regionLabel={mapArea.region?.namaKabupaten}
                meta={mapArea.meta}
                floodEnabled={mapFloodAutoEnable}
                onFloodEnabledChange={setMapFloodAutoEnable}
              />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">
                    Perumahan pada Area Peta
                    {mapArea.region ? `: ${mapArea.region.namaKabupaten}` : ""}
                  </h3>
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    Arahkan kursor pada kartu untuk menyorot radius banjir 250m
                    &amp; garis akses KRL di peta.
                  </p>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {mapArea.status === "loading"
                    ? "Memuat..."
                    : `${mapData.length} lokasi ditemukan`}
                </span>
              </div>
              {mapData.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {mapData.slice(0, mapListLimit).map((item, idx) => (
                    <HouseCard
                      key={`${item.idLokasi}-map-list`}
                      data={item}
                      index={idx}
                      onClick={() => setSelectedHouse(item)}
                      isFavorite={isFavorite(item.idLokasi)}
                      onToggleFavorite={() =>
                        handleToggleFavoriteWithToast(item)
                      }
                      isCompared={isCompared(item.idLokasi)}
                      onToggleCompare={() => toggleCompare(item)}
                      isHighlighted={
                        hoveredMapHouse?.idLokasi === item.idLokasi
                      }
                      onHoverChange={(hovered) =>
                        setHoveredMapHouse(hovered ? item : null)
                      }
                    />
                  ))}
                  {mapData.length > mapListLimit && (
                    <div className="col-span-full flex justify-center pt-2">
                      <Button
                        variant="outline"
                        className="rounded-full px-6 font-bold"
                        onClick={() => setMapListLimit((limit) => limit + 60)}
                      >
                        Tampilkan 60 Lokasi Berikutnya
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                  {mapArea.status === "loading"
                    ? "Memuat perumahan untuk wilayah peta..."
                    : "Tidak ada perumahan pada wilayah peta ini. Geser peta atau matikan filter subsidi."}
                </div>
              )}
            </div>
          ) : finalData.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {finalData.map((item, idx) => (
                <HouseCard
                  key={item.idLokasi}
                  data={item}
                  index={idx}
                  onClick={() => setSelectedHouse(item)}
                  isFavorite={isFavorite(item.idLokasi)}
                  onToggleFavorite={() => handleToggleFavoriteWithToast(item)}
                  isCompared={isCompared(item.idLokasi)}
                  onToggleCompare={() => toggleCompare(item)}
                />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="rounded-2xl border border-dashed bg-card px-4 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                {showFavoritesOnly ? (
                  <Heart weight="duotone" className="h-7 w-7" />
                ) : (
                  <MagnifyingGlass weight="duotone" className="h-7 w-7" />
                )}
              </div>
              <h3 className="mb-1.5 text-base font-extrabold">
                {showFavoritesOnly
                  ? "Belum Ada Properti Favorit"
                  : "Tidak Ada Perumahan yang Cocok"}
              </h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                {showFavoritesOnly
                  ? "Tekan tombol ♥ pada kartu perumahan untuk menyimpan dan membandingkannya bersama keluarga."
                  : "Coba pilih wilayah lain atau matikan filter Khusus Rumah Subsidi."}
              </p>
              {!showFavoritesOnly && (
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-full font-bold"
                >
                  Reset Semua Filter
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Infinite scroll sentinel */}
        {!showFavoritesOnly &&
          !sharedFavoritesMode &&
          viewMode === "list" &&
          data.length < totalData && (
            <div ref={loaderRef} className="flex justify-center py-10">
              {loading && (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <span className="text-sm font-semibold text-muted-foreground">
                    Memuat perumahan berikutnya...
                  </span>
                </div>
              )}
            </div>
          )}
      </main>

      {/* Mobile Floating Map / List Toggle Pill (Airbnb-style thumb button) */}
      {!loading && finalData.length > 0 && compareList.length === 0 && (
        <div className="pb-safe pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center sm:hidden">
          <button
            type="button"
            onClick={() =>
              setViewMode((m) => (m === "list" ? "map" : "list"))
            }
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-extrabold text-white shadow-xl ring-1 ring-white/15 transition-transform active:scale-95 dark:bg-primary dark:text-primary-foreground"
          >
            {viewMode === "list" ? (
              <>
                <MapTrifold weight="fill" className="h-4 w-4" />
                Buka Peta KRL &amp; Banjir
              </>
            ) : (
              <>
                <List weight="bold" className="h-4 w-4" />
                Tampilkan Daftar Kartu ({mapData.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* Non-intrusive Toast Notification */}
      {toastMessage && (
        <div className="pointer-events-none fixed top-20 right-4 left-4 z-50 flex justify-center animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-primary/30 bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-md dark:bg-card dark:text-foreground">
            <CheckCircle
              weight="fill"
              className="h-4 w-4 shrink-0 text-emerald-400"
            />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Compare floating bar */}
      <CompareFloatingBar
        compareList={compareList}
        onRemove={toggleCompare}
        onClear={clearCompare}
      />

      {/* Detail modal */}
      {selectedHouse && (
        <HouseDetailModal
          data={selectedHouse}
          onClose={() => setSelectedHouse(null)}
          isFavorite={isFavorite(selectedHouse.idLokasi)}
          onToggleFavorite={() => handleToggleFavoriteWithToast(selectedHouse)}
          isCompared={isCompared(selectedHouse.idLokasi)}
          onToggleCompare={() => toggleCompare(selectedHouse)}
        />
      )}
    </div>
  )
}
