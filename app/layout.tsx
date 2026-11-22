import { Geist_Mono, Outfit } from "next/font/google"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Si-Coro | Cek Isi Rumah Subsidi & Komersil Sebelum Akad",
  description:
    "Cek isi rumah subsidi & komersil sebelum akad: skor risiko banjir InaRISK BNPB, rute KRL OSRM, kalkulator biaya riil KPR BTN + komuter, dan virtual tour 360° ChellTour.",
  keywords:
    "perumahan subsidi, perumahan komersil, sikumbang, tapera, rumah murah, KPR BTN, risiko banjir perumahan, KRL commuter line",
  icons: {
    icon: "/logo-si-coro-simbol.png",
    apple: "/logo-si-coro-simbol.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        outfit.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider delay={300}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
