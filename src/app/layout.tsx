import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Header, Footer } from "@/components/layout";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Image Compressor | Comprimir Imagens Online",
  description:
    "Ferramenta para comprimir imagens mantendo a melhor qualidade. Suporta JPEG, PNG, WebP e AVIF. Rápido, seguro e gratuito.",
  keywords: [
    "comprimir imagens",
    "otimizar imagens",
    "reduzir tamanho de imagem",
    "compressão de imagem",
    "JPEG",
    "PNG",
    "WebP",
    "AVIF",
  ],
  authors: [
    { name: "Ruan Valente", url: "https://ruanvalente-portfolio.vercel.app" },
  ],
  creator: "Ruan Valente",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Image Compressor",
    title: "Image Compressor | Comprimir Imagens Online",
    description:
      "Ferramenta para comprimir imagens mantendo a melhor qualidade.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Compressor | Comprimir Imagens Online",
    description:
      "Ferramenta para comprimir imagens mantendo a melhor qualidade.",
    creator: "@ruanvalente",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
    >
      Pular para o conteúdo principal
    </a>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SkipLink />
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-geist-sans)",
            },
          }}
        />
        <Header />
        <main id="main-content" className="flex-1" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
