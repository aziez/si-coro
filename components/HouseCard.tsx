import React from 'react';
import Image from 'next/image';
import { MapPin, Heart, Users, Buildings, Train, Scales } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { getDistanceToJakarta, getNearestStation } from '@/lib/geoUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TipeRumah {
  id: number;
  status: string;
  nama: string;
  harga: number;
  kamarTidur: number;
  kamarMandi: number;
  luasTanah: number;
  luasBangunan: number;
  spesifikasiAtap?: string;
  spesifikasiDinding?: string;
  spesifikasiLantai?: string;
  spesifikasiPondasi?: string;
}

export interface KantorPemasaran {
  alamat: string;
  nomor?: string;
  noTelp?: string;
  email?: string;
}

export interface Perumahan {
  idLokasi: string;
  namaPerumahan: string;
  jenisPerumahan: string;
  jumlahUnit: number;
  jumlahUnitKomersil: number;
  foto: string[];
  koordinatPerumahan?: string;
  tipeRumah: TipeRumah[];
  kantorPemasaran?: KantorPemasaran[];
  wilayah: {
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    kelurahan: string;
  };
  pengembang: {
    nama: string;
    asosiasi?: string;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const resolveImageUrl = (url: string) =>
  url.startsWith('http') ? url : `https://sikumbang.tapera.go.id${url.startsWith('/') ? '' : '/'}${url}`;

// ─── Component ──────────────────────────────────────────────────────────────

export function HouseCard({
  data,
  onClick,
  isFavorite = false,
  onToggleFavorite,
  isCompared = false,
  onToggleCompare,
}: {
  data: Perumahan;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  isCompared?: boolean;
  onToggleCompare?: (e: React.MouseEvent) => void;
}) {
  const imageUrl = data.foto?.[0] ? resolveImageUrl(data.foto[0]) : '';

  const hargaMulai = data.tipeRumah?.length > 0
    ? Math.min(...data.tipeRumah.map(t => t.harga))
    : 0;

  const hasSubsidi = data.tipeRumah?.some(t => t.status === 'subsidi');
  const hasKomersil = data.tipeRumah?.some(t => t.status === 'komersil');

  // Geo data
  let distanceToJakarta: number | null = null;
  let nearestStation: { station: { name: string }; distance: number } | null = null;

  if (data.koordinatPerumahan) {
    const [latStr, lonStr] = data.koordinatPerumahan.split(',');
    const lat = parseFloat(latStr?.trim());
    const lon = parseFloat(lonStr?.trim());
    if (!isNaN(lat) && !isNaN(lon)) {
      distanceToJakarta = getDistanceToJakarta(lat, lon);
      nearestStation = getNearestStation(lat, lon);
    }
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group flex flex-col overflow-hidden border shadow-sm transition-all duration-300',
        'hover:shadow-md hover:-translate-y-1',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Action buttons */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <Tooltip>
          <TooltipTrigger
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onToggleFavorite?.(e); }}
            className="p-1.5 rounded-full bg-background/85 backdrop-blur shadow-sm hover:scale-110 transition-transform"
          >
            <Heart
              weight={isFavorite ? 'fill' : 'regular'}
              className={cn('w-4 h-4 transition-colors', isFavorite ? 'text-red-500' : 'text-muted-foreground')}
            />
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {isFavorite ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onToggleCompare?.(e); }}
            className="p-1.5 rounded-full bg-background/85 backdrop-blur shadow-sm hover:scale-110 transition-transform"
          >
            <Scales
              weight={isCompared ? 'fill' : 'regular'}
              className={cn('w-4 h-4 transition-colors', isCompared ? 'text-primary' : 'text-muted-foreground')}
            />
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {isCompared ? 'Hapus dari Bandingkan' : 'Tambah ke Bandingkan'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={data.namaPerumahan}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : null}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted"
          style={{ display: imageUrl ? 'none' : 'flex' }}>
          <Buildings weight="duotone" className="w-10 h-10 mb-1" />
          <span className="text-xs font-medium">Foto tidak tersedia</span>
        </div>

        {/* Status badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {hasSubsidi && <Badge className="bg-emerald-500/90 text-white text-[10px] px-2 py-0.5 shadow-sm">Subsidi</Badge>}
          {hasKomersil && <Badge className="bg-blue-500/90 text-white text-[10px] px-2 py-0.5 shadow-sm">Komersil</Badge>}
        </div>
      </div>

      <CardContent className="flex flex-col flex-1 p-4 gap-2">
        {/* Name & developer */}
        <div>
          <h3 className="line-clamp-1 font-bold tracking-tight text-card-foreground">
            {data.namaPerumahan}
          </h3>
          <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Users className="h-3 w-3 shrink-0" />
            {data.pengembang?.nama || 'Pengembang tidak diketahui'}
          </p>
        </div>

        {/* Location */}
        <div className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-2 leading-relaxed">
            {[data.wilayah?.kelurahan, data.wilayah?.kecamatan, data.wilayah?.kabupaten].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Geo insights */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {distanceToJakarta !== null && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
              <Buildings className="h-2.5 w-2.5" />{distanceToJakarta.toFixed(1)} km ke Jakarta
            </span>
          )}
          {nearestStation && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md truncate max-w-full">
              <Train className="h-2.5 w-2.5 shrink-0" />{nearestStation.distance.toFixed(1)} km · {nearestStation.station.name}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="border-t pt-3 mt-1">
          <p className="text-[10px] text-muted-foreground mb-0.5">Mulai dari</p>
          <span className="text-base font-bold text-primary">
            {hargaMulai > 0 ? formatRupiah(hargaMulai) : 'Harga tidak tersedia'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
