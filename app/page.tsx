"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { HouseCard, type Perumahan } from "@/components/HouseCard";
import { HouseDetailModal } from "@/components/HouseDetailModal";
import { FloatingHeader } from "@/components/FloatingHeader";
import { CompareFloatingBar } from "@/components/CompareFloatingBar";
import ShareButton from "@/components/ShareButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MagnifyingGlass, Heart, MapPin } from "@phosphor-icons/react";
import type { Wilayah, Asosiasi } from "@/components/SearchPanel";
import { getDistanceToJakarta } from "@/lib/geoUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Constants ───────────────────────────────────────────────────────────────

const QUICK_FILTERS = [
  { name: "Bogor", code: "3201", prov: "32" },
  { name: "Depok", code: "3276", prov: "32" },
  { name: "Tangerang", code: "3603", prov: "36" },
  { name: "Bekasi", code: "3216", prov: "32" },
];

const API_BASE = "https://sikumbang.tapera.go.id";
const LIMIT = 50;

// ─── Page Component ──────────────────────────────────────────────────────────

export default function Page() {
  // ── Data state ──
  const [data, setData] = useState<Perumahan[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalData, setTotalData] = useState(0);
  const [page, setPage] = useState(1);

  // ── Search / filter state ──
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvinsi, setSelectedProvinsi] = useState("");
  const [selectedKabupaten, setSelectedKabupaten] = useState("");
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [selectedAsosiasi, setSelectedAsosiasi] = useState("");
  const [activeKodeWilayah, setActiveKodeWilayah] = useState("");
  const [localSort, setLocalSort] = useState<"default" | "closest-jakarta">("default");
  const [isSubsidi, setIsSubsidi] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);

  // ── Dropdown options ──
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [kabupatens, setKabupatens] = useState<Wilayah[]>([]);
  const [kecamatans, setKecamatans] = useState<Wilayah[]>([]);
  const [asosiasiList, setAsosiasiList] = useState<Asosiasi[]>([]);

  // ── UI state ──
  const [selectedHouse, setSelectedHouse] = useState<Perumahan | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sharedFavoritesMode, setSharedFavoritesMode] = useState(false);
  const [sharedData, setSharedData] = useState<Perumahan[]>([]);
  const [isRestored, setIsRestored] = useState(false);

  // ── Hooks ──
  const { favorites, toggleFavorite, isFavorite, addMultipleFavorites } = useFavorites();
  const { compareList, toggleCompare, isCompared, clearCompare } = useCompare();

  // ── Refs ──
  const loaderRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);
  const lastFetchedPage = useRef(0);

  // ─── Restore session state / shared URL ────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedIds = params.get("shared");

    if (sharedIds) {
      setSharedFavoritesMode(true);
      const ids = sharedIds.split(",").filter(Boolean);
      setLoading(true);
      Promise.all(
        ids.map(id =>
          fetch(`${API_BASE}/lokasi-perumahan/${id}/json`)
            .then(r => r.json())
            .then(res => {
              const d = res.detail ?? {};
              return {
                idLokasi: d.idLokasi,
                namaPerumahan: d.namaPerumahan,
                pengembang: { nama: d.namaPengembang },
                jenisPerumahan: d.jenisPerumahan === 0 ? "Rumah Tapak" : "Rumah Susun",
                wilayah: { kecamatan: d.alamat, provinsi: "", kabupaten: "", kelurahan: "" },
                foto: d.foto ?? [],
                koordinatPerumahan: d.koordinat?.lat ? `${d.koordinat.lat},${d.koordinat.lon}` : d.koordinatPerumahan,
                jumlahUnit: 0,
                jumlahUnitKomersil: 0,
                tipeRumah: [],
              } as Perumahan;
            })
        )
      )
        .then(setSharedData)
        .catch(console.error)
        .finally(() => { setLoading(false); setIsRestored(true); });
      return;
    }

    // Restore from sessionStorage
    try {
      const saved = sessionStorage.getItem("si_coro_state");
      if (saved) {
        const s = JSON.parse(saved);
        if (s.data?.length > 0) {
          setData(s.data);
          setPage(s.page ?? 1);
          setTotalData(s.totalData ?? 0);
          lastFetchedPage.current = s.page ?? 0;
        }
        setKeyword(s.keyword ?? "");
        setSearchQuery(s.searchQuery ?? "");
        setSelectedProvinsi(s.selectedProvinsi ?? "");
        setSelectedKabupaten(s.selectedKabupaten ?? "");
        setSelectedKecamatan(s.selectedKecamatan ?? "");
        setSelectedAsosiasi(s.selectedAsosiasi ?? "");
        setActiveKodeWilayah(s.activeKodeWilayah ?? "");
        setIsSubsidi(s.isSubsidi ?? false);
        setLocalSort(s.localSort ?? "default");
        if (s.scrollY) setTimeout(() => window.scrollTo(0, s.scrollY), 100);
      }
    } catch (e) {
      console.error("Restore state failed", e);
    }
    setIsRestored(true);
  }, []);

  // ─── Track scroll ──────────────────────────────────────────────────────────

  useEffect(() => {
    let tid: NodeJS.Timeout;
    const handler = () => { clearTimeout(tid); tid = setTimeout(() => { scrollYRef.current = window.scrollY; }, 100); };
    window.addEventListener("scroll", handler, { passive: true });
    return () => { clearTimeout(tid); window.removeEventListener("scroll", handler); };
  }, []);

  // ─── Persist state to sessionStorage ──────────────────────────────────────

  useEffect(() => {
    if (!isRestored || sharedFavoritesMode) return;
    const save = () => sessionStorage.setItem("si_coro_state", JSON.stringify({
      data, page, totalData, keyword, searchQuery,
      selectedProvinsi, selectedKabupaten, selectedKecamatan, selectedAsosiasi,
      activeKodeWilayah, scrollY: scrollYRef.current, isSubsidi, localSort
    }));
    save();
    return () => save();
  }, [data, page, totalData, keyword, searchQuery, selectedProvinsi, selectedKabupaten, selectedKecamatan, selectedAsosiasi, activeKodeWilayah, isSubsidi, localSort, isRestored, sharedFavoritesMode]);

  // ─── Fetch provinces & asosiasi on mount ───────────────────────────────────

  useEffect(() => {
    fetch(`${API_BASE}/ajax/wilayah/get-provinsi`).then(r => r.json()).then(setProvinces).catch(console.error);
    fetch(`${API_BASE}/ajax/asosiasi/get`).then(r => r.json()).then(setAsosiasiList).catch(console.error);
  }, []);

  // ─── Fetch kabupatens when provinsi changes ────────────────────────────────

  useEffect(() => {
    setSelectedKabupaten("");
    if (!selectedProvinsi) { setKabupatens([]); return; }
    fetch(`${API_BASE}/ajax/wilayah/get-kabupaten/${selectedProvinsi}`).then(r => r.json()).then(setKabupatens).catch(console.error);
  }, [selectedProvinsi]);

  // ─── Fetch kecamatans when kabupaten changes ───────────────────────────────

  useEffect(() => {
    setSelectedKecamatan("");
    if (!selectedKabupaten) { setKecamatans([]); return; }
    fetch(`${API_BASE}/ajax/wilayah/get-kecamatan/${selectedKabupaten}`).then(r => r.json()).then(setKecamatans).catch(console.error);
  }, [selectedKabupaten]);

  // ─── Main data fetch ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!isRestored || sharedFavoritesMode) return;
    if (page <= lastFetchedPage.current) { setLoading(false); return; }

    setLoading(true);
    const url = new URL(`${API_BASE}/ajax/lokasi/search`);
    url.searchParams.set("selectedSearch", "wilayah");
    url.searchParams.set("skalaPerumahan", "semua");
    url.searchParams.set("sort", "terbaru");
    url.searchParams.set("searchBy", "nama-perumahan");
    url.searchParams.set("limit", String(LIMIT));
    url.searchParams.set("page", String(page));
    if (activeKodeWilayah) url.searchParams.set("kodeWilayah", activeKodeWilayah);
    if (selectedAsosiasi) url.searchParams.set("asosiasi", selectedAsosiasi);
    if (searchQuery) url.searchParams.set("keyword", searchQuery);

    fetch(url.toString())
      .then(r => r.json())
      .then(json => {
        setData(prev => page === 1 ? (json.data ?? []) : [...prev, ...(json.data ?? [])]);
        setTotalData(json.count?.totalLokasi ?? 0);
        lastFetchedPage.current = page;
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchQuery, activeKodeWilayah, selectedAsosiasi, page, searchTrigger, isRestored, sharedFavoritesMode]);

  // ─── Infinite scroll observer ──────────────────────────────────────────────

  useEffect(() => {
    if (!isRestored || loading || showFavoritesOnly || data.length >= totalData || totalData === 0) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setPage(p => p + 1); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [loading, showFavoritesOnly, data.length, totalData, isRestored]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(keyword);
    setActiveKodeWilayah(selectedKecamatan || selectedKabupaten || selectedProvinsi);
    setData([]);
    setPage(1);
    lastFetchedPage.current = 0;
    setSearchTrigger(t => t + 1);
  }, [keyword, selectedKecamatan, selectedKabupaten, selectedProvinsi]);

  const handleQuickFilter = useCallback((qf: typeof QUICK_FILTERS[0]) => {
    const prov = provinces.find(p => p.kodeWilayah === qf.prov);
    if (!prov) return;
    setSelectedProvinsi(prov.kodeWilayah);
    setSelectedKecamatan("");
    fetch(`${API_BASE}/ajax/wilayah/get-kabupaten/${qf.prov}`)
      .then(r => r.json())
      .then((d: Wilayah[]) => {
        setKabupatens(d);
        const kab = d.find(k => k.kodeWilayah === qf.code);
        if (kab) setSelectedKabupaten(kab.kodeWilayah);
        setActiveKodeWilayah(qf.code);
        setData([]);
        setPage(1);
        lastFetchedPage.current = 0;
        setSearchTrigger(t => t + 1);
      });
  }, [provinces]);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const dataSource = sharedFavoritesMode ? sharedData : showFavoritesOnly ? favorites : data;
  const filteredData = isSubsidi
    ? dataSource.filter(item => item.tipeRumah?.some(t => t.status === "subsidi") && item.jumlahUnit > 0)
    : dataSource;

  const finalData = [...filteredData];
  if (localSort === "closest-jakarta") {
    finalData.sort((a, b) => {
      let distA = Infinity;
      let distB = Infinity;
      if (a.koordinatPerumahan) {
        const [latA, lonA] = a.koordinatPerumahan.split(',').map(Number);
        distA = getDistanceToJakarta(latA, lonA);
      }
      if (b.koordinatPerumahan) {
        const [latB, lonB] = b.koordinatPerumahan.split(',').map(Number);
        distB = getDistanceToJakarta(latB, lonB);
      }
      return distA - distB;
    });
  }

  const sharedUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?shared=${favorites.map(f => f.idLokasi).join(",")}`
    : "";

  // Build active search label for header pill
  const activeSearchLabel = [
    searchQuery,
    provinces.find(p => p.kodeWilayah === selectedProvinsi)?.namaWilayah,
    kabupatens.find(k => k.kodeWilayah === selectedKabupaten)?.namaWilayah,
    kecamatans.find(k => k.kodeWilayah === selectedKecamatan)?.namaWilayah,
    asosiasiList.find(a => String(a.id) === selectedAsosiasi)?.singkatan,
    isSubsidi ? "Subsidi" : "",
  ].filter(Boolean).join(" · ");

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
        onToggleFavorites={() => setShowFavoritesOnly(v => !v)}
        activeSearchLabel={activeSearchLabel}
      />

      {/* Spacer for fixed header */}
      <div className="h-14" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Shared favorites banner */}
        {sharedFavoritesMode && (
          <div className="bg-primary/8 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <Heart weight="fill" className="text-red-500 w-5 h-5" />
                Daftar Rekomendasi Favorit
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Seseorang telah membagikan daftar perumahan pilihan ini kepada Anda.
              </p>
            </div>
            <Button
              onClick={() => {
                addMultipleFavorites(sharedData);
                alert("Berhasil! Semua perumahan telah ditambahkan ke Favorit Anda.");
              }}
              className="shrink-0"
            >
              Tambahkan ke Favorit Saya
            </Button>
          </div>
        )}

        {/* Quick Filters + Actions bar */}
        {!sharedFavoritesMode && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Pintasan:</span>
              {QUICK_FILTERS.map(qf => (
                <button
                  key={qf.name}
                  onClick={() => handleQuickFilter(qf)}
                  className="px-3 py-1 rounded-full bg-primary/8 hover:bg-primary/15 text-primary text-xs font-bold transition-colors border border-primary/15"
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
                <Badge variant="secondary" className="text-emerald-600 dark:text-emerald-400 text-xs">Subsidi</Badge>
              )}
              
              {!loading && finalData.length > 0 && !showFavoritesOnly && !sharedFavoritesMode && (
                <div className="ml-2 w-48">
                  <Select value={localSort} onValueChange={(v: "default" | "closest-jakarta" | null) => { if (v) setLocalSort(v); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" weight="bold" />
                        <SelectValue placeholder="Urutkan" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Terbaru (Default)</SelectItem>
                      <SelectItem value="closest-jakarta">Terdekat dari Jakarta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && data.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border bg-card">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="pt-2 border-t mt-3">
                      <Skeleton className="h-5 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : finalData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {finalData.map(item => (
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
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                {showFavoritesOnly
                  ? <Heart className="w-7 h-7 text-muted-foreground" />
                  : <MagnifyingGlass className="w-7 h-7 text-muted-foreground" />
                }
              </div>
              <h3 className="text-base font-semibold mb-1.5">
                {showFavoritesOnly ? "Belum ada properti favorit" : "Tidak ada perumahan ditemukan"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {showFavoritesOnly
                  ? "Tekan ikon ♥ pada kartu properti untuk menyimpannya."
                  : "Coba gunakan kriteria wilayah yang berbeda atau matikan filter subsidi."}
              </p>
            </div>
          )}
        </section>

        {/* Infinite scroll sentinel */}
        {!showFavoritesOnly && !sharedFavoritesMode && data.length < totalData && (
          <div ref={loaderRef} className="py-10 flex justify-center">
            {loading && (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground font-medium">Memuat lebih banyak...</span>
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
  );
}
