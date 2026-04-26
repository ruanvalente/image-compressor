# 🖼️ Image Compressor

Uma ferramenta para comprimir imagens mantendo a melhor qualidade. Suporta JPEG, PNG, WebP e AVIF.

[English](#english) | [Português](#português)

---

## 🇺🇸 English

### About

**Image Compressor** is a web application built with Next.js that allows you to compress images while maintaining the best possible quality. It supports multiple output formats (JPEG, PNG, WebP, AVIF) and offers quality control via an intuitive interface.

### Features

- 📤 Drag & drop or click to upload images
- 🎚️ Adjustable quality slider (10-100%)
- 🖼️ Multiple output formats: JPEG, PNG, WebP, AVIF
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
- **Notifications**: [Sonner](https://sonner.vercel.app/)
- **Package Manager**: [Bun](https://bun.sh/)

### Getting Started

#### Prerequisites

- [Bun](https://bun.sh/) installed (recommended)
- or Node.js 18+ with npm/yarn/pnpm

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

### Project Structure

```
src/
├── app/
│   ├── api/compress/           # Compression API endpoint
│   ├── layout.tsx             # Root layout with metadata
│   ├── page.tsx               # Main page component
│   ├── robots.txt            # SEO robots file
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # Pure UI components (no logic)
│   │   ├── button.ui.tsx
│   │   ├── card.ui.tsx
│   │   ├── badge.ui.tsx
│   │   └── range-slider.ui.tsx
│   └── widgets/              # Functional components with logic
│       ├── file-dropzone.widget.tsx
│       ├── format-selector.widget.tsx
│       ├── quality-control.widget.tsx
│       ├── image-preview.widget.tsx
│       └── compression-result-card.widget.tsx
├── hooks/                    # Custom React hooks
│   └── use-image-compression.ts
└── lib/
    ├── store/                # Zustand state management
    │   └── compressor-store.ts
    └── utils/               # Utility functions
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

## 🇧🇷 Português

### Sobre

**Image Compressor** é uma aplicação web construída com Next.js que permite comprimir imagens mantendo a melhor qualidade possível. Suporta múltiplos formatos de saída (JPEG, PNG, WebP, AVIF) e oferece controle de qualidade através de uma interface intuitiva.

### Funcionalidades

- 📤 Arraste e solte ou clique para carregar imagens
- 🎚️ Ajuste de qualidade (10-100%)
- 🖼️ Múltiplos formatos de saída: JPEG, PNG, WebP, AVIF
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
- **Notificações**: [Sonner](https://sonner.vercel.app/)
- **Gerenciador de Pacotes**: [Bun](https://bun.sh/)

### Começando

#### Pré-requisitos

- [Bun](https://bun.sh/) instalado (recomendado)
- ou Node.js 18+ com npm/yarn/pnpm

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

### Estrutura do Projeto

```
src/
├── app/
│   ├── api/compress/           # Endpoint da API de compressão
│   ├── layout.tsx             # Layout raiz com metadados
│   ├── page.tsx               # Componente da página principal
│   ├── robots.txt            # Arquivo robots para SEO
│   └── globals.css           # Estilos globais
├── components/
│   ├── ui/                   # Componentes UI puros (sem lógica)
│   │   ├── button.ui.tsx
│   │   ├── card.ui.tsx
│   │   ├── badge.ui.tsx
│   │   └── range-slider.ui.tsx
│   └── widgets/              # Componentes funcionais com lógica
│       ├── file-dropzone.widget.tsx
│       ├── format-selector.widget.tsx
│       ├── quality-control.widget.tsx
│       ├── image-preview.widget.tsx
│       └── compression-result-card.widget.tsx
├── hooks/                    # Hooks React personalizados
│   └── use-image-compression.ts
└── lib/
    ├── store/                # Gerenciamento de estado Zustand
    │   └── compressor-store.ts
    └── utils/               # Funções utilitárias
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