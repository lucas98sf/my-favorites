import "./globals.css"

import { SpeedInsights } from "@vercel/speed-insights/next"
import { Sono } from "next/font/google"

import { NavBar } from "@/components/NavBar"
import { ThemeProvider } from "@/components/ThemeProvider"
import { cn } from "@/lib/utils"

const defaultUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "my favorites",
  description: "a place to keep track of your favorite things",
}

const sono = Sono({
  subsets: ["latin"],
  fallback: ["sans-serif"],
})

export const revalidate = 3600

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(sono.className, "overflow-x-hidden xl:overflow-hidden")} suppressHydrationWarning>
      <body className="bg-background text-foreground overflow-x-hidden xl:overflow-hidden relative">
        <ThemeProvider
          themes={["light", "dark"]}
          attribute="class"
          defaultTheme="system"
          enableColorScheme
          enableSystem
          disableTransitionOnChange
        >
          <NavBar />
          <main className="min-h-[90vh] flex flex-col items-center">{children}</main>
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
