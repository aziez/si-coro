"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { HouseCard, Perumahan } from "@/components/HouseCard";
import { HouseDetailModal } from "@/components/HouseDetailModal";
import { MagnifyingGlass, Funnel, Moon, Sun, CaretLeft, CaretRight, MapPin, Heart } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";

interface Wilayah {
  kodeWilayah: string;
  namaWilayah: string;
}

const QUICK_FILTERS = [
  { name: 'Bogor', code: '3201', type: 'kabupaten', prov: '32' },
  { name: 'Depok', code: '3276', type: 'kabupaten', prov: '32' },
  { name: 'Tangerang', code: '3603', type: 'kabupaten', prov: '36' },
  { name: 'Bekasi', code: '3216', type: 'kabupaten', prov: '32' },
];

export default function Page() {
  const { theme, setTheme } = useTheme();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const [data, setData] = useState<Perumahan[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubsidi, setIsSubsidi] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<Perumahan | null>(null);

  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [kabupatens, setKabupatens] = useState<Wilayah[]>([]);
  const [selectedProvinsi, setSelectedProvinsi] = useState("");
  const [selectedKabupaten, setSelectedKabupaten] = useState("");
  const [activeKodeWilayah, setActiveKodeWilayah] = useState("");

  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const limit = 50;

  const loaderRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);
  const [isRestored, setIsRestored] = useState(false);
  const lastFetchedPage = useRef(0);

  // Restore State on Mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('si_coro_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setData(parsed.data || []);
        setPage(parsed.page || 1);
        setTotalData(parsed.totalData || 0);
        setKeyword(parsed.keyword || "");
        setSearchQuery(parsed.searchQuery || "");
        setSelectedProvinsi(parsed.selectedProvinsi || "");
        setSelectedKabupaten(parsed.selectedKabupaten || "");
        setActiveKodeWilayah(parsed.activeKodeWilayah || "");
        lastFetchedPage.current = parsed.page || 0;
        
        if (parsed.scrollY) {
          setTimeout(() => window.scrollTo(0, parsed.scrollY), 100);
        }
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
    setIsRestored(true);
  }, []);

  // Track Scroll & Save State
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const onScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        scrollYRef.current = window.scrollY;
      }, 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!isRestored) return;
    const saveState = () => {
      sessionStorage.setItem('si_coro_state', JSON.stringify({
        data, page, totalData, keyword, searchQuery, selectedProvinsi, selectedKabupaten, activeKodeWilayah,
        scrollY: scrollYRef.current
      }));
    };
    saveState();
    return () => saveState();
  }, [data, page, totalData, keyword, searchQuery, selectedProvinsi, selectedKabupaten, activeKodeWilayah, isRestored]);

  // Fetch Provinces on mount
  useEffect(() => {
    fetch("https://sikumbang.tapera.go.id/ajax/wilayah/get-provinsi")
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Failed to fetch provinces", err));
  }, []);

  // Fetch Kabupatens when Provinsi changes
  useEffect(() => {
    if (selectedProvinsi) {
      fetch(`https://sikumbang.tapera.go.id/ajax/wilayah/get-kabupaten/${selectedProvinsi}`)
        .then(res => res.json())
        .then(data => setKabupatens(data))
        .catch(err => console.error("Failed to fetch kabupatens", err));
    } else {
      setKabupatens([]);
    }
    setSelectedKabupaten("");
  }, [selectedProvinsi]);

  // Fetch Data
  useEffect(() => {
    if (!isRestored) return; // Wait for initial restore
    if (page <= lastFetchedPage.current) return; // Skip if already fetched/restored

    const fetchData = async () => {
      setLoading(true);
      try {
        let url = `https://sikumbang.tapera.go.id/ajax/lokasi/search?selectedSearch=wilayah&skalaPerumahan=semua&sort=terbaru&searchBy=nama-perumahan&limit=${limit}&page=${page}`;

        if (activeKodeWilayah) {
          url += `&kodeWilayah=${activeKodeWilayah}`;
        }
        if (searchQuery) {
          url += `&keyword=${encodeURIComponent(searchQuery)}`;
        }

        const res = await fetch(url);
        const json = await res.json();

        if (page === 1) {
          setData(json.data || []);
        } else {
          setData(prev => [...prev, ...(json.data || [])]);
        }
        setTotalData(json.count?.totalLokasi || 0);
        lastFetchedPage.current = page;
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, activeKodeWilayah, page]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!isRestored || loading || showFavoritesOnly || data.length >= totalData || totalData === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [loading, showFavoritesOnly, data.length, totalData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(keyword);
    setActiveKodeWilayah(selectedKabupaten || selectedProvinsi);
    setData([]); // clear old data to trigger skeleton
    lastFetchedPage.current = 0; // reset fetch tracker
    setPage(1); // reset to first page on new search
  };

  const dataSource = showFavoritesOnly ? favorites : data;
  const filteredData = dataSource.filter((item) => {
    if (isSubsidi) {
      return item.tipeRumah?.some((t) => t.status === "subsidi") && item.jumlahUnit > 0;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-lg shadow-primary/20">
              <MagnifyingGlass weight="bold" className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Sikumbang Search
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun weight="fill" className="w-5 h-5" /> : <Moon weight="fill" className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search & Filter Section */}
        <section className="mb-10 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Temukan Rumah Impian Anda
            </h2>
            <p className="text-muted-foreground text-lg">
              Cari perumahan berdasarkan wilayah di seluruh Indonesia
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col gap-4 bg-card p-6 rounded-3xl border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Provinsi</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <select
                    className="w-full pl-10 pr-4 py-3 bg-background border-2 border-muted rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none font-medium"
                    value={selectedProvinsi}
                    onChange={(e) => setSelectedProvinsi(e.target.value)}
                  >
                    <option value="">Semua Provinsi</option>
                    {provinces.map(prov => (
                      <option key={prov.kodeWilayah} value={prov.kodeWilayah}>{prov.namaWilayah}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Kabupaten / Kota</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <select
                    className="w-full pl-10 pr-4 py-3 bg-background border-2 border-muted rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none font-medium disabled:opacity-50"
                    value={selectedKabupaten}
                    onChange={(e) => setSelectedKabupaten(e.target.value)}
                    disabled={!selectedProvinsi || kabupatens.length === 0}
                  >
                    <option value="">Semua Kabupaten / Kota</option>
                    {kabupatens.map(kab => (
                      <option key={kab.kodeWilayah} value={kab.kodeWilayah}>{kab.namaWilayah}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <MagnifyingGlass className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Nama perumahan (opsional)"
                  className="w-full pl-11 pr-4 py-3 bg-background border-2 border-muted rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="py-3 px-8 h-auto rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                Cari Rumah
              </Button>
            </div>
          </form>

          <div className="flex justify-center sm:justify-start">
            <div className="flex items-center gap-3 bg-card/50 px-4 py-3 rounded-2xl border border-muted inline-flex hover:bg-card/80 transition-colors">
              <Funnel className="h-5 w-5 text-muted-foreground" />
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isSubsidi}
                    onChange={(e) => setIsSubsidi(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-4 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <span className="font-medium text-sm">Hanya Rumah Subsidi Tersedia</span>
              </label>
            </div>
          </div>

          {/* Quick Filters & Actions */}
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-6 border-border">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground mr-2">Pintasan Area:</span>
              {QUICK_FILTERS.map((qf) => (
                <button
                  key={qf.name}
                  onClick={() => {
                    const selProv = provinces.find(p => p.kodeWilayah === qf.prov);
                    if (selProv) {
                      setSelectedProvinsi(selProv.kodeWilayah);
                      fetch(`https://sikumbang.tapera.go.id/ajax/wilayah/get-kabupaten/${qf.prov}`)
                        .then(res => res.json())
                        .then(d => {
                          setKabupatens(d);
                          const selKab = d.find((k: Wilayah) => k.kodeWilayah === qf.code);
                          if (selKab) setSelectedKabupaten(selKab.kodeWilayah);
                          setActiveKodeWilayah(qf.code);
                          setData([]);
                          setPage(1);
                        });
                    }
                  }}
                  className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                >
                  {qf.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${showFavoritesOnly ? 'bg-red-500 text-white' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
            >
              <Heart weight={showFavoritesOnly ? "fill" : "regular"} className={showFavoritesOnly ? "text-white" : "text-red-500"} />
              {showFavoritesOnly ? "Kembali ke Pencarian" : `Lihat Favorit (${favorites.length})`}
            </button>
          </div>
        </section>

        {/* Results Section */}
        <section>
          <div className="mb-6 flex justify-between items-end">
            <h3 className="text-xl font-bold">
              {activeKodeWilayah || searchQuery ? "Hasil Pencarian" : "Rekomendasi Perumahan Terbaru"}
            </h3>
            {!loading && (
              <p className="text-sm text-muted-foreground">
                Menampilkan {filteredData.length} dari {totalData} properti
              </p>
            )}
          </div>

          {loading && data.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[4/3] w-full"></div>
              ))}
            </div>
          ) : filteredData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredData.map((item) => (
                <HouseCard 
                  key={item.idLokasi} 
                  data={item} 
                  onClick={() => setSelectedHouse(item)}
                  isFavorite={isFavorite(item.idLokasi)}
                  onToggleFavorite={() => toggleFavorite(item)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlass className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tidak ada perumahan ditemukan</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Coba gunakan kriteria wilayah yang berbeda atau matikan filter subsidi.
              </p>
            </div>
          )}
        </section>

        {/* Infinite Scroll Loader */}
        {!showFavoritesOnly && data.length < totalData && (
          <div ref={loaderRef} className="py-12 flex justify-center items-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                <span className="text-muted-foreground font-medium">Memuat lebih banyak...</span>
              </div>
            ) : (
              <div className="h-10 w-10" />
            )}
          </div>
        )}
      </main>

      {/* Detail Modal */}
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
