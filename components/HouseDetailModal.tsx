import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Perumahan } from './HouseCard';
import { X, MapPin, Users, Phone, EnvelopeSimple, Buildings, CaretLeft, CaretRight, CheckCircle, Bed, Bathtub, ArrowsOut, Heart } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface HouseDetailModalProps {
  data: Perumahan;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function HouseDetailModal({ data, onClose, isFavorite = false, onToggleFavorite }: HouseDetailModalProps) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'tipe'>('info');

  useEffect(() => {
    // Lock body scroll when modal mounts
    document.body.style.overflow = 'hidden';
    return () => {
      // Restore body scroll when modal unmounts
      document.body.style.overflow = '';
    };
  }, []);

  const hasImages = data.foto && data.foto.length > 0;

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  const nextImage = () => {
    if (hasImages) {
      setCurrentImageIdx((prev) => (prev === data.foto.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = () => {
    if (hasImages) {
      setCurrentImageIdx((prev) => (prev === 0 ? data.foto.length - 1 : prev - 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border">
        {/* Header (Mobile-friendly close button) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-background/50 hover:bg-background/80 backdrop-blur-md p-2 rounded-full text-foreground transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left Side: Images */}
          <div className="w-full md:w-1/2 lg:w-3/5 relative bg-muted flex-shrink-0 group">
            {hasImages ? (
              <>
                {/* Image container */}
                <div className="w-full h-64 md:h-full relative flex items-center justify-center bg-muted">
                  <Image 
                    src={data.foto[currentImageIdx].startsWith('http') ? data.foto[currentImageIdx] : `https://sikumbang.tapera.go.id${data.foto[currentImageIdx].startsWith('/') ? '' : '/'}${data.foto[currentImageIdx]}`}
                    alt={`${data.namaPerumahan} - Foto ${currentImageIdx + 1}`}
                    fill
                    className="object-cover absolute inset-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      if (e.target && (e.target as any).nextElementSibling) {
                        (e.target as any).nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                  {/* Fallback Icon */}
                  <div className="absolute inset-0 flex-col items-center justify-center text-muted-foreground/50 bg-muted" style={{ display: 'none' }}>
                    <Buildings weight="duotone" className="w-16 h-16 mb-2" />
                    <span className="text-sm font-medium">Foto tidak tersedia</span>
                  </div>
                </div>
                {data.foto.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={prevImage} className="bg-background/80 hover:bg-background text-foreground p-2 rounded-full shadow-lg backdrop-blur-sm transition-all">
                      <CaretLeft className="w-6 h-6" />
                    </button>
                    <button onClick={nextImage} className="bg-background/80 hover:bg-background text-foreground p-2 rounded-full shadow-lg backdrop-blur-sm transition-all">
                      <CaretRight className="w-6 h-6" />
                    </button>
                  </div>
                )}
                {/* Image Dots */}
                {data.foto.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {data.foto.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIdx(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIdx ? 'bg-white w-4' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-64 md:h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground">Tidak ada foto tersedia</span>
              </div>
            )}
          </div>

          {/* Right Side: Content */}
          <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col min-h-0">
            <div className="p-6 md:p-8 flex-1 overflow-y-auto min-h-0">
              <div className="mb-6">
                <div className="flex gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                    {data.jenisPerumahan}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-foreground pr-10">
                  {data.namaPerumahan}
                </h2>
                <div className="flex items-start gap-2 text-muted-foreground text-sm">
                  <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {data.wilayah?.kelurahan}, {data.wilayah?.kecamatan}, {data.wilayah?.kabupaten}, {data.wilayah?.provinsi}
                  </p>
                </div>
              </div>

              {/* Custom Tabs */}
              <div className="flex border-b mb-6">
                <button
                  className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'info' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveTab('info')}
                >
                  Informasi
                  {activeTab === 'info' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                </button>
                <button
                  className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'tipe' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveTab('tipe')}
                >
                  Tipe Rumah ({data.tipeRumah?.length || 0})
                  {activeTab === 'tipe' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                </button>
              </div>

              {activeTab === 'info' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-muted/50 rounded-2xl p-5 border">
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <Buildings className="w-5 h-5 text-primary" />
                      Detail Pengembang
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Nama Pengembang</span>
                        <span className="font-medium text-right">{data.pengembang?.nama || '-'}</span>
                      </p>
                      <p className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Asosiasi</span>
                        <span className="font-medium text-right">{data.pengembang?.asosiasi || '-'}</span>
                      </p>
                    </div>
                  </div>

                  {data.kantorPemasaran && data.kantorPemasaran.length > 0 && (
                    <div className="bg-muted/50 rounded-2xl p-5 border">
                      <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-primary" />
                        Kantor Pemasaran
                      </h3>
                      {data.kantorPemasaran.map((kantor: any, idx: number) => (
                        <div key={idx} className="space-y-3 text-sm mb-4 last:mb-0">
                          <p className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                            <span>{kantor.alamat} {kantor.nomor ? `No. ${kantor.nomor}` : ''}</span>
                          </p>
                          {kantor.noTelp && (
                            <p className="flex items-center gap-3">
                              <Phone className="w-4 h-4 shrink-0 text-muted-foreground" />
                              <span>{kantor.noTelp}</span>
                            </p>
                          )}
                          {kantor.email && (
                            <p className="flex items-center gap-3">
                              <EnvelopeSimple className="w-4 h-4 shrink-0 text-muted-foreground" />
                              <span>{kantor.email}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-bold text-primary mb-1">{data.jumlahUnit}</span>
                      <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Unit Tersedia</span>
                    </div>
                    <div className="bg-card border rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-bold text-blue-500 mb-1">{data.jumlahUnitKomersil}</span>
                      <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Unit Komersil</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tipe' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  {data.tipeRumah?.length > 0 ? (
                    data.tipeRumah.map((tipe, idx) => (
                      <div key={idx} className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-lg">{tipe.nama}</h4>
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${tipe.status === 'subsidi' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                              {tipe.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-primary font-bold text-lg block">{formatRupiah(tipe.harga)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5"><ArrowsOut className="w-4 h-4" /> Luas: {tipe.luasBangunan}/{tipe.luasTanah} m²</div>
                          <div className="flex items-center gap-1.5"><Bed className="w-4 h-4" /> {tipe.kamarTidur} Kamar</div>
                          <div className="flex items-center gap-1.5"><Bathtub className="w-4 h-4" /> {tipe.kamarMandi} KM</div>
                        </div>

                        <div className="space-y-2 text-xs text-muted-foreground border-t pt-3 mt-3">
                          {tipe.spesifikasiAtap && <p><span className="font-medium text-foreground">Atap:</span> {tipe.spesifikasiAtap}</p>}
                          {tipe.spesifikasiDinding && <p><span className="font-medium text-foreground">Dinding:</span> {tipe.spesifikasiDinding}</p>}
                          {tipe.spesifikasiLantai && <p><span className="font-medium text-foreground">Lantai:</span> {tipe.spesifikasiLantai}</p>}
                          {tipe.spesifikasiPondasi && <p><span className="font-medium text-foreground">Pondasi:</span> {tipe.spesifikasiPondasi}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      Tidak ada detail tipe rumah.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-muted/20 flex gap-3 shrink-0">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl py-6 text-base font-bold">
                Tutup
              </Button>
              <Link href={`/perumahan/${data.idLokasi}`} className="flex-1" onClick={onClose}>
                <Button className="w-full rounded-xl py-6 text-base font-bold bg-primary hover:bg-primary/90">
                  Lihat Detail Selengkapnya
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
