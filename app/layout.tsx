import { Geist_Mono, Outfit } from "next/font/google"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Si-Coro | Cari Perumahan Subsidi & Komersil",
  description: "Temukan perumahan impian Anda di seluruh Indonesia. Pencarian perumahan subsidi dan komersil berbasis data resmi Sikumbang TAPERA.",
  keywords: "perumahan subsidi, perumahan komersil, sikumbang, tapera, rumah murah, KPR",
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
      className={cn("antialiased", fontMono.variable, "font-sans", outfit.variable)}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider delay={400}>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
