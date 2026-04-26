import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://image-compressor-web.netlify.app/"),
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
    url: "https://image-compressor-web.netlify.app/",
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

const socialLinks = {
  github: "https://github.com/ruanvalente",
  linkedin: "https://www.linkedin.com/in/ruan-valente",
  portfolio: "https://ruanvalente-portfolio.vercel.app",
};

function SocialIcon({ type }: { type: keyof typeof socialLinks }) {
  if (type === "github") {
    return (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (type === "linkedin") {
    return (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
    >
      Pular para o conteúdo principal
    </a>
  );
}

function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white py-4">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-xl font-bold text-zinc-900">🖼️ Image Compressor</h1>
        <p className="text-sm text-zinc-500">
          Comprimir imagens mantendo a melhor qualidade
        </p>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer
      className="mt-auto border-t border-zinc-200 bg-white py-6"
      role="contentinfo"
    >
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-zinc-500">
            Desenvolvido por{" "}
            <Link
              href={socialLinks.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Ruan Valente
            </Link>
          </p>

          <nav aria-label="Redes sociais">
            <ul className="flex items-center gap-4">
              <li>
                <Link
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub de Ruan Valente"
                  className="text-zinc-500 transition-colors hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <SocialIcon type="github" />
                </Link>
              </li>
              <li>
                <Link
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn de Ruan Valente"
                  className="text-zinc-500 transition-colors hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <SocialIcon type="linkedin" />
                </Link>
              </li>
              <li>
                <Link
                  href={socialLinks.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Portfólio de Ruan Valente"
                  className="text-zinc-500 transition-colors hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <SocialIcon type="portfolio" />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
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
