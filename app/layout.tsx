import "./globals.css"

import { Sono as FontSans } from "next/font/google"

import { NavBar } from "@/components/NavBar"
import { ThemeProvider } from "@/components/ThemeProvider"

const defaultUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "my favorites",
  description: "a place to keep track of your favorite things",
}

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  fallback: ["sans-serif"],
})

export const dynamic = "force-dynamic"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
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
        </ThemeProvider>
      </body>
    </html>
  )
}
