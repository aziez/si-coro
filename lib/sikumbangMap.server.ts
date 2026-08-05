import type { Perumahan } from "@/components/HouseCard"
import {
  normalizePropertyCoordinate,
  parsePropertyCoordinate,
  type MapSearchMeta,
} from "@/lib/mapSearch"

const SIKUMBANG_API = "https://sikumbang.tapera.go.id"
const PAGE_SIZE = 100
const MAX_PAGES = 50
const PAGE_CONCURRENCY = 4

export interface Wilayah {
  kodeWilayah: string
  namaWilayah: string
}

interface SikumbangSearchPayload {
  count?: { totalLokasi?: number }
  data?: unknown[]
}

interface FetchJsonOptions {
  timeoutMs?: number
  revalidate?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {}
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 15_000
  )

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: options.revalidate ?? 300 },
    })
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`)
    return (await response.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}

export function normalizeWilayah(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(
      /\b(PROVINSI|KABUPATEN|KAB|KOTA|ADMINISTRASI|ADM|DAERAH|KHUSUS|IBUKOTA|DKI)\b/g,
      " "
    )
    .replace(/\s+/g, "")
}

function getAdministrativeKind(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]+/g, " ")
  if (/\bKAB(?:UPATEN)?\b/.test(normalized)) return "kabupaten"
  if (/\bKOTA\b/.test(normalized) || /\bADM(?:INISTRASI)?\b/.test(normalized)) {
    return "kota"
  }
  return null
}

function isSameAdministrativeArea(first: string, second: string) {
  if (normalizeWilayah(first) !== normalizeWilayah(second)) return false
  const firstKind = getAdministrativeKind(first)
  const secondKind = getAdministrativeKind(second)
  return !firstKind || !secondKind || firstKind === secondKind
}

export function findWilayah(wilayah: Wilayah[], name: string) {
  return wilayah.find((item) =>
    isSameAdministrativeArea(item.namaWilayah, name)
  )
}

export async function getSikumbangProvinces() {
  return fetchJson<Wilayah[]>(`${SIKUMBANG_API}/ajax/wilayah/get-provinsi`, {
    timeoutMs: 12_000,
    revalidate: 86_400,
  })
}

export async function getSikumbangCities(provinceCode: string) {
  return fetchJson<Wilayah[]>(
    `${SIKUMBANG_API}/ajax/wilayah/get-kabupaten/${encodeURIComponent(provinceCode)}`,
    { timeoutMs: 12_000, revalidate: 86_400 }
  )
}

function normalizeProperty(value: unknown): Perumahan | null {
  if (!isRecord(value)) return null

  const idLokasi = String(value.idLokasi ?? "").trim()
  const namaPerumahan = String(value.namaPerumahan ?? "").trim()
  if (!idLokasi || !namaPerumahan) return null

  const property = value as unknown as Perumahan
  return {
    ...property,
    idLokasi,
    namaPerumahan,
    koordinatPerumahan: normalizePropertyCoordinate(
      property.koordinatPerumahan
    ),
  }
}

function deduplicateProperties(values: unknown[], expectedCity: string) {
  const unique = new Map<string, Perumahan>()

  for (const value of values) {
    const property = normalizeProperty(value)
    if (!property) continue

    const propertyCity = property.wilayah?.kabupaten ?? ""
    if (propertyCity && !isSameAdministrativeArea(propertyCity, expectedCity)) {
      continue
    }

    unique.set(property.idLokasi, property)
  }

  return [...unique.values()]
}

function createSearchUrl(
  kodeWilayah: string,
  page: number,
  keyword: string,
  asosiasi: string
) {
  const params = new URLSearchParams({
    selectedSearch: "wilayah",
    skalaPerumahan: "semua",
    sort: "terbaru",
    searchBy: "nama-perumahan",
    limit: String(PAGE_SIZE),
    page: String(page),
    kodeWilayah,
  })
  if (keyword) params.set("keyword", keyword)
  if (asosiasi) params.set("asosiasi", asosiasi)
  return `${SIKUMBANG_API}/ajax/lokasi/search?${params}`
}

async function fetchSearchPage(
  kodeWilayah: string,
  page: number,
  keyword: string,
  asosiasi: string
) {
  const url = createSearchUrl(kodeWilayah, page, keyword, asosiasi)
  try {
    return await fetchJson<SikumbangSearchPayload>(url, {
      timeoutMs: 35_000,
      revalidate: 300,
    })
  } catch {
    return fetchJson<SikumbangSearchPayload>(url, {
      timeoutMs: 45_000,
      revalidate: 300,
    })
  }
}

export async function getAllSikumbangProperties({
  kodeWilayah,
  namaKabupaten,
  keyword,
  asosiasi,
}: {
  kodeWilayah: string
  namaKabupaten: string
  keyword: string
  asosiasi: string
}) {
  const firstPage = await fetchSearchPage(kodeWilayah, 1, keyword, asosiasi)
  const total = Math.max(0, Number(firstPage.count?.totalLokasi ?? 0))
  const requestedPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pagesToFetch = Math.min(requestedPages, MAX_PAGES)
  const remainingPages = Array.from(
    { length: Math.max(0, pagesToFetch - 1) },
    (_, index) => index + 2
  )

  const remainingPayloads: SikumbangSearchPayload[] = []
  for (
    let index = 0;
    index < remainingPages.length;
    index += PAGE_CONCURRENCY
  ) {
    const pageBatch = remainingPages.slice(index, index + PAGE_CONCURRENCY)
    remainingPayloads.push(
      ...(await Promise.all(
        pageBatch.map((page) =>
          fetchSearchPage(kodeWilayah, page, keyword, asosiasi)
        )
      ))
    )
  }
  const pagePayloads = [firstPage, ...remainingPayloads]
  const rawProperties = pagePayloads.flatMap((payload) => payload.data ?? [])
  const properties = deduplicateProperties(rawProperties, namaKabupaten)
  const withCoordinates = properties.filter((property) =>
    parsePropertyCoordinate(property.koordinatPerumahan)
  ).length

  const meta: MapSearchMeta = {
    total,
    fetched: rawProperties.length,
    unique: properties.length,
    withCoordinates,
    withoutCoordinates: properties.length - withCoordinates,
    pagesFetched: pagesToFetch,
    complete:
      pagePayloads.some((payload) => (payload.data?.length ?? 0) < PAGE_SIZE) ||
      (pagesToFetch === requestedPages && rawProperties.length >= total),
  }

  return { properties, meta }
}
