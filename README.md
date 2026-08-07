# 🖼️ Image Compressor

Uma ferramenta para comprimir imagens mantendo a melhor qualidade. Suporta JPEG, PNG, WebP e AVIF.

[English](#english) | [Português](#portugues)

---

## <a id="english"></a>🇺🇸 English

### About

**Image Compressor** is a web application built with Next.js that allows you to compress images while maintaining the best possible quality. It supports multiple output formats (JPEG, PNG, WebP, AVIF) and offers quality control via an intuitive interface.

### Features

- 📤 Drag & drop or click to upload images
- 🎚️ Adjustable quality slider (10-100%)
- 🖼️ Multiple output formats: JPEG, PNG, WebP, AVIF
- 📄 Merge multiple images into a single PDF (A4, Letter, or original size)
- 📊 Real-time compression statistics (original size, compressed size, reduction %)
- ⬇️ One-click download
- 🔔 Toast notifications for user feedback
- ♿ Accessible and SEO-optimized

### Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/)
- **PDF Generation**: [pdf-lib](https://pdf-lib.js.org/)
- **Notifications**: [Sonner](https://sonner.vercel.app/)
- **Testing**: [Vitest](https://vitest.dev/)
- **CI**: [GitHub Actions](https://github.com/features/actions)
- **Package Manager**: [Bun](https://bun.sh/)

### Getting Started

#### Prerequisites

- [Bun](https://bun.sh/) installed (recommended)
- or Node.js 20.9+ with npm/yarn/pnpm

#### Installation

```bash
# Clone the repository
git clone https://github.com/ruanvalente/image-compressor.git

# Navigate to project directory
cd image-compressor

# Install dependencies
bun install
# or
npm install
# or
yarn install
# or
pnpm install
```

#### Running the Development Server

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Building for Production

```bash
bun build
# or
npm run build
```

#### Starting Production Server

```bash
bun start
# or
npm start
```

#### Quality Checks

```bash
bun run lint       # ESLint
bun run typecheck  # TypeScript (tsc --noEmit)
bun run test       # Vitest unit tests
```

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── compress/           # Compression API endpoint
│   │   └── pdf/                # PDF generation API endpoint
│   ├── error.tsx              # Global error boundary
│   ├── loading.tsx            # Route loading skeleton
│   ├── layout.tsx             # Root layout with metadata
│   ├── page.tsx               # Server Component (root page)
│   ├── robots.ts              # robots.txt (env-aware)
│   ├── sitemap.ts             # sitemap.xml
│   ├── opengraph-image.tsx    # Social sharing image
│   ├── twitter-image.tsx      # Twitter card image
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # Pure UI components (no logic)
│   │   ├── badge.ui.tsx
│   │   ├── button.ui.tsx
│   │   ├── card.ui.tsx
│   │   ├── og-image.ui.tsx
│   │   ├── radio-group.ui.tsx
│   │   └── range-slider.ui.tsx
│   └── widgets/               # Functional components with logic
│       ├── compress-mode.widget.tsx
│       ├── compression-result-card.widget.tsx
│       ├── compression-settings.widget.tsx
│       ├── file-dropzone.widget.tsx
│       ├── format-selector.widget.tsx
│       ├── image-preview.widget.tsx
│       ├── pdf-download-card.widget.tsx
│       ├── pdf-generator.widget.tsx
│       ├── pdf-mode.widget.tsx
│       ├── quality-control.widget.tsx
│       └── tool-switcher.widget.tsx
├── hooks/                     # Custom React hooks
│   ├── use-file-dropzone.ts
│   ├── use-image-compression.ts
│   └── use-pdf-generation.ts
└── lib/
    ├── constants.ts           # Shared limits, formats, signatures
    ├── types.ts               # Shared types (client + server)
    ├── validation.ts          # Pure validators (unit tested)
    ├── site-url.ts            # SITE_URL from environment
    ├── store/                 # Zustand state management
    │   ├── compressor-store.ts
    │   └── pdf-store.ts
    └── utils/                 # Utility functions
        ├── base64.ts
        ├── filename.ts
        ├── format-bytes.ts
        └── toast.ts
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### License

This project is open source and available under the [MIT License](LICENSE).

---

## <a id="portugues"></a>🇧🇷 Português

### Sobre

**Image Compressor** é uma aplicação web construída com Next.js que permite comprimir imagens mantendo a melhor qualidade possível. Suporta múltiplos formatos de saída (JPEG, PNG, WebP, AVIF) e oferece controle de qualidade através de uma interface intuitiva.

### Funcionalidades

- 📤 Arraste e solte ou clique para carregar imagens
- 🎚️ Ajuste de qualidade (10-100%)
- 🖼️ Múltiplos formatos de saída: JPEG, PNG, WebP, AVIF
- 📄 Junte várias imagens em um único PDF (A4, Carta ou tamanho original)
- 📊 Estatísticas em tempo real (tamanho original, tamanho comprimido, redução %)
- ⬇️ Download com um clique
- 🔔 Notificações toast para feedback do usuário
- ♿ Acessível e otimizado para SEO

### Tecnologias

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Gerenciamento de Estado**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Processamento de Imagens**: [Sharp](https://sharp.pixelplumbing.com/)
- **Geração de PDF**: [pdf-lib](https://pdf-lib.js.org/)
- **Notificações**: [Sonner](https://sonner.vercel.app/)
- **Testes**: [Vitest](https://vitest.dev/)
- **CI**: [GitHub Actions](https://github.com/features/actions)
- **Gerenciador de Pacotes**: [Bun](https://bun.sh/)

### Começando

#### Pré-requisitos

- [Bun](https://bun.sh/) instalado (recomendado)
- ou Node.js 20.9+ com npm/yarn/pnpm

#### Instalação

```bash
# Clone o repositório
git clone https://github.com/ruanvalente/image-compressor.git

# Navegue até o diretório do projeto
cd image-compressor

# Instale as dependências
bun install
# ou
npm install
# ou
yarn install
# ou
pnpm install
```

#### Executando o Servidor de Desenvolvimento

```bash
bun dev
# ou
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

#### Construindo para Produção

```bash
bun build
# ou
npm run build
```

#### Iniciando o Servidor de Produção

```bash
bun start
# ou
npm start
```

#### Verificações de Qualidade

```bash
bun run lint       # ESLint
bun run typecheck  # TypeScript (tsc --noEmit)
bun run test       # Testes unitários Vitest
```

### Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── compress/           # Endpoint da API de compressão
│   │   └── pdf/                # Endpoint da API de geração de PDF
│   ├── error.tsx              # Error boundary global
│   ├── loading.tsx            # Skeleton de loading de rota
│   ├── layout.tsx             # Layout raiz com metadados
│   ├── page.tsx               # Server Component (página raiz)
│   ├── robots.ts              # robots.txt (usa env)
│   ├── sitemap.ts             # sitemap.xml
│   ├── opengraph-image.tsx    # Imagem de compartilhamento social
│   ├── twitter-image.tsx      # Imagem do card do Twitter
│   └── globals.css            # Estilos globais
├── components/
│   ├── ui/                    # Componentes UI puros (sem lógica)
│   │   ├── badge.ui.tsx
│   │   ├── button.ui.tsx
│   │   ├── card.ui.tsx
│   │   ├── og-image.ui.tsx
│   │   ├── radio-group.ui.tsx
│   │   └── range-slider.ui.tsx
│   └── widgets/               # Componentes funcionais com lógica
│       ├── compress-mode.widget.tsx
│       ├── compression-result-card.widget.tsx
│       ├── compression-settings.widget.tsx
│       ├── file-dropzone.widget.tsx
│       ├── format-selector.widget.tsx
│       ├── image-preview.widget.tsx
│       ├── pdf-download-card.widget.tsx
│       ├── pdf-generator.widget.tsx
│       ├── pdf-mode.widget.tsx
│       ├── quality-control.widget.tsx
│       └── tool-switcher.widget.tsx
├── hooks/                     # Hooks React personalizados
│   ├── use-file-dropzone.ts
│   ├── use-image-compression.ts
│   └── use-pdf-generation.ts
└── lib/
    ├── constants.ts           # Limites, formatos e assinaturas compartilhados
    ├── types.ts               # Tipos compartilhados (cliente + servidor)
    ├── validation.ts          # Validadores puros (com testes unitários)
    ├── site-url.ts            # SITE_URL vinda do ambiente
    ├── store/                 # Gerenciamento de estado Zustand
    │   ├── compressor-store.ts
    │   └── pdf-store.ts
    └── utils/                 # Funções utilitárias
        ├── base64.ts
        ├── filename.ts
        ├── format-bytes.ts
        └── toast.ts
```

### Contribuir

Contribuições são bem-vindas! Por favor, sinta-se à vontade para enviar um Pull Request.

1. Fork o repositório
2. Crie sua branch de funcionalidade (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas alterações (`git commit -m 'feat: adicione nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Licença

Este projeto é código aberto e está disponível sob a [Licença MIT](LICENSE).

---

## 📬 Contato / Contact

Criado por **Ruan Valente**.

- 🌐 Portfolio: [ruanvalente-portfolio.vercel.app](https://ruanvalente-portfolio.vercel.app/)
- 💼 LinkedIn: [linkedin.com/in/ruan-valente](https://www.linkedin.com/in/ruan-valente)
- 💻 GitHub: [github.com/ruanvalente](https://github.com/ruanvalente)

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub!