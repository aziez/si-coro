"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { HouseCard, type Perumahan } from "@/components/HouseCard"
import { HouseDetailModal } from "@/components/HouseDetailModal"
import { FloatingHeader } from "@/components/FloatingHeader"
import { CompareFloatingBar } from "@/components/CompareFloatingBar"
import ShareButton from "@/components/ShareButton"
import { useFavorites } from "@/hooks/useFavorites"
import { useCompare } from "@/hooks/useCompare"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MagnifyingGlass,
  Heart,
  MapPin,
  List,
  MapTrifold,
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

// ─── Constants ───────────────────────────────────────────────────────────────

const QUICK_FILTERS = [
  { name: "Bogor", code: "3201", prov: "32" },
  { name: "Depok", code: "3276", prov: "32" },
  { name: "Tangerang", code: "3603", prov: "36" },
  { name: "Bekasi", code: "3216", prov: "32" },
]

const API_BASE = "https://sikumbang.tapera.go.id"
const LIMIT = 50

const PropertyMap = dynamic(
  () => import("@/components/PropertyMap").then((module) => module.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[min(68dvh,680px)] min-h-[430px] animate-pulse rounded-2xl border bg-muted" />
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
  const [localSort, setLocalSort] = useState<"default" | "closest-jakarta">(
    "default"
  )
  const [isSubsidi, setIsSubsidi] = useState(false)
  const [searchTrigger, setSearchTrigger] = useState(0)

  // ── Dropdown options ──
  const [provinces, setProvinces] = useState<Wilayah[]>([])
  const [kabupatens, setKabupatens] = useState<Wilayah[]>([])
  const [kecamatans, setKecamatans] = useState<Wilayah[]>([])
  const [asosiasiList, setAsosiasiList] = useState<Asosiasi[]>([])

  // ── UI state ──
  const [selectedHouse, setSelectedHouse] = useState<Perumahan | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [sharedFavoritesMode, setSharedFavoritesMode] = useState(false)
  const [sharedData, setSharedData] = useState<Perumahan[]>([])
  const [isRestored, setIsRestored] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [mapListLimit, setMapListLimit] = useState(60)
  // ── Hooks ──
  const { favorites, toggleFavorite, isFavorite, addMultipleFavorites } =
    useFavorites()
  const { compareList, toggleCompare, isCompared, clearCompare } = useCompare()
  const { area: mapArea, searchAt: handleMapViewportChange } = useMapAreaSearch(
    {
      keyword: searchQuery,
      asosiasi: selectedAsosiasi,
    }
  )

  // ── Refs ──
  const loaderRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(0)
  const lastFetchedPage = useRef(0)

  // ─── Restore session state / shared URL ────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedIds = params.get("shared")

    if (sharedIds) {
      // Restoring an external URL snapshot intentionally initializes several states together.
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
    // A province change invalidates the dependent administrative selection.
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
    // A city change invalidates the dependent administrative selection.
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

  const handleQuickFilter = useCallback(
    (qf: (typeof QUICK_FILTERS)[0]) => {
      const prov = provinces.find((p) => p.kodeWilayah === qf.prov)
      if (!prov) return
      setSelectedProvinsi(prov.kodeWilayah)
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
    [provinces]
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
  const activeSearchLabel = [
    searchQuery,
    provinces.find((p) => p.kodeWilayah === selectedProvinsi)?.namaWilayah,
    kabupatens.find((k) => k.kodeWilayah === selectedKabupaten)?.namaWilayah,
    kecamatans.find((k) => k.kodeWilayah === selectedKecamatan)?.namaWilayah,
    asosiasiList.find((a) => String(a.id) === selectedAsosiasi)?.singkatan,
    isSubsidi ? "Subsidi" : "",
  ]
    .filter(Boolean)
    .join(" · ")

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Floating Header — always visible */}
      <FloatingHeader
        // Search panel props
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
        // Header-specific props
        favoritesCount={favorites.length}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly((v) => !v)}
        activeSearchLabel={activeSearchLabel}
      />

      {/* Spacer for fixed header */}
      <div className="h-14" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Shared favorites banner */}
        {sharedFavoritesMode && (
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/8 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
                <Heart weight="fill" className="h-5 w-5 text-red-500" />
                Daftar Rekomendasi Favorit
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Seseorang telah membagikan daftar perumahan pilihan ini kepada
                Anda.
              </p>
            </div>
            <Button
              onClick={() => {
                addMultipleFavorites(sharedData)
                alert(
                  "Berhasil! Semua perumahan telah ditambahkan ke Favorit Anda."
                )
              }}
              className="shrink-0"
            >
              Tambahkan ke Favorit Saya
            </Button>
          </div>
        )}

        {/* Quick Filters + Actions bar */}
        {!sharedFavoritesMode && (
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Pintasan:
              </span>
              {QUICK_FILTERS.map((qf) => (
                <button
                  key={qf.name}
                  onClick={() => handleQuickFilter(qf)}
                  className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
                >
                  {qf.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {favorites.length > 0 && (
                <ShareButton
                  title="Daftar Rumah Favorit Si-Coro"
                  text="Lihat daftar perumahan impian yang sudah saya pilih di Si-Coro!"
                  customUrl={sharedUrl}
                />
              )}
            </div>
          </div>
        )}

        {/* Results section */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              {showFavoritesOnly
                ? "Properti Favorit"
                : activeKodeWilayah || searchQuery
                  ? "Hasil Pencarian"
                  : "Rekomendasi Terbaru"}
            </h2>
            <div className="flex items-center gap-2">
              {!loading && !showFavoritesOnly && !sharedFavoritesMode && (
                <span className="text-sm text-muted-foreground">
                  {finalData.length} dari {totalData}
                </span>
              )}
              {isSubsidi && (
                <Badge
                  variant="secondary"
                  className="text-xs text-emerald-600 dark:text-emerald-400"
                >
                  Subsidi
                </Badge>
              )}
              {!loading && finalData.length > 0 && (
                <div className="flex rounded-lg border bg-muted/40 p-0.5">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-3.5 w-3.5" /> Daftar
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => setViewMode("map")}
                  >
                    <MapTrifold className="h-3.5 w-3.5" /> Peta
                  </Button>
                </div>
              )}

              {!loading &&
                finalData.length > 0 &&
                !showFavoritesOnly &&
                !sharedFavoritesMode && (
                  <div className="ml-2 w-48">
                    <Select
                      value={localSort}
                      onValueChange={(
                        v: "default" | "closest-jakarta" | null
                      ) => {
                        if (v) setLocalSort(v)
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" weight="bold" />
                          <SelectValue placeholder="Urutkan" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          Terbaru (Default)
                        </SelectItem>
                        <SelectItem value="closest-jakarta">
                          Terdekat dari Jakarta
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && data.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border bg-card"
                >
                  <Skeleton className="aspect-video w-full" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="mt-3 border-t pt-2">
                      <Skeleton className="h-5 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : finalData.length > 0 && viewMode === "map" ? (
            <div className="space-y-5">
              <PropertyMap
                properties={mapData}
                selectedProperty={selectedHouse}
                onSelectProperty={setSelectedHouse}
                onViewportChange={handleMapViewportChange}
                loading={mapArea.status === "loading"}
                error={mapArea.error}
                regionLabel={mapArea.region?.namaKabupaten}
                meta={mapArea.meta}
              />
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">
                  Perumahan di area peta
                  {mapArea.region ? `: ${mapArea.region.namaKabupaten}` : ""}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {mapArea.status === "loading"
                    ? "Memuat..."
                    : `${mapData.length} lokasi`}
                </span>
              </div>
              {mapData.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mapData.slice(0, mapListLimit).map((item) => (
                    <HouseCard
                      key={`${item.idLokasi}-map-list`}
                      data={item}
                      onClick={() => setSelectedHouse(item)}
                      isFavorite={isFavorite(item.idLokasi)}
                      onToggleFavorite={() => toggleFavorite(item)}
                      isCompared={isCompared(item.idLokasi)}
                      onToggleCompare={() => toggleCompare(item)}
                    />
                  ))}
                  {mapData.length > mapListLimit && (
                    <div className="col-span-full flex justify-center pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setMapListLimit((limit) => limit + 60)}
                      >
                        Tampilkan 60 lokasi berikutnya
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                  {mapArea.status === "loading"
                    ? "Memuat perumahan untuk wilayah peta..."
                    : "Tidak ada perumahan pada wilayah peta ini."}
                </div>
              )}
            </div>
          ) : finalData.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {finalData.map((item) => (
                <HouseCard
                  key={item.idLokasi}
                  data={item}
                  onClick={() => setSelectedHouse(item)}
                  isFavorite={isFavorite(item.idLokasi)}
                  onToggleFavorite={() => toggleFavorite(item)}
                  isCompared={isCompared(item.idLokasi)}
                  onToggleCompare={() => toggleCompare(item)}
                />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="rounded-2xl border border-dashed bg-card py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                {showFavoritesOnly ? (
                  <Heart className="h-7 w-7 text-muted-foreground" />
                ) : (
                  <MagnifyingGlass className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <h3 className="mb-1.5 text-base font-semibold">
                {showFavoritesOnly
                  ? "Belum ada properti favorit"
                  : "Tidak ada perumahan ditemukan"}
              </h3>
              <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                {showFavoritesOnly
                  ? "Tekan ikon ♥ pada kartu properti untuk menyimpannya."
                  : "Coba gunakan kriteria wilayah yang berbeda atau matikan filter subsidi."}
              </p>
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
                  <span className="text-sm font-medium text-muted-foreground">
                    Memuat lebih banyak...
                  </span>
                </div>
              )}
            </div>
          )}
      </main>

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
          onToggleFavorite={() => toggleFavorite(selectedHouse)}
        />
      )}
    </div>
  )
}
