import { NextRequest } from "next/server"

const CHELL_TOUR_BASE =
  process.env.CHELL_TOUR_URL ||
  process.env.NEXT_PUBLIC_CHELL_TOUR_URL ||
  "https://tour.chell-ai.my.id"

/**
 * Showcase project used when this SiKumbang location has no Chell-Tour
 * project yet (or Chell-Tour is unreachable). Arunika Grove is a published
 * demo on Chell-Tour with both a live siteplan and a 360° tour, so every tab
 * in the detail page has real content. Slugs must exist on CHELL_TOUR_BASE.
 */
function demoProject() {
  return {
    id: "demo-arunika",
    slug: "arunika-grove-residence",
    name: "Arunika Grove Residence (Contoh Demo)",
    description:
      "Contoh proyek Chell-Tour: siteplan kavling live dan tur virtual 360°.",
    hubUrl: "/p/arunika-grove-residence",
    primarySiteplan: {
      id: "demo-siteplan",
      slug: "arunika-grove-residence-siteplan",
      name: "Siteplan Kavling Arunika",
      embedUrl: "/siteplan/arunika-grove-residence-siteplan?embed=1",
      fullUrl: "/siteplan/arunika-grove-residence-siteplan",
    },
    primaryTour: {
      id: "demo-tour",
      slug: "arunika-grove-residence-5836",
      name: "Tur Virtual 360° Rumah Contoh",
      url: "/tour/arunika-grove-residence-5836",
    },
    unitTypes: [],
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ idLokasi: string }> }
) {
  const { idLokasi } = await params

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)

  try {
    const res = await fetch(
      `${CHELL_TOUR_BASE}/api/public/by-sikumbang/${idLokasi}`,
      {
        signal: controller.signal,
        next: { revalidate: 60 },
      }
    )

    if (res.ok) {
      const data = await res.json()
      // A real project linked to this SiKumbang ID: show it as-is.
      if (data?.success && data.project && !data.isDemoFallback) {
        return Response.json({ ...data, chellTourBaseUrl: CHELL_TOUR_BASE })
      }
    }
  } catch {
    // Chell-Tour unreachable: fall through to the showcase demo.
  } finally {
    clearTimeout(timeout)
  }

  return Response.json({
    success: true,
    isDemoFallback: true,
    chellTourBaseUrl: CHELL_TOUR_BASE,
    requestedSikumbangId: idLokasi,
    project: demoProject(),
  })
}
