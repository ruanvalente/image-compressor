import Link from "next/link";

const socialLinks = {
  github: "https://github.com/ruanvalente",
  linkedin: "https://www.linkedin.com/in/ruan-valente",
  portfolio: "https://ruanvalente-portfolio.vercel.app",
} as const;

type SocialKey = keyof typeof socialLinks;

const socialLabels: Record<SocialKey, string> = {
  github: "GitHub de Ruan Valente",
  linkedin: "LinkedIn de Ruan Valente",
  portfolio: "Portfólio de Ruan Valente",
};

function SocialIcon({ type }: { type: SocialKey }) {
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

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-app flex flex-col items-center gap-4 py-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p className="text-sm text-text-muted">
          Desenvolvido por{" "}
          <Link
            href={socialLinks.portfolio}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Ruan Valente
          </Link>
        </p>

        <nav aria-label="Redes sociais">
          <ul className="flex items-center gap-4">
            {(Object.keys(socialLinks) as SocialKey[]).map((type) => (
              <li key={type}>
                <Link
                  href={socialLinks[type]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={socialLabels[type]}
                  className="p-2 text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  <SocialIcon type={type} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
