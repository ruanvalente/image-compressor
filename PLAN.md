# 📋 Plano de Ação — Auditoria Técnica do Image Compressor

> Documento gerado a partir da auditoria completa da codebase. Nenhuma alteração de código foi realizada até a aprovação deste plano.

**Stack auditada:** Next.js 16.2.4 (App Router) · React 19.2.4 · TypeScript 5 (strict) · Tailwind v4 · Zustand 5 · Sharp · pdf-lib · Sonner

**Verificações executadas:** `eslint` ✅ | `tsc --noEmit` ✅ | sem uso de `any` ✅ | doc oficial do Next.js 16 validada (deprecations)

---

## 1. Visão geral por área

### Arquitetura
- Estrutura limpa e coerente: `app/` (rotas + APIs), `components/ui` (puros), `components/widgets` (funcionais), `hooks/`, `lib/store`, `lib/utils`. Barrel `index.ts` em cada camada.
- Ponto fraco: a página inteira é `"use client"` (`src/app/page.tsx:1`), anulando RSC/SSR do conteúdo estático.
- `dragActive` é estado global (Zustand) quando é estado local de UI → causa re-renders em cadeia.

### Componentização
- Separação UI/widget/hook bem aplicada (Atomic Design leve).
- `FileDropzone` acoplado ao `compressor-store` mesmo quando usado no modo PDF (`pdf-generator.widget.tsx:88`).
- Duplicação: `base64ToBlob` em 2 hooks; constantes de validação em 2 lugares; `sanitizeFilename` divergente em 2 rotas.

### Performance
- Re-renders evitáveis por inscrição no store inteiro (nenhum seletor usado nos widgets).
- `dragActive` global re-renderiza todos os widgets do compressor a cada evento de drag.
- Modo PDF carregado estaticamente (sem `next/dynamic`).
- `next/image` com `fill` sem `sizes` (dropzone e preview) + `priority` **deprecated no Next 16**.

### React
- Bug real: `setLoading(false)` **nunca** é chamado em nenhum fluxo.
- Estado `error`/`setError` morto nos dois stores.
- Nenhum vazamento de memória detectado (object URLs do PDF são revogados corretamente).

### Next.js
- Boa prática: `metadata` completo, `robots.txt`, Route Handlers com `Cache-Control: no-store` e `X-Content-Type-Options`.
- Faltam: `error.tsx`, `loading.tsx`, `sitemap.xml` (referenciado no robots mas inexistente), lazy loading do modo PDF.
- `priority` → `preload` (deprecated no Next 16, ver `node_modules/next/dist/docs/.../image.md:291-293`).

### TypeScript
- `strict: true`, sem `any`, tipos bem definidos.
- Tipos duplicados entre cliente e servidor: `PageSize` (`pdf-store.ts:3` vs `api/pdf/route.ts:5`), `CompressionResult.format` como `string` no cliente vs union `ImageFormat` no servidor.

### Segurança
- Pontos fortes: validação por assinatura de bytes (magic bytes) na rota de compressão, limites de tamanho, sanitização de filename, sem uso de env/secrets.
- Riscos: sem rate limiting; validação de limites duplicada cliente/servidor (risco de drift); rota `/api/pdf` aceita MIME falsificado (arquivo inválido → 500 genérico em vez de 400).

### Acessibilidade
- Skip link, labels, contraste e `lang="pt-BR"` bem tratados (commits recentes).
- Falhas: `role="radio"` e `role="tab"` em `<button>` sem navegação por setas (roving tabindex) nem `aria-controls`/`tabpanel`.

### Dependências
- `pdf-lib@1.17.1` (2021, sem manutenção ativa). Nada mais obsoleto.
- Sem bibliotecas de teste, sem CI.

### Qualidade
- Lint e typecheck limpos. Sem testes, sem CI, sem script `test`.

---

## 🔴 Prioridade Alta

### H1 — Botões de ação ficam permanentemente desabilitados após o primeiro uso
- **Problema:** `setLoading(true)` é chamado, mas `setLoading(false)` nunca existe em nenhum fluxo — nem no sucesso, nem no erro. Não há `try/finally`.
- **Impacto:** Funcional. Após a primeira compressão/geração de PDF, o botão fica travado em "Comprimindo..."/"Gerando PDF..." e `disabled` para sempre. O usuário só recupera trocando de aba (o `reset()` do store), perdendo o resultado.
- **Localização:** `src/hooks/use-image-compression.ts:39-61` e `src/hooks/use-pdf-generation.ts:36-58`. Sintoma visível em `src/app/page.tsx:70-73` e `pdf-generator.widget.tsx:244-250`.
- **Solução:** envolver o fetch em `try/finally` com `useCompressorStore.getState().setLoading(false)` / `usePdfStore.getState().setLoading(false)` (via `getState`, não closure).
- **Benefício:** corrige o fluxo principal do produto.
- **Complexidade:** Baixa.

### H2 — Limites de validação duplicados cliente/servidor (risco de drift)
- **Problema:** `MAX_FILES`, `MAX_FILE_SIZE`, `MAX_TOTAL_SIZE`, `ALLOWED_TYPES` existem em 2 cópias (`pdf-generator.widget.tsx:12-14` e `api/pdf/route.ts:7-22`). No modo compressão, o limite de 10MB (`api/compress/route.ts:7`) **não existe no cliente** — o dropzone só valida `type` (`file-dropzone.widget.tsx:44-51`), então o usuário faz upload de 50MB para receber erro só depois.
- **Impacto:** Segurança e manutenção. Qualquer mudança num lado dessincroniza do outro (limite de servidor maior que o do cliente abre janela de DoS por tamanho; menor, UX quebrada). Divergência de regra entre UI e servidor.
- **Localização:** acima.
- **Solução:** módulo único `src/lib/constants.ts` (apenas valores + tipos, sem imports de server-only — seguro no bundle cliente) importado por rotas e widgets. Adicionar checagem de 10MB no dropzone de compressão.
- **Benefício:** fonte única de verdade; regras de servidor e cliente nunca divergem.
- **Complexidade:** Baixa.

### H3 — Código duplicado entre os dois fluxos (manutenção)
- **Problema:** `base64ToBlob` duplicado (`use-image-compression.ts:10-26` e `use-pdf-generation.ts:7-23`); `sanitizeFilename` duplicado e com comportamento **divergente** (compress remove extensão `compress/route.ts:137-142`; pdf adiciona `.pdf` `api/pdf/route.ts:34-37`).
- **Impacto:** Manutenção. Correções precisam ser aplicadas em N lugares; comportamento divergente gera bugs sutis.
- **Solução:** extrair `src/lib/utils/base64.ts` e `src/lib/utils/filename.ts` com uma única implementação paramétrica; centralizar tipos (`PageSize`, formatos) em `src/lib/types.ts` (só tipos, zero custo runtime) importado por cliente e servidor.
- **Benefício:** menor superfície de bug, tipos fluem entre front e API.
- **Complexidade:** Baixa.

### H4 — Estado morto `error`/`setError` e `toast.info`
- **Problema:** `error`/`setError` declarados nos dois stores (`compressor-store.ts:23,32,58`; `pdf-store.ts:17,25,80`) e **nunca lidos nem escritos** fora da definição. `toast.info` (`toast.ts:27-32`) e o tipo `ToastType` (`toast.ts:4`) sem uso.
- **Impacto:** Manutenção — dead code engana quem lê (parece que há tratamento de erro que não existe). O erro real só aparece via toast.
- **Solução:** remover `error`/`setError` dos stores (o erro já é tratado por toast) ou, se preferir exibir inline, conectá-lo no componente. Remover `toast.info`/`ToastType`.
- **Benefício:** menos código morto, intenção clara.
- **Complexidade:** Baixa.

---

## 🟡 Prioridade Média

### M1 — Inscrição no store inteiro causa re-renders desnecessários
- **Problema:** todos os widgets chamam `useCompressorStore()` / `usePdfStore()` sem seletor (`page.tsx:57,98`, `file-dropzone.widget.tsx:16-23`, `quality-control.widget.tsx:7`, `format-selector.widget.tsx:11`, `compression-settings.widget.tsx:8`). Qualquer mudança — inclusive `dragActive` — re-renderiza todos os consumidores.
- **Impacto:** Performance em drag (múltiplos eventos por segundo) e em mudança de slider de qualidade.
- **Solução:** seletores granulares (`useCompressorStore((s) => s.file)`) e mover `dragActive`/`setDragActive` para `useState` local do dropzone (é estado de UI, não de negócio).
- **Benefício:** reduz re-renders a componentes realmente afetados.
- **Complexidade:** Baixa.

### M2 — `FileDropzone` acoplado ao store do compressor, usado no modo PDF
- **Problema:** o dropzone lê `preview`, `setPreview`, `setCompressed` do compressor store mesmo em `multiple` mode (PDF), onde nunca os usa — e ainda subscreve o store errado para `dragActive`.
- **Impacto:** Acoplamento e re-renders cruzados entre os dois modos; impede reutilização em outras ferramentas.
- **Solução:** tornar `FileDropzone` um componente controlado (props `preview?: string`, `onFiles`, `multiple`) e extrair a lógica drag/click para um hook `useFileDropzone` (estado local de `dragActive`). Ver refatoração R2.
- **Benefício:** componente puro reutilizável; modo PDF não toca o store do compressor.
- **Complexidade:** Média.

### M3 — Página inteira é Client Component
- **Problema:** `"use client"` em `src/app/page.tsx:1` serializa todo o conteúdo — incluindo o estático — no bundle JS do cliente e perde SSR/SEO da estrutura.
- **Impacto:** Performance (maior JS inicial, sem HTML pronto para crawlers) e menor aproveitamento do App Router.
- **Solução:** manter `page.tsx` como Server Component; extrair um `ToolSwitcher` (cliente) que guarda o `mode` e renderiza os modos; carregar o modo PDF com `next/dynamic` (lazy). Ver refatoração R4.
- **Benefício:** HTML estático no SSR, chunk do PDF baixado sob demanda.
- **Complexidade:** Média.

### M4 — Padrão ARIA de abas e radios quebrado para teclado
- **Problema:** `role="tablist"/"tab"` (`page.tsx:23-52`) e `role="radio"` (`format-selector.widget.tsx:20-37`, `pdf-generator.widget.tsx:96-114`) usados em `<button>` **sem navegação por setas** (roving tabindex), sem `aria-controls`/`tabpanel` no caso das tabs, e sem `type="button"`.
- **Impacto:** Usuários de teclado/leitores de tela não conseguem navegar pelos grupos de forma previsível — viola WCAG 2.1.1/2.4.7 e o padrão ARIA de `radio`/`tab`.
- **Solução:** usar controles nativos (`<input type="radio">` estilizado) para os radiogroups e implementar setas (ArrowLeft/Right) + `aria-controls`/`tabpanel` nas tabs — ou adotar o padrão de segmented control com `aria-pressed` em vez de `tab`.
- **Benefício:** conformidade acessível, suporte de teclado completo.
- **Complexidade:** Média.

### M5 — Dark mode declarado mas não implementado
- **Problema:** `globals.css:15-20` define tema escuro via `prefers-color-scheme`, mas todos os componentes usam cores claras fixas (`bg-white` em `card.ui.tsx:9`, `layout.tsx:129,142`, botões/inputs em `zinc-*`). Em dark mode o fundo fica `#0a0a0a` com cards brancos.
- **Impacto:** UX inconsistente; o usuário em tema escuro vê uma "colagem" de blocos brancos.
- **Solução:** decidir — (a) remover o bloco dark do CSS (assumir tema claro) ou (b) implementar tokens (`dark:` no Tailwind v4) em todos os componentes.
- **Benefício:** aparência consistente.
- **Complexidade:** Média.

### M6 — Sem `error.tsx` / `loading.tsx` e falha de rota `/api/pdf` com erro genérico
- **Problema:** não há Error Boundary (`error.tsx`/`global-error.tsx`) nem estados de loading de rota. Na rota PDF, um arquivo com MIME falsificado passa em `validateFiles` (só valida `file.type`) e explode no `sharp(buffer).metadata()` → 500 genérico ("Erro ao gerar PDF"), sem indicar o arquivo; `pageCount: files.length` (`api/pdf/route.ts:174`) conta arquivos pulados por `continue` (`:141-143`).
- **Impacto:** Estabilidade/UX — erros opacos, contagem de páginas incorreta.
- **Solução:** adicionar `error.tsx` na raiz; na rota, validar assinatura por arquivo (reusar `IMAGE_SIGNATURES`) retornando 400 com nome do arquivo; computar `pageCount` do número real de páginas adicionadas.
- **Benefício:** diagnóstico correto, resposta correta de erro.
- **Complexidade:** Média.

### M7 — Sem testes, CI e script de teste
- **Problema:** `package.json` não tem script `test`, nem vitest/jest, nem `.github/workflows`.
- **Impacto:** Qualidade — regressões (como a do bug H1) passam despercebidas; utilidades puras (`formatBytes`, `calculateCompressionRatio`, validações) são candidatas naturais a testes de unidade.
- **Solução:** adicionar Vitest + testes das utilidades e dos validadores das rotas; GitHub Actions com `lint + typecheck + test + build`.
- **Benefício:** rede de segurança para as refatorações propostas.
- **Complexidade:** Média.

### M8 — `priority` deprecated no Next 16 e `fill` sem `sizes`
- **Problema:** `priority` (`file-dropzone.widget.tsx:145`) foi substituído por `preload` no Next 16 (documentado em `image.md:291-293`). `next/image` com `fill` sem `sizes` em `file-dropzone.widget.tsx:140-146` e `image-preview.widget.tsx:23` gera warning de dev e penalidade de otimização.
- **Impacto:** Deprecação futura + carregamento menos otimizado das prévias.
- **Solução:** trocar `priority` por `preload`; adicionar `sizes="(max-width: 1024px) 50vw, 33vw"` nos dois `fill`.
- **Benefício:** sem warnings, melhor hint de LCP.
- **Complexidade:** Baixa.

---

## 🟢 Prioridade Baixa

| # | Problema | Localização | Solução |
|---|----------|-------------|---------|
| L1 | `sitemap.xml` referenciado no robots mas inexistente (404 para crawlers) | `src/app/robots.txt:4` | Criar `src/app/sitemap.ts` (página única) ou remover a referência |
| L2 | `metadataBase` e URLs hardcoded (dificulta troca de domínio/ambientes) | `layout.tsx:18,39`; `robots.txt:4` | Usar `env` (`NEXT_PUBLIC_SITE_URL`) |
| L3 | `pdf-lib@1.17.1` (2021, sem manutenção ativa) | `package.json` | Avaliar migração (ex.: `@react-pdf/renderer`) ou congelar versão; documentar decisão |
| L4 | Qualidade ignorada em PNG (sharp: `quality` não afeta PNG lossless) | `api/compress/route.ts:115-117` | Reavaliar UX: manter `compressionLevel: 9` e ignorar `quality` para PNG, ou habilitar paleta |
| L5 | Nomenclatura `.ui.tsx`/`.widget.tsx` fora do padrão do ecossistema (o sufixo é redundante com a pasta) | `components/ui/*`, `components/widgets/*` | Renomear para `button.tsx` etc. (a pasta já comunica o tipo) |
| L6 | `RangeSlider`: `aria-label` sobrescrito pela ordem do spread (`{...props}` depois dos `aria-*`); se o consumidor passar `aria-label` com `label`, o label fica sem `htmlFor` correto | `range-slider.ui.tsx:28-39` | Aplicar `{...props}` antes dos atributos `aria-*` derivados |
| L7 | `<span aria-label>` não anuncia em todos os SRs (atributo não suportado em span não-interativo) | `pdf-generator.widget.tsx:232-237` | Usar texto `sr-only` |
| L8 | README desatualizado (estrutura não inclui pdf/hooks/nova branch de features) | `README.md:87-117` | Atualizar árvore do projeto |
| L9 | `calculateFit` sem limite mínimo de escala (imagem minúscula vira 1pt em página A4) | `api/pdf/route.ts:95-106` | Aceitável; documentar ou capar escala |
| L10 | Sem `viewport`/`themeColor` e sem `openGraph` image | `layout.tsx` | Adicionar `export const viewport` e OG image |

---

## ⚡ Quick Wins (< 30 min)

1. **Corrigir H1** (loading travado) — `try/finally` nos dois hooks. *(5 min)*
2. **Remover dead code** (H4): `error`/`setError` dos stores, `toast.info`, `ToastType`. *(5 min)*
3. **Extrair `base64ToBlob`** para `lib/utils/base64.ts` e usar nos dois hooks (H3). *(5 min)*
4. **`sizes` + `preload`** nos dois `next/image` com `fill` (M8). *(5 min)*
5. **`type="button"`** em todos os `<button>` interativos (tabs, radios, ações de lista, remover). *(3 min)*
6. **Check de 10MB no dropzone de compressão** + comentário apontando para as constantes compartilhadas (H2). *(10 min)*
7. **`sitemap.ts`** simples ou remover linha do `robots.txt` (L1). *(5 min)*
8. **`error.tsx`** global com mensagem amigável (M6). *(10 min)*

---

## ♻️ Refatorações sugeridas

### R1 — Padrão de estado assíncrono nos hooks (corrige H1 + parte de M1)

**Atual** (`use-image-compression.ts:28-62`): subscreve o store inteiro no corpo do hook (re-render a cada mudança global) e nunca zera `loading`.

**Proposta:**
```tsx
export function useImageCompression() {
  const compress = useCallback(async () => {
    const store = useCompressorStore.getState();
    if (!store.file) { toast.warning("Nenhum arquivo selecionado"); return; }

    store.setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", store.file);
      formData.append("quality", String(store.settings.quality));
      formData.append("format", store.settings.format);

      const res = await fetch("/api/compress", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao comprimir");
      useCompressorStore.getState().setCompressed(data);
      toast.success("Imagem comprimida com sucesso!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao comprimir imagem");
    } finally {
      useCompressorStore.getState().setLoading(false);
    }
  }, []);

  return { compress, download, isLoading: useCompressorStore((s) => s.loading) };
}
```

**Por que é superior:** `getState()` elimina a dependência de closure (o `useCallback` vira `[]` e o hook para de subscrever o store inteiro → menos re-renders), `try/finally` garante que `loading` sempre volta a `false`, e o tratamento de erro fica local ao hook em vez de depender de toast externo.

### R2 — `FileDropzone` controlado + `useFileDropzone` (resolve M2)

**Atual** (`file-dropzone.widget.tsx:13-23`): lê/precisa do `compressor-store` (inclusive quando usado no modo PDF).

**Proposta:** extrair o estado de drag para o próprio componente e receber props:
```tsx
interface FileDropzoneProps {
  multiple?: boolean;
  preview?: string;
  accept?: string;
  onFiles: (files: File[]) => void;
}
export function FileDropzone({ multiple, preview, accept = "image/*", onFiles }: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  // ...handlers locais; nunca toca em zustand
}
```
No modo compressão: `<FileDropzone preview={preview} onFiles={handleFiles} />`; no modo PDF: `<FileDropzone multiple onFiles={handleFiles} />`.

**Por que é superior:** componente puro e reutilizável, sem acoplamento a estado global; `dragActive` deixa de re-renderizar o mundo a cada evento de drag; a regra de validação de arquivos fica com quem decide (modo compress vs PDF).

### R3 — Seletores granulares de Zustand (resolve M1)

**Atual:** `const { file, compressed, loading } = useCompressorStore();` em `page.tsx:57` e equivalentes nos widgets.

**Proposta:**
```tsx
const file = useCompressorStore((s) => s.file);
const compressed = useCompressorStore((s) => s.compressed);
const loading = useCompressorStore((s) => s.loading);
```

**Por que é superior:** Zustand compara o resultado do seletor por `Object.is`; cada widget re-renderiza apenas quando o dado que consome muda — não a cada mudança de `dragActive`, `preview`, etc.

### R4 — Server Component + client islands + lazy PDF (resolve M3)

**Proposta:**
```tsx
// src/app/page.tsx — Server Component (sem "use client")
import { ToolSwitcher } from "@/components/widgets/tool-switcher";
export default function Home() {
  return <ToolSwitcher />;
}

// src/components/widgets/tool-switcher.tsx — "use client"
import { lazy, Suspense, useState, useCallback } from "react";
const PdfMode = lazy(() => import("./pdf-mode").then((m) => ({ default: m.PdfMode })));
```
`CompressMode` e `PdfMode` viram componentes client dedicados; o PDF é baixado sob demanda com fallback de `Suspense`.

**Por que é superior:** o HTML inicial é servido já renderizado (SSR), o JS crítico cobre só o modo compressor, e o modo PDF (menos usado) só carrega quando acionado — reduzindo LCP e bundle inicial.

### R5 — Módulo de constantes/tipos compartilhado (resolve H2/H3)

**Proposta — `src/lib/constants.ts`:**
```ts
export const COMPRESS_FORMATS = ["jpeg", "png", "webp", "avif"] as const;
export type CompressFormat = (typeof COMPRESS_FORMATS)[number];
export const IMAGE_SIGNATURES = { /* ... magic bytes ... */ } as const;
export const MAX_COMPRESS_FILE_SIZE = 10 * 1024 * 1024;
export const PDF_MAX_FILES = 20;
export const PDF_MAX_FILE_SIZE = 30 * 1024 * 1024;
export const PDF_MAX_TOTAL_SIZE = 100 * 1024 * 1024;
export const PAGE_SIZE_OPTIONS = [
  { value: "original", label: "Original" },
  { value: "a4", label: "A4" },
  { value: "letter", label: "Carta" },
] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]["value"];
```

Rotas e widgets importam deste módulo (só valores/tipos → zero custo no bundle cliente, import seguro).

**Por que é superior:** fonte única de verdade — regras de segurança vivem num lugar só, tipos (`CompressFormat`, `PageSize`) fluem do cliente para o servidor sem deriva, e `PageSize`/`CompressionResult` param de ser duplicados.

---

## 📊 Resumo e Notas

| Critério | Nota | Comentário |
|---|---|---|
| **Arquitetura geral** | **7.5/10** | Estrutura limpa por camadas; falha no uso do App Router (página 100% client) e acoplamento dropzone→store |
| **Performance** | **6.5/10** | Re-renders por inscrição global; sem lazy do modo PDF; prévias sem `sizes` |
| **Segurança** | **8.0/10** | Magic bytes, limites e sanitização bem feitos; falta rate limiting e regras centralizadas cliente/servidor |
| **Componentização** | **7.0/10** | Ótima separação UI/widget/hook; `FileDropzone` acoplado e duplicações |
| **Organização** | **8.0/10** | Consistente e previsível; sufixos `.ui`/`.widget` idiossincráticos |
| **Qualidade do código** | **7.0/10** | Sem `any`, strict, lint limpo; bug de `loading` e dead code |
| **Escalabilidade** | **7.0/10** | Bom para a escala atual; client-first limita crescimento; stores monolíticos |
| **Manutenibilidade** | **7.5/10** | Legível; duplicação de regras/utilitários é o maior custo futuro |

---

## 0️⃣ Etapa 0 — Atualização e manutenção de dependências

> Não existia nenhuma etapa dedicada à atualização de bibliotecas no processo — o único item mapeado era a avaliação do `pdf-lib` (L3). Esta etapa passa a ser **pré-requisito** de qualquer fase do roadmap abaixo.

### Situação inicial (auditada em 06/08/2026 via `npm outdated`)

| Pacote | Atual | Latest | Ação recomendada |
|---|---|---|---|
| `next` | 16.2.4 | 16.3.0 | Minor — atualizar e validar breaking changes nos docs oficiais |
| `react` / `react-dom` | 19.2.4 | 19.2.8 | Minor — atualização segura |
| `sharp` | 0.34.5 | 0.35.3 | Minor — atualizar (validar `ignoreScripts`) |
| `zustand` | 5.0.12 | 5.0.14 | Patch — atualização segura |
| `tailwindcss` / `@tailwindcss/postcss` | 4.2.4 | 4.3.3 | Minor — atualizar |
| `typescript` | 5.9.3 | **7.0.2** | **Major — NÃO atualizar sem rede de testes (M7)** |
| `eslint` | 9.39.4 | **10.8.0** | Major — exige `eslint-config-next` compatível; avaliar |
| `eslint-config-next` | 16.2.4 | 16.3.0 | Acompanha o `next` |
| `@types/node` | 20.x | 26.x | Major — avaliar junto do runtime |
| `pdf-lib` | 1.17.1 | 1.17.1 | Abandonado (2021) — decisão do L3 feita aqui |

### ✅ Execução da Etapa 0 (concluída em 06/08/2026)

**Versões aplicadas** (via `bun add`, gerenciador do projeto — `bun.lock`):

| Pacote | De | Para | Tipo | Status |
|---|---|---|---|---|
| `next` | 16.2.4 | **16.3.0** | Minor | ✅ atualizado |
| `react` / `react-dom` | 19.2.4 | **19.2.8** | Minor | ✅ atualizado |
| `sharp` | 0.34.5 | **0.35.3** | Minor | ✅ atualizado (mantido `ignoreScripts`/`trustedDependencies`) |
| `zustand` | 5.0.12 | **5.0.14** | Patch | ✅ atualizado |
| `tailwindcss` / `@tailwindcss/postcss` | 4.2.4 | **4.3.3** | Minor | ✅ atualizado |
| `eslint-config-next` | 16.2.4 | **16.3.0** | Minor | ✅ atualizado (peer `eslint: >=9.0.0` confirmado) |
| `@types/react` | 19.2.14 | **19.2.18** | Patch | ✅ atualizado |
| `@types/react-dom` | 19.2.3 | **19.2.4** | Patch | ✅ atualizado |
| `@types/node` | 20.19.39 | **20.19.43** | Patch | ✅ atualizado (major 26.x adiado) |
| `typescript` | 5.9.3 | 5.9.3 | **Major 7.0.2** | ⏸️ adiado — ver decisão abaixo |
| `eslint` | 9.39.4 | 9.39.4 | **Major 10.8.0** | ⏸️ adiado — ver decisão abaixo |

**Verificações de breaking changes:**
- `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` relido (16.3.0 instalado). O guia descreve migrações 15→16 já ultrapassadas; **nenhuma breaking change nova** para 16.2.4→16.3.0 afeta a codebase (sem `proxy.ts`, sem route handlers com `params`, sem parallel routes, sem `revalidateTag`, sem config custom de imagens). `next/image` `qualities` default = `[75]` e `minimumCacheTTL` = 4h: a app não usa esses campos → sem impacto.
- 16.3.0 é a primeira stable do ciclo 16.3 (estável em 03/08/2026); inclui o **security patch 16.2.11** (4 HIGH + 5 MEDIUM) e backports de suporte ao TypeScript 7 (16.2.12).
- Deprecação `priority` → `preload` **confirmada** em `image.md:291-293` na nova versão — base para M8 (Fase 1).
- `eslint-config-next@16.3.0` passa a emitir flat config por padrão (`@next/eslint-plugin-next`); o projeto **já usa flat config** (`eslint.config.mjs`) → compatível com o atual e com futuro ESLint 10.

**Validação pós-upgrade (referência antes = 16.2.4):**

| Checagem | 16.2.4 (baseline) | 16.3.0 (pós) |
|---|---|---|
| `npm run lint` | ✅ | ✅ |
| `tsc --noEmit` | ✅ (exit 0) | ✅ (exit 0) |
| `npm run build` | ✅ | ✅ |
| `GET /` | — | ✅ 200 |
| `GET /robots.txt` | — | ✅ 200 |
| `POST /api/compress` (PNG→webp) | — | ✅ 200, `{success:true}` |
| `POST /api/pdf` (2 imagens, a4) | — | ✅ 200, PDF válido (`%PDF-`, 16.7 KB, 2 páginas) |

**Decisões registradas:**

1. **TypeScript 7.0.2 (major, tsgo) — ⏸️ adiado.** Upgrade sem rede de testes (M7) contraria o plano. Reavaliar na Fase 3, quando o CI (M7) existir. *→ Reavaliado com upgrade real em 07/08/2026: mantido em 5.9.3 por blocker externo (typescript-estree) — ver Follow-ups, item 1.*
2. **ESLint 10.8.0 (major) — ⏸️ adiado.** Compatível tecnicamente (peer `>=9.0.0` + flat config já em uso), mas é major sem testes. Reavaliar junto do TS 7 na Fase 3/4. *→ Reavaliado com upgrade real em 07/08/2026: mantido em 9.39.5 por blocker externo (eslint-plugin-react) — ver Follow-ups, item 2.*
3. **`@types/node` 26.x (major) — ⏸️ adiado.** Runtime atual é Node 22. Mantido 20.x; revisitar quando o runtime de produção for definido. *→ Runtime definido em 07/08/2026 (Node 22 LTS): `@types/node` alinhado ao 22.x; major 26 descartado — ver Follow-ups, item 3.*
4. **`pdf-lib@1.17.1` (L3) — 📌 DECISÃO: congelar (pin) e manter.** O pacote está abandonado desde 2021, mas cumpre o caso de uso (merge de imagens em páginas PDF) e foi validado funcionalmente nesta etapa. Migração (`@react-pdf/renderer`) é mudança maior com custo de runtime e não há ganho proporcional agora. Reavaliação formal agendada na **Fase 4** — se surgir necessidade de novos recursos de PDF, migrar antes. Pin aplicado em `package.json` (removido o `^`). *(Anotação criada em 06/08/2026.)*
5. **Requisito de runtime Node `>=20.9.0`** — adicionado campo `engines` em `package.json` (exigido por `next@16.3.0` e `sharp@0.35.3`). Sem `.nvmrc`/Dockerfile ainda; se for deployar em Node 18+, criar `.nvmrc` na Fase 4 (env de URL/deploy).

**Revisão de código (resultado da Etapa 0):**
- Revisão automatizada executada sobre o diff da Etapa 0. Conclusões: lint/tsc/build passam; `bun.lock` consistente; claim H1 (`setLoading` sem reset) confirmado real; deprecação `priority`→`preload` confirmada na doc instalada; `pageCount` e constantes duplicadas verificados.
- Ações aplicadas após a revisão: (1) `engines: { node: ">=20.9.0" }` adicionado; (2) pin do `pdf-lib` aplicado (`1.17.1`, sem `^`) para alinhar manifest à decisão documentada.
- Nota: claims factuais de versões/security patches datados (06/08/2026) — podem ficar obsoletos; revisar em rodadas futuras.

**Resumo:** stack atualizado em segurança — **Next 16.3.0 · React 19.2.8 · sharp 0.35.3 · zustand 5.0.14 · Tailwind 4.3.3 · TypeScript 5.9.3**. Nenhuma regressão detectada nos dois fluxos principais. `npm outdated` restante: apenas os 3 majors adiados (TS 7, ESLint 10, @types/node 26). **Etapa 0 concluída — base pronta para a Fase 1.**

### Procedimento (checklist a cada rodada)

1. `npm outdated` para identificar majors, minors e patches.
2. Ler changelog/notas de breaking changes antes de cada atualização (no Next, validar em `node_modules/next/dist/docs/`).
3. Atualizar **patches/minors** em lote e rodar `npm run lint` + `tsc --noEmit` + `npm run build`.
4. **Majors**: atualizar isoladamente, com regressão manual dos dois fluxos (compressão e PDF).
5. Registrar a decisão sobre o `pdf-lib` (atualizar/pin/migrar — L3) em ADR ou comentário no `package.json`.
6. Rodar esta etapa **antes** de qualquer Fase: a Fase 2 centraliza constantes e a Fase 4 decide o futuro do `pdf-lib` sobre a base já atualizada.

---

## 1️⃣ Fase 1 — Correções de bugs e Quick Wins (concluída em 06/08/2026)

> Escopo: H1 → H4 → H3 → M8 + demais Quick Wins (sizes/preload, type=button, sitemap, check 10MB, error.tsx). Nenhuma mudança estrutural (Fase 2+) foi antecipada.

### ✅ Execução

| Item | Problema | Solução aplicada | Arquivos |
|---|---|---|---|
| **H1** | `setLoading(true)` sem `setLoading(false)` — botão trava em "Comprimindo..."/"Gerando PDF..." para sempre após o 1º uso | Padrão R1: leitura via `getState()` + `try/catch/finally` garantindo `loading=false` em sucesso **e** erro; erros tratados localmente via toast com a mensagem real do servidor | `src/hooks/use-image-compression.ts`, `src/hooks/use-pdf-generation.ts` |
| **H4** | Dead code `error`/`setError` (stores) e `toast.info`/`ToastType` (toast.ts) | Removidos dos dois stores e do `toast.ts` | `src/lib/store/compressor-store.ts`, `src/lib/store/pdf-store.ts`, `src/lib/utils/toast.ts` |
| **H3** | `base64ToBlob` duplicado nos 2 hooks | Extraído para `src/lib/utils/base64.ts`; hooks passam a importá-lo | `src/lib/utils/base64.ts` (novo) |
| **M8** | `priority` **deprecated** no Next 16; `fill` sem `sizes` gera warning e penalidade de otimização | `priority` → `preload` no dropzone; `sizes="(max-width: 1024px) 100vw, 50vw"` nos dois `next/image` com `fill` | `src/components/widgets/file-dropzone.widget.tsx`, `src/components/widgets/image-preview.widget.tsx` |
| **QW 5** | Botões interativos sem `type="button"` (radios, remover, limpar, ações) | Default `type="button"` no componente `Button` (sobrescrevível via prop); explícito nas tabs do `page.tsx` | `src/components/ui/button.ui.tsx`, `src/app/page.tsx` |
| **QW 6** | Dropzone de compressão validava só o `type`, sem limite de 10MB | Constante local `MAX_COMPRESS_FILE_SIZE = 10MB` + check com toast de erro; `TODO(Fase 2 - H2)` apontando para a centralização em `src/lib/constants.ts` | `src/components/widgets/file-dropzone.widget.tsx` |
| **QW 7** | `sitemap.xml` referenciado no `robots.txt` mas inexistente (L1 — 404 para crawlers) | `src/app/sitemap.ts` criado (página única, via `MetadataRoute.Sitemap`) | `src/app/sitemap.ts` (novo) |
| **QW 8** | Sem error boundary (parte de M6) | `src/app/error.tsx` com mensagem amigável + botão "Tentar novamente" | `src/app/error.tsx` (novo) |

### 📌 Notas e decisões

1. **Hooks com padrão R1:** `useCallback([])` + `getState()` eliminam as dependências de closure (`file`/`settings`/`files`/`pageSize`) e o hook passa a subscrever o store **apenas** pelo seletor `isLoading` → menos re-renders (M1 é concluído por completo na Fase 2). O `toast.promise` foi substituído por `toast.success`/`toast.error` explícitos: o loading já é refletido no botão e o `finally` garante o reset mesmo em falha de rede.
2. **`error.tsx` usa `retry`, não `reset`** — convenção do Next 16 confirmada na doc instalada (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`), diferente do Next 13/14.
3. **Desvio de `sizes`:** o plano sugeria `(max-width: 1024px) 50vw, 33vw`; apliquei `(max-width: 1024px) 100vw, 50vw` por refletir o layout real (container `max-w-4xl`, grid `lg:grid-cols-2` → coluna única no mobile, meia coluna no desktop). Valor documentado para reavaliação se o layout mudar.
4. **Check 10MB** no dropzone replica o valor da rota `api/compress/route.ts:7`. A duplicação é intencional e temporária — a fonte única de verdade chega na Fase 2 (H2/R5).
5. **Sem mudanças estruturais** (page ainda é Client Component; dropzone ainda acoplado ao store; `dragActive` ainda global) — esses pontos são M3/M2/M1 e ficam para Fase 2/Fase 3, evitando sobreposição com a refatoração.

### 🔍 Revisão de código (resultado da Fase 1)

- Revisão automatizada executada sobre o diff da Fase 1. Confirmações: deprecação `priority`→`preload` documentada em `image.md:291-293` (Next 16.3.0 instalado); `error.tsx` com `retry()` conforme doc oficial; `type="button"` aplicado no componente `Button` (default) e nas tabs; `base64ToBlob` sem duplicação restante; nenhuma referência a `setError`/`toast.info`/`ToastType`/`priority` restante em `src/` (exceto `priority` do sitemap, que é metadata de SEO e não o prop do Image).
- Ponto de atenção para a Fase 2: `toast.promise` continua exportado em `toast.ts` mas **sem uso** após a troca dos hooks para `toast.success`/`toast.error`. Decidido manter (API útil do wrapper) — mas se confirmar sem uso na Fase 2, remover junto do H4 residual.

#### Iteração pós-revisão (achados do review)

Ajustes aplicados a partir da revisão automatizada (nenhum era blocker; todos de baixa severidade):

1. **Erros não-JSON e falhas de rede nos hooks** (`use-image-compression.ts` / `use-pdf-generation.ts`): o `res.json()` era chamado antes de checar `res.ok` e sem guarda — corpo não-JSON (ex.: página de erro do CDN/hosting) lançava `SyntaxError` e exibia o texto cru ao usuário. Novo fluxo: parse defensivo (`res.json().catch(() => null)`), mensagem localizada com `HTTP <status>` como fallback, e `TypeError` de `fetch` (offline/timeout/DNS) exibido como "Falha de conexão — Verifique sua internet e tente novamente" em vez do "Failed to fetch" do browser.
2. **`lastModified` não-determinístico** (`sitemap.ts`): `new Date()` regenerava timestamp a cada build, causando re-fetch desnecessário de crawlers/CDN. Trocado por data fixa do commit inicial do projeto (`2026-04-26`).
3. **`preload` no preview do dropzone** (`file-dropzone.widget.tsx:155`): mantido conforme a migração Next 16, mas sem benefício real — o preview em data-URL só existe após seleção. Reavaliado na Fase 2.

**Revalidação pós-ajustes:** `npm run lint` ✅ · `npx tsc --noEmit` ✅.

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `npm run lint` | ✅ |
| `npx tsc --noEmit` | ✅ (exit 0) |
| `npm run build` | ✅ rotas: `/` (estática), `/_not-found`, `/api/compress`, `/api/pdf`, `/robots.txt`, `/sitemap.xml` |
| `GET /` | ✅ 200 |
| `GET /robots.txt` | ✅ 200 |
| `GET /sitemap.xml` | ✅ 200 — XML válido com `<loc>` da home |
| `POST /api/compress` (PNG → webp, q80) | ✅ 200 `{success:true}` (8.6 KB → 950 B, ratio 88.9%) |
| `POST /api/pdf` (2 imagens, A4) | ✅ 200 — PDF válido (`%PDF-`), `pageCount: 2`, 5.9 KB |
| `POST /api/compress` (arquivo 11 MB) | ✅ 400 `"Arquivo muito grande. Máximo: 10MB"` |

**Resumo:** bug crítico H1 corrigido (loading sempre retorna a `false`), dead code removido, `base64ToBlob` unificado e os 5 Quick Wins aplicados. Nenhuma regressão nos dois fluxos principais. **Fase 1 concluída — base pronta para a Fase 2.**

---

## 2️⃣ Fase 2 — Fundações (concluída em 06/08/2026)

> Escopo: H2/H3 (fonte única de constantes/tipos) → M2 (dropzone controlado + hook `useFileDropzone`) → M1 (seletores granulares + `dragActive` local). Testes Vitest adicionados antes das mudanças estruturais (M7 parcial).

### ✅ Execução

| Item | Problema | Solução aplicada | Arquivos |
|---|---|---|---|
| **H2** | Limites, formatos e assinaturas duplicados entre cliente e servidor (risco de drift) | Módulo único `src/lib/constants.ts` com limites (`MAX_COMPRESS_FILE_SIZE`, `PDF_MAX_FILES/FILE_SIZE/TOTAL_SIZE`), `COMPRESS_FORMATS`, `COMPRESS_MIME_TYPES`, `IMAGE_SIGNATURES`, `ALLOWED_MIME_TYPES`/`PDF_ALLOWED_TYPES` (derivadas da mesma lista), `PAGE_SIZE_OPTIONS`, `PAGE_SIZE_PT`. Widgets e rotas importam dele — zero imports server-only, seguro no bundle cliente | `src/lib/constants.ts` (novo), `api/compress/route.ts`, `api/pdf/route.ts`, `file-dropzone.widget.tsx`, `pdf-generator.widget.tsx`, `page.tsx` |
| **H3** | `sanitizeFilename` duplicado e divergente; `PageSize`/`CompressionResult.format` duplicados entre cliente e servidor | `sanitizeFilename` paramétrico em `src/lib/utils/filename.ts` (extensão opcional); tipos centralizados em `src/lib/types.ts` (`CompressFormat`, `PageSize`, `CompressionResult`, `CompressionSettings`, `PdfResult`); `CompressionResult.format` agora é a union `CompressFormat` nos dois lados | `src/lib/types.ts` (novo), `src/lib/utils/filename.ts` (novo), stores, hooks, widgets, rotas |
| **H2 (validador)** | Lógica de validação embutida nas rotas (intestável) | Extraídos validadores puros para `src/lib/validation.ts`: `ValidationError`, `validateFileSignature`, `validateCompressFile`, `parseCompressOptions`, `calculateCompressionRatio`, `validatePdfFiles` — usados pelas duas rotas | `src/lib/validation.ts` (novo), rotas |
| **M2** | `FileDropzone` acoplado ao compressor-store mesmo no modo PDF | Componente controlado: props `multiple`, `preview`, `accept`, `onFiles` — nunca toca em zustand. Novo hook `useFileDropzone` (estado local de `dragActive` + handlers drag/click). Validação de arquivos movida para os consumidores (`CompressMode` em `page.tsx`; `PdfGenerator.handleFiles`) | `src/components/widgets/file-dropzone.widget.tsx`, `src/hooks/use-file-dropzone.ts` (novo), `src/app/page.tsx`, `pdf-generator.widget.tsx` |
| **M1** | Inscrição no store inteiro re-renderizava todos os widgets a cada mudança | Seletores granulares (`useCompressorStore((s) => s.quality)` etc.) em todos os widgets e na `page.tsx`; `dragActive`/`setDragActive` removidos do compressor-store | widgets, `page.tsx`, `compressor-store.ts` |
| **M7 (parcial)** | Sem testes nem script `test` | Vitest 4.1.10 + `vitest.config.mts` + 38 testes cobrindo `formatBytes`, `base64ToBlob`, `sanitizeFilename` e todos os validadores; scripts `test`/`test:watch` | `vitest.config.mts`, `package.json`, `src/lib/**/*.test.ts` |
| **H4 residual** | `toast.promise` confirmado sem uso (nota pendente da Fase 1) | Removido do wrapper `toast.ts` | `src/lib/utils/toast.ts` |
| **Fase 1 pendente** | `preload` no preview do dropzone sem benefício real (data-URL só existe após seleção) | Removido; `preload` permanece apenas onde há LCP real (nenhum lugar restante no fluxo de prévia) | `file-dropzone.widget.tsx` |

### 📌 Notas e decisões

1. **`sanitizeFilename` unificado com semântica melhorada no PDF:** a versão paramétrica sempre remove a extensão original e anexa a solicitada. Caso PDF: antes `"relatorio.png"` → `"relatorio.png.pdf"`; agora → `"relatorio.pdf"`. Comportamento de compressão idêntico ao anterior. Mudança intencional e documentada.
2. **`IMAGE_SIGNATURES` tipado `Record<string, readonly number[]>`** (não `as const` puro) para permitir indexação dinâmica por `string` na validação — mantém a segurança de lista fechada porque os valores continuam literais.
3. **`PDF_ALLOWED_TYPES` e `ALLOWED_MIME_TYPES` derivam da mesma `Object.keys(IMAGE_SIGNATURES)`** — uma única lista de MIMEs suportados para as duas rotas; impossível dessincronizar.
4. **Validação movida para os consumidores** (M2) preserva todos os toasts; o toast de sucesso do modo PDF agora usa o número real de arquivos adicionados (`validFiles.length`), mais preciso que o filtro pré-adição do dropzone.
5. **`dragActive` como estado local** elimina re-renders em cadeia. Limitação pré-existente herdada: `dragleave` dispara ao passar sobre filhos (preview/texto), causando flicker do highlight — não é regressão; reavaliar na Fase 4 se necessário.
6. **Vitest sem jsdom** — todas as utilidades testadas são puras e usam APIs globais do Node (Blob, atob, File). Testes de componentes ficam para quando houver necessidade.
7. **`error.tsx` com `retry()`** mantido da Fase 1 (convenção Next 16); a validação de assinatura por arquivo na rota PDF (parte do M6) permanece para a Fase 3.
8. **Página continua Client Component** — a conversão para RSC + `ToolSwitcher` + `next/dynamic` é o M3, escopo da Fase 3. Sem mudança estrutural antecipada nesta fase.
9. **Conhecimento herdado (reavaliar no M6, Fase 3):** `IMAGE_SIGNATURES.avif` exige ftyp box de tamanho exatamente `0x18` (24 bytes). Muitos AVIF reais usam ftyp de 32 bytes (marcas `avif`/`avis`) e seriam rejeitados como "Arquivo inválido". Comportamento pré-existente, movido verbatim na Fase 2; revisar a assinatura AVIF ao centralizar a validação de magic bytes por arquivo na rota PDF.

### 🔍 Revisão de código (resultado da Fase 2)

- Revisão automatizada executada sobre o diff da Fase 2. **BLOCKER: nenhum.** Confirmações: `npm test` 38/38 ✅ · `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ sem warnings; nenhuma duplicação remanescente de constantes/validadores; padrão `useRef`+`useEffect` (latest-callback) do `useFileDropzone` correto; toasts preservados; remoção de `dragActive` do store completa.
- Ajustes aplicados pós-revisão:
  1. **Config Vitest renomeada** `vitest.config.ts` → `vitest.config.mts` (suprime warning ESM-in-CJS do Vite `configLoader: 'native'`).
  2. **`fileCount` redundante** removido no `pdf-generator.widget.tsx` (usa `files.length`).
  3. **Mensagem de formato ausente mais clara** em `parseCompressOptions` (evita `Formato não suportado: null`).
  4. **Teste de truncamento pinado** (`sanitizeFilename`) — agora verifica o resultado exato (255 chars + extensão) em vez de limite solto.
  5. **`toast.promise` removido** (H4 residual confirmado sem uso).
  6. **`sanitizeFilename` reordenado** — extensão removida antes do `slice(0, 255)`, garantindo que o limite se aplica ao nome base; a extensão anexada depois nunca é truncada no meio. Resultado idêntico em todos os casos testados (38/38 seguem passando).
  7. **Fallback de MIME no download restaurado** (`?? "application/octet-stream"`) em `use-image-compression.ts` — comportamento defensivo que existia antes da centralização; type-safe, mas protege o download contra resposta de servidor fora do contrato.

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `npm test` | ✅ 38 passed (4 arquivos: format-bytes 5, base64 3, filename 6, validation 24) |
| `npm run lint` | ✅ |
| `npx tsc --noEmit` | ✅ (exit 0) |
| `npm run build` | ✅ rotas: `/`, `/_not-found`, `/api/compress`, `/api/pdf`, `/robots.txt`, `/sitemap.xml` |
| `GET /` | ✅ 200 |
| `GET /sitemap.xml` | ✅ 200 |
| `POST /api/compress` (PNG → webp, q80) | ✅ 200 `{success:true}`, filename `img1.webp` (sanitização + extensão), ratio 86.4% |
| `POST /api/compress` (arquivo 11 MB) | ✅ 400 `"Arquivo muito grande. Máximo: 10MB"` (constante compartilhada) |
| `POST /api/pdf` (2 imagens, A4, "relatório final.pdf") | ✅ 200 — filename `relat_rio_final.pdf`, `pageCount: 2`, PDF válido (`%PDF-`) |

**Resumo:** fonte única de verdade para regras de segurança (H2), tipos e utilitários compartilhados (H3), dropzone desacoplado e controlado (M2), re-renders minimizados por seletores granulares (M1) e primeira rede de testes (M7 parcial, 38 testes). Nenhuma regressão nos dois fluxos principais. **Fase 2 concluída — base pronta para a Fase 3.**

---

## 3️⃣ Fase 3 — Arquitetura (concluída em 06/08/2026)

> Escopo: M3 (page RSC + `ToolSwitcher` + `next/dynamic` do PDF) → M6 (magic bytes na rota PDF + `pageCount` correto + `error.tsx`/`loading.tsx`) → M7 (CI: lint + tsc + test + build).

### ✅ Execução

| Item | Problema | Solução aplicada | Arquivos |
|---|---|---|---|
| **M3** | Página inteira era Client Component — todo o conteúdo (inclusive estático) no bundle JS, sem SSR/SEO da estrutura | `page.tsx` virou **Server Component** renderizando `<ToolSwitcher/>`; `CompressMode` e `PdfMode` extraídos para componentes client dedicados; modo PDF carregado com `next/dynamic` (lazy) + fallback de loading; `ToolSwitcher` (client) guarda o `mode` e mantém os resets de store ao trocar de aba | `src/app/page.tsx`, `tool-switcher.widget.tsx` (novo), `compress-mode.widget.tsx` (novo), `pdf-mode.widget.tsx` (novo) |
| **M6 (loading)** | Sem `loading.tsx` de rota | `src/app/loading.tsx` com skeleton (animação `animate-pulse`); `error.tsx` já existia desde a Fase 1 | `src/app/loading.tsx` (novo) |
| **M6 (magic bytes)** | Rota `/api/pdf` aceitava MIME falsificado → `sharp` explodia em 500 genérico | Validação de assinatura **por arquivo** (`validatePdfFileSignature`) reutilizando `IMAGE_SIGNATURES` + check de ftyp/brand para AVIF → **400 com o nome do arquivo**; falha de leitura pós-validação (conteúdo corrompido) também vira 400 com nome | `src/app/api/pdf/route.ts`, `src/lib/validation.ts` |
| **M6 (pageCount)** | `pageCount: files.length` contava arquivos pulados por `continue` (dimensão ilegível) | Contador real de páginas adicionadas (`pageCount += 1` a cada `addPage`) | `src/app/api/pdf/route.ts` |
| **M6 (AVIF)** | `IMAGE_SIGNATURES.avif` exigia box ftyp de exatamente 24 bytes — AVIFs reais (ex.: sharp gera 28, muitos usam 32) eram rejeitados como "Arquivo inválido" | Assinatura AVIF passou a validar a **estrutura** (presença do box `ftyp` + major brand `avif`/`avis`/`mif1`), aceitando qualquer tamanho de box; `ALLOWED_MIME_TYPES` continua derivando de uma única lista (signatures + avif) | `src/lib/constants.ts`, `src/lib/validation.ts` |
| **M7** | Sem script `test`/`typecheck` padronizado nem CI | GitHub Actions `.github/workflows/ci.yml` (Bun: `lint` + `typecheck` + `test` + `build`) em push/PR; script `typecheck` adicionado ao `package.json` | `.github/workflows/ci.yml` (novo), `package.json` |

### 📌 Notas e decisões

1. **`next/dynamic` validado na doc instalada** (`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`): continua suportado no App Router do Next 16 como composto de `React.lazy()` + `Suspense`. A guide alerta que **Server Component não faz code splitting automático ao importar Client Component dinamicamente** — por isso o `dynamic()` vive no `ToolSwitcher` (client), não no `page.tsx`.
2. **Página RSC comprovada por SSR:** `GET /` entrega o shell estático (header, tabs, botão "Comprimir Imagem") já renderizado no servidor, sem marcação `"use client"` no HTML final.
3. **Chunk do PDF separado:** o conteúdo do modo PDF reside em chunks próprios no build (verificado), baixados sob demanda ao trocar para a aba PDF — bundle inicial e LCP reduzidos.
4. **Circular import evitado:** `CompressMode`/`PdfMode` importam os widgets irmãos por caminho direto (não via barrel `index.ts`) para evitar o ciclo `index.ts → ToolSwitcher → compress-mode → index.ts`. `index.ts` exporta `ToolSwitcher`; o único consumidor do barrel na árvore é `page.tsx`.
5. **AVIF — mudança de comportamento documentada (melhoria):** a validação deixou de exigir tamanho exato do box e passou a validar estrutura (`ftyp` + brand). Confirmação empírica: `sharp` gera AVIF com ftyp de **28 bytes** (`0x1c`) e major brand `avif` — a assinatura antiga rejeitaria AVIFs gerados pela própria ferramenta. A lista de marcas é fechada, então continua impossível falsificar com conteúdo arbitrário.
6. **`loading.tsx` em rota estática:** a home é prerendered, então o `loading.tsx` raramente renderiza — adicionado para completar o M6 e servir navegação/streaming futuro.
7. **CI com Bun** (gerenciador do projeto — `bun.lock`): `bun install --frozen-lockfile` + os 4 scripts. Novos testes (46 no total) rodam no CI.
8. **`try/catch` de `sharp(...).metadata()`** na rota PDF converte falha de leitura (cabeçalho válido, conteúdo corrompido) em 400 com o nome do arquivo — endereça o ponto do audit "arquivo inválido → 500 genérico em vez de 400".

### 🔍 Revisão de código (resultado da Fase 3)

- Revisão automatizada sobre o diff da Fase 3. **BLOCKER: nenhum.** Confirmações: página RSC + lazy PDF funcionais (SSR e code-split verificados no build); validação por arquivo responde 400 com nome; `pageCount` reflete páginas reais; AVIF com ftyp de 28/32 bytes aceito; workflow de CI coerente com os scripts do `package.json`; nenhuma referência órfã a `IMAGE_SIGNATURES.avif`; `npm test` 46/46 ✅.
- Ajustes aplicados pós-revisão:
  1. **Circular import eliminado** — `compress-mode.widget.tsx`/`pdf-mode.widget.tsx` passaram a importar widgets irmãos por caminho direto (ver nota 4).
  2. **🐛 REGRESSÃO WebP corrigida (achado da revisão de código):** a assinatura `image/webp` original (`[0x57,0x45,0x42,0x50]` checada no offset 0) estava **errada** — WebP é um container RIFF: `RIFF` nos bytes 0–3 e `WEBP` nos bytes **8–11** (verificado em WebP real gerado pelo `sharp`). Como a Fase 3 passou a validar assinatura na rota PDF, todo `.webp` válido falharia com 400. Correção: `validateWebpSignature` (estrutural, como o AVIF) checa `RIFF` + `WEBP` nas posições corretas; `"image/webp"` movido para a lista de formatos-container em `ALLOWED_MIME_TYPES`. +3 testes (RIFF válido, sem marker WEBP, sem header RIFF). **Revalidação end-to-end:** `POST /api/pdf` e `/api/compress` com WebP real ✅ 200.
  3. **Gap de M6 fechado (achado da revisão):** arquivo com cabeçalho/signature válidos mas corpo truncado falhava em `embedImage` → 500 genérico. `embedImage` agora está em `try/catch` → 400 com o nome do arquivo, completando o objetivo do M6 ("conteúdo corrompido → 400 com nome").

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `bun run lint` | ✅ |
| `bun run typecheck` | ✅ (exit 0) |
| `bun run test` | ✅ 49 passed (antes 38; +11 novos: AVIF 24/32 bytes, brands `avis`/`mif1`, ftyp ausente, brand desconhecido, WebP RIFF válido/sem marker/sem header, `validatePdfFileSignature` com/sem nome) |
| `bun run build` | ✅ rotas: `/` (estática), `/_not-found`, `/api/compress`, `/api/pdf`, `/robots.txt`, `/sitemap.xml` |
| `GET /` | ✅ 200 — HTML SSR com shell estático; chunks do PDF separados (lazy) |
| `GET /robots.txt` · `GET /sitemap.xml` | ✅ 200 |
| `POST /api/compress` (PNG → webp) | ✅ 200 `{success:true}` |
| `POST /api/compress` (AVIF → webp) | ✅ 200 — confirma o fix da assinatura AVIF end-to-end |
| `POST /api/compress` (arquivo 11 MB) | ✅ 400 `"Arquivo muito grande. Máximo: 10MB"` |
| `POST /api/pdf` (2 imagens, A4, "relatorio final.pdf") | ✅ 200 — `pageCount: 2`, `filename: "relatorio_final.pdf"` |
| `POST /api/pdf` (AVIF, original) | ✅ 200 — AVIF aceito no fluxo PDF |
| `POST /api/pdf` (WebP + PNG, A4) | ✅ 200 — `pageCount: 2` (WebP aceito após correção da assinatura) |
| `POST /api/compress` (WebP → webp) | ✅ 200 — assinatura WebP corrigida também no fluxo de compressão |
| `POST /api/pdf` (PNG truncado — header válido, corpo cortado) | ✅ 400 `"Não foi possível ler a imagem \"corrupt.png\"..."` (antes: 500 genérico) |
| `POST /api/pdf` (MIME falsificado: texto com `type=image/png`) | ✅ 400 `"fake.png: Arquivo inválido..."` — nome do arquivo na resposta |
| `POST /api/pdf` (`type=text/plain`) | ✅ 400 `"Formato não suportado: text/plain..."` |

**Resumo:** página convertida a RSC com client islands e modo PDF lazy (M3), rota PDF endurecida com validação de assinatura por arquivo + `pageCount` real + fix de AVIF (M6) e CI com lint/typecheck/test/build (M7). Nenhuma regressão nos dois fluxos principais. **Fase 3 concluída — base pronta para a Fase 4.**

---

## 4️⃣ Fase 4 — Polimento (concluída em 07/08/2026)

> Escopo: M4 (ARIA de teclado) → M5 (decisão do dark mode) → itens baixos (L2 env de URL, L10 viewport/OG image, L3 pdf-lib, L8 README), mais L4/L6/L7 e o `.nvmrc` pendente da Etapa 0.

### ✅ Execução

| Item | Problema | Solução aplicada | Arquivos |
|---|---|---|---|
| **M4** | `role="tab"/"tablist"` sem navegação por setas e `role="radio"` em `<button>` sem roving tabindex (viola o padrão ARIA e WCAG 2.1.1/2.4.7) | Tabs do `ToolSwitcher` → **segmented control** com `aria-pressed` (decisão documentada); radiogroups de formato e de tamanho de página → **`<input type="radio">` nativos** estilizados, via novo componente genérico `RadioGroup` (setas/foco/seleção nativos do browser + `fieldset`/`legend` como nome acessível) | `tool-switcher.widget.tsx`, `radio-group.ui.tsx` (novo), `format-selector.widget.tsx`, `pdf-generator.widget.tsx`, `components/ui/index.ts` |
| **L6** | `RangeSlider`: `{...props}` vinha **depois** dos `aria-*` e sobrescrevia `aria-label`/`aria-valuetext` derivados | `{...props}` movido para **antes** dos atributos derivados (derivados passam a vencer) | `range-slider.ui.tsx` |
| **L7** | `<span aria-label>` em elemento não-interativo não anuncia em todos os SRs | Texto `sr-only` ("Ordem N") + número visível com `aria-hidden` | `pdf-generator.widget.tsx` |
| **M5** | Dark mode declarado (`prefers-color-scheme`) mas UI 100% clara — "colagem" de blocos brancos em tema escuro | **Decisão do usuário (opção a): remover o bloco dark e assumir tema claro**; `themeColor` = `#ffffff` no `viewport` | `globals.css`, `layout.tsx` |
| **L2** | `metadataBase`/OG url/robots/sitemap com URL hardcoded (troca de domínio exige editar código) | `SITE_URL` central em `src/lib/site-url.ts` (`NEXT_PUBLIC_SITE_URL` com fallback e strip de `/`); `robots.txt` estático → `robots.ts` gerado; `.env.example` versionado (`!.env.example` no `.gitignore`) | `site-url.ts` (novo), `layout.tsx`, `robots.ts` (novo, substitui `robots.txt`), `sitemap.ts`, `.env.example` (novo), `.gitignore` |
| **L10** | Sem `viewport`/`themeColor` e sem OG image | `export const viewport` com `themeColor`; `opengraph-image.tsx` + `twitter-image.tsx` via `next/og` `ImageResponse` com componente compartilhado `OgImage` (PNG 1200×630 gerado em build time) | `layout.tsx`, `opengraph-image.tsx` (novo), `twitter-image.tsx` (novo), `og-image.ui.tsx` (novo) |
| **L4** | `quality` não afeta PNG (lossless) — slider parecia "sem efeito" | Decisão: manter `compressionLevel: 9` (qualidade é irrelevante em PNG full-color) + hint no UI quando `format === "png"` | `quality-control.widget.tsx` |
| **L8** | README desatualizado (estrutura, Node 18+, sem scripts/CI/PDF) | Árvore do projeto atualizada (EN+PT), Node 20.9+, seção "Quality Checks", features de PDF/CI na stack | `README.md` |
| **Etapa 0 · nota 5** | Runtime Node fixado em `engines` mas sem `.nvmrc` | `.nvmrc` criado com `20` (alinhado a `engines: >=20.9.0`) | `.nvmrc` (novo) |

### 📌 Notas e decisões

1. **M4 — segmented control no lugar do tab pattern:** o plano oferecia (a) padrão completo de tabs (setas + `aria-controls`/`tabpanel`) ou (b) segmented control com `aria-pressed`. Optamos por **(b)** por ser a alternativa mais simples e robusta: são 2 modos que alternam o conteúdo inteiro (não painéis coexistentes), os botões permanecem em tab order natural (Enter/espaço ativam) e `aria-pressed` anuncia o estado de seleção — atendendo WCAG 2.1.1 e 2.4.7 sem o custo de roving tabindex.
2. **M4 — radios nativos:** `role="radio"` em `<button>` virou `<input type="radio">` real. Navegação por setas, foco e estado `checked` passam a ser nativos do browser. O `RadioGroup` é genérico (`<T extends string>`) e cobre os dois usos (formato e tamanho de página) sem duplicar estilos; nome acessível vem do `legend`, descrição opcional via `aria-describedby`.
3. **M4 — foco visível nos radios:** input `sr-only` (permanece focusable) + `peer-focus-visible:ring-*` no label estilizado → o anel de foco aparece no "botão" visual ao navegar por teclado.
4. **M5 — decisão registrada (usuário):** removido o bloco `@media (prefers-color-scheme: dark)`; tema claro único. Consequência documentada: a app não acompanha o tema do sistema. `themeColor` = `#ffffff` coerente com o tema.
5. **L2 — env sem exposição ao cliente:** `SITE_URL` é lido apenas em módulos server (metadata do layout, `robots.ts`, `sitemap.ts`) — nenhum bundle client o importa. Troca de domínio = definir `NEXT_PUBLIC_SITE_URL` na plataforma de deploy.
6. **L10 — OG image sem asset binário:** gerada com `next/og` em build time (rota estática `/opengraph-image`). PNG 1200×630 validado (`file`) e `og:image`/`twitter:image` absolutizados via `metadataBase`.
7. **L3 — pdf-lib (reavaliação formal):** decisão da Etapa 0 **mantida** — congelar `1.17.1`. Nenhum requisito novo de PDF surgiu; o caso de uso (merge de imagens em páginas PDF) segue atendido e foi revalidado nesta fase. Nenhuma ação de código.
8. **L9 — `calculateFit`:** documentado como **aceitável**. `Math.min(...)` preserva proporção e contém a imagem na página (contrato de "fit"). Imagens panorâmicas extremas podem renderizar finas, mas capar a escala desvirtuaria o ajuste. Nenhuma mudança.
9. **L5 — nomenclatura `.ui.tsx`/`.widget.tsx`:** **mantida** por decisão. O sufixo é redundante com a pasta, porém o padrão é consistente na codebase e renomear ~12 arquivos + imports geraria churn sem ganho funcional. Registrado como débito estético aceito.
10. **Teste novo:** `site-url.test.ts` (+2) cobre fallback e strip de barra — utilidade nova com lógica de env ganhou cobertura imediata (M7).
11. **Pós-revisão — OG image self-contained:** `next/og` busca emojis Twemoji em um CDN público durante o build; em CI sem rede (ou CDN fora do ar) a imagem deixaria de renderizar e quebraria o build. O emoji 🖼️ foi substituído por um `<svg>` inline (satori renderiza SVG nativamente), removendo a dependência de rede — PNG 1200×630 revalidado.
12. **Pós-revisão — env em build time:** `.env.example` agora deixa explícito que `NEXT_PUBLIC_SITE_URL` é lida em **build time** (as rotas são geradas estaticamente), alinhado ao fluxo de deploy do Netlify.

### 🔍 Revisão de código (resultado da Fase 4)

- Revisão automatizada sobre o diff da Fase 4. **BLOCKER: nenhum.** Confirmações: build gera `/robots.txt` (via `robots.ts`), `/sitemap.xml`, `/opengraph-image` e `/twitter-image`; HTML renderiza `theme-color` + `og:image`/`twitter:image` absolutos; nenhum `role="tab"/"radio"/"radiogroup"` restante em `src/`; seletores granulares (M1) preservados nos widgets alterados; ordem `{...props}`/`aria-*` correta no RangeSlider; toasts e fluxos intactos.
- Ajustes aplicados pós-revisão:
  1. **Teste `site-url` adicionado** — comportamento de env documentado por teste, não só por comentário.
  2. **`robots.txt` removido do repo** — confirmado que nada referencia o arquivo estático; as rotas passam a usar o `robots.ts`.
  3. **README** — além da árvore, Node 18+ → 20.9+ e nova seção "Quality Checks".

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `bun run lint` | ✅ |
| `bun run typecheck` | ✅ (exit 0) |
| `bun run test` | ✅ 51 passed (antes 49; +2 `site-url`) |
| `bun run build` | ✅ rotas: `/`, `/_not-found`, `/api/compress`, `/api/pdf`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/twitter-image` |
| `GET /` | ✅ 200 — `<meta name="theme-color">` presente; `og:image`/`twitter:image` absolutos |
| `GET /robots.txt` | ✅ 200 — conteúdo idêntico ao anterior, agora via env |
| `GET /sitemap.xml` | ✅ 200 |
| `GET /opengraph-image` | ✅ 200 `image/png` — PNG 1200×630 válido |
| `GET /twitter-image` | ✅ 200 `image/png` |
| `POST /api/compress` (PNG → webp) | ✅ 200 `{success:true}` |
| `POST /api/compress` (arquivo 11 MB) | ✅ 400 `"Arquivo muito grande. Máximo: 10MB"` |
| `POST /api/pdf` (2 imagens, A4, "relatorio final.pdf") | ✅ 200 — `pageCount: 2`, `filename: "relatorio_final.pdf"` |
| `POST /api/pdf` (AVIF, original) | ✅ 200 |
| `POST /api/pdf` (MIME falsificado) | ✅ 400 `"fake.png: Arquivo inválido..."` — nome na resposta |

**Resumo:** M4 concluído (segmented control com `aria-pressed` + radios nativos; L6/L7), M5 decidido e aplicado (tema claro), L2 (URL via env) e L10 (viewport + OG/Twitter image) implementados, decisões formais registradas (L3 pdf-lib congelado; L9 aceitável; L5 mantido), README e `.nvmrc` atualizados. Nenhuma regressão nos dois fluxos principais. **Fase 4 concluída — roadmap do plano executado integralmente.**

---

## 5️⃣ Follow-ups pós-Fase 4 — fechamento dos itens pendentes (concluído em 07/08/2026)

> Escopo: reavaliar os majors adiados na Etapa 0 (TS 7 e ESLint 10) com a rede de testes ativa · definir o runtime de produção e alinhar `@types/node` · corrigir o flicker do drag (Fase 2, nota 5) · implementar o rate limiting apontado na auditoria. Não faz parte do roadmap original — fecha os resíduos deixados por decisão ou promessa.

### ✅ Execução

| Item | Situação | Execução realizada | Resultado |
|---|---|---|---|
| **TS 7.0.2 (major, Corsa)** | Adiado na Etapa 0: "reavaliar quando o CI (M7) existir" | Upgrade **real** tentado com o CI ativo: `typescript@7.0.2` instalado → `typecheck` ✅, `test` 57/57 ✅, `build` ✅ | ❌ **Mantido em 5.9.3 — blocker externo no lint.** `@typescript-eslint/typescript-estree` quebra com TS 7 (`Cannot read properties of undefined (reading 'Cjs')`); o peer do `@typescript-eslint/parser@8.66.0` (mais recente) é `typescript: '>=4.8.4 <6.1.0'` — o ecossistema de lint ainda não suporta TS 7 |
| **ESLint 10.8.0 (major)** | Adiado na Etapa 0: "reavaliar junto do TS 7 na Fase 3/4" | Upgrade **real** tentado: `eslint@10.8.0` instalado (com TS 5.9.3 o `typescript-estree` carrega) | ❌ **Mantido em 9.39.5 — blocker externo no lint.** `eslint-plugin-react@7.37.5` (mais recente, core do lint do Next) falha com `contextOrFilename.getFilename is not a function`; o peer dele é `eslint: '^3…^9.7'` — plugin ainda não suporta ESLint 10 |
| **`@types/node` 26.x** | Adiado: "revisitar quando o runtime de produção for definido" | Runtime de produção **definido: Node 22** (LTS de manutenção, alinhado ao ambiente v22.20.0). `.nvmrc` 20→**22**; `@types/node` 20.19.43→**22.20.1** (major 22 = runtime) | ✅ Fechado. Major 26.x **descartado** (não alinhado ao runtime). `engines` mantido `>=20.9.0` (mínimo) |
| **Flicker do `dragleave`** (Fase 2 nota 5) | Reavaliar na Fase 4 "se necessário" | Corrigido: `useFileDropzone` usa contador de profundidade `dragenter`/`dragleave` (`dragDepthRef`) — passar o mouse sobre filhos (preview/texto) não desliga mais o highlight; reset no `drop`. `onDragEnter` ligado no `FileDropzone` | ✅ Resolvido |
| **Rate limiting** (risco da auditoria) | Sem rate limiting nas rotas | Novo `src/lib/rate-limit.ts`: limiter de janela deslizante em memória por IP (padrão **30 req/min**), `RateLimitExceeded` → **429 + header `Retry-After`**, `getClientIp` (`x-forwarded-for` → `x-real-ip` → "unknown"). Aplicado no início de `POST /api/compress` e `POST /api/pdf` (orçamento combinado por IP) + **6 testes** de unidade | ✅ Implementado. Limitação documentada: em serverless (Netlify) o estado é por instância de função — proteção global exige rate limit na plataforma |

### 📌 Notas e decisões

1. **A condição da Etapa 0 foi cumprida e superada.** O "NÃO atualizar sem rede de testes (M7)" era para proteger contra major sem rede de segurança; com o CI ativo rodamos os dois upgrades de verdade e chegamos a blockers **externos** (tooling de lint), não da codebase. TS 7 compila, testa e builda a aplicação.
2. **TS 7 ⏸️ (com evidência).** Reavaliação: quando `@typescript-eslint` publicar peer com suporte a TS 7 (hoje `<6.1.0`), repetir o teste daqui (o código já é compatível).
3. **ESLint 10 ⏸️ (com evidência).** Reavaliação: quando `eslint-plugin-react` publicar suporte a ESLint 10 (hoje `^9.7`), repetir o teste.
4. **TypeScript pinado em `5.9.3` (exato)** no `package.json` (antes `^5`): intencional, para impedir que um `install` futuro resolva o major 7 sem revisão explícita (lembrar do blocker acima).
5. **Runtime de produção = Node 22 (LTS)** fecha o item "revisitar quando o runtime de produção for definido". O Netlify seleciona a versão pelo `.nvmrc`.
6. **Rate limit compartilhado entre rotas:** em dev (single process) é orçamento combinado por IP para os dois endpoints; no Netlify cada rota é uma função com estado de memória próprio (efetivamente por rota/instância). Best-effort por design — documentado como mitigação, não como substituição de rate limit na plataforma.
7. **Flicker:** correção clássica de contador de profundidade de drag; a limitação pré-existente documentada na Fase 2 deixa de existir.

### 🔍 Revisão de código (resultado)

- Revisão automatizada sobre o diff. **BLOCKER: nenhum.** Confirmações: `RateLimitExceeded` tratado antes de `ValidationError`/`PdfError` nas duas rotas (429 com `Retry-After` não é mascarado); contador de drag com `Math.max(0, …)` evita estado negativo; testes do limiter determinísticos (fake timers + janela real); pin do TS e range `^9` do ESLint coerentes com as decisões; nenhuma referência órfã a `@types/node@20`/`.nvmrc` 20.
- Ajustes aplicados pós-revisão: limpeza do bucket na poda de timestamps em `createRateLimiter` — quando a lista zera após o filtro de janela, a entrada é removida do Map (evita manter buckets vazios; libera a entrada quando expira). A revisão formal final é do usuário.

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `bun run lint` | ✅ (ESLint 9.39.5) |
| `bun run typecheck` | ✅ (TS 5.9.3) |
| `bun run test` | ✅ 57 passed (antes 51; +6 `rate-limit`) |
| `bun run build` | ✅ rotas: `/`, `/_not-found`, `/api/compress`, `/api/pdf`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/twitter-image` |
| `GET /` | ✅ 200 |
| `POST /api/compress` (PNG → webp) | ✅ 200 `{success:true}`, `img1.webp` |
| `POST /api/compress` (PNG → avif) | ✅ 200 |
| `POST /api/compress` (31ª req na janela) | ✅ **429** + `Retry-After: 47` (rate limit) |
| `POST /api/pdf` (2 imagens, A4, "relatorio final") | ✅ 200 — `pageCount: 2`, `relatorio_final.pdf` |
| TS 7.0.2 (tentativa de upgrade) | typecheck/test/build ✅ · **lint ❌** (blocker `typescript-estree`) |
| ESLint 10.8.0 (tentativa de upgrade) | **lint ❌** (blocker `eslint-plugin-react`) |

**Resumo:** os dois majors adiados na Etapa 0 foram **reavaliados com upgrade real e evidência** — mantidos em TS 5.9.3 e ESLint 9.39.5 por blockers externos de tooling (com critério de reavaliação registrado); runtime de produção definido (Node 22) com `@types/node` alinhado; flicker do drag corrigido; rate limiting implementado (429 + `Retry-After`, 6 testes). Nenhuma regressão nos dois fluxos principais. **Follow-ups concluídos — todos os itens pendentes/encerrados do plano fechados.**

---

## 🗺️ Roadmap de implementação (ordem otimizada)

**Etapa 0 — Dependências em dia (pré-requisito, ~1 h)** ✅ *concluída em 06/08/2026 — ver seção "Etapa 0" acima*
`npm outdated` → atualizar patches/minors (Next 16.3, React 19.2.8, sharp 0.35, zustand, tailwind 4.3) → avaliar majors (TS 7/eslint 10) com a rede de testes do M7 → decisão documentada sobre o `pdf-lib` (L3). Concluir antes de iniciar qualquer Fase. **Estado final:** minors/patches aplicados e validados; majors adiados (TS 7, ESLint 10, @types/node 26); `pdf-lib` congelado com reavaliação na Fase 4.

**Fase 1 — Correções de bugs e Quick Wins (½ dia)** ✅ *concluída em 06/08/2026 — ver seção "Fase 1" acima*
H1 (loading travado) → H4 (dead code) → H3 (extração de utilitários) → M8 + demais Quick Wins (sizes/preload, type=button, sitemap, check 10MB, error.tsx). **Estado final:** H1/H4/H3 resolvidos; M8 e os 5 Quick Wins aplicados e validados; nenhuma mudança estrutural antecipada.

**Fase 2 — Fundações (1–2 dias)** ✅ *concluída em 06/08/2026 — ver seção "Fase 2" acima*
H2/H3 (módulo `constants.ts` + tipos compartilhados) → M2 (dropzone controlado + hook `useFileDropzone`) → M1 (seletores + `dragActive` local). *Testes: adicionar Vitest e cobrir `formatBytes`, validadores e utilidades antes das mudanças estruturais.* **Estado final:** constantes/tipos/validadores centralizados em `src/lib/constants.ts`, `src/lib/types.ts`, `src/lib/validation.ts`; dropzone controlado via `useFileDropzone`; seletores granulares em todos os widgets; Vitest com 38 testes (M7 parcial).

**Fase 3 — Arquitetura (2–3 dias)** ✅ *concluída em 06/08/2026 — ver seção "Fase 3" acima*
M3 (page RSC + `ToolSwitcher` + `next/dynamic` do PDF) → M6 (magic bytes na rota PDF + `pageCount` correto + `error.tsx`/`loading.tsx`) → M7 (CI: lint + tsc + test + build). **Estado final:** página convertida a RSC com client islands e modo PDF lazy; rota PDF com validação de assinatura por arquivo (400 com nome), `pageCount` real e fix de assinatura AVIF; CI com `lint + typecheck + test + build` no GitHub Actions; 46 testes Vitest.

**Fase 4 — Polimento (1–2 dias)** ✅ *concluída em 07/08/2026 — ver seção "Fase 4" acima*
M4 (ARIA de teclado para tabs/radios) → M5 (decisão e correção do dark mode) → Itens baixos (env de URL, viewport/OG image, avaliação do pdf-lib, atualização do README). **Estado final:** M4 com segmented control `aria-pressed` + `RadioGroup` de inputs nativos (L6/L7 corrigidos); M5 com tema claro decidido pelo usuário; `NEXT_PUBLIC_SITE_URL` (L2) e viewport/OG image (L10) implementados; decisões registradas (L3 pdf-lib congelado, L9 aceitável, L5 mantido); README e `.nvmrc` atualizados; 51 testes Vitest. **Roadmap 100% executado.**

**Follow-ups pós-Fase 4** ✅ *concluído em 07/08/2026 — ver seção "Follow-ups" acima*
Fechamento dos resíduos: majors TS 7 / ESLint 10 reavaliados com upgrade real (mantidos por blockers externos de tooling, com critério de reavaliação); runtime de produção definido (Node 22 LTS) com `@types/node` alinhado; flicker do drag corrigido; rate limiting implementado (429 + `Retry-After`, 6 testes). **Estado final:** todos os itens pendentes/encerrados do plano fechados; 57 testes Vitest.

**Ordem racional:** corrigir o que quebra primeiro (Fase 1, esforço mínimo/retorno máximo), depois unificar regras e desacoplar (Fase 2, evita que a refatoração da Fase 3 duplique o esforço de atualização de constantes), depois arquitetura e CI (Fase 3), por fim acessibilidade e cosmética (Fase 4).

---

## 🎨 Roadmap de Modernização de UI (`UI-PLAN.md`) — em andamento desde 07/08/2026

> Novo roadmap, separado do plano técnico acima. Escopo: **modernizar a UI mantendo business logic, contratos de API, funcionalidades, stack (Next.js, TypeScript, Tailwind) — sem adicionar dependências**. Mobile-first. Cada fase é executada, validada e documentada aqui antes de avançar (workflow exigido pelo usuário). Conversa e documentação em **pt-BR**.

## 1️⃣ Fase 1 — Foundation (concluída em 07/08/2026)

> Escopo do `UI-PLAN.md` (Fase 1): revisar a config Tailwind, identificar design tokens existentes, estabelecer convenções de espaçamento/tipografia, cores semânticas, comportamento de container e breakpoints responsivos. Sem mudança estrutural de componentes.

### ✅ Execução

| Item | Situação | Solução aplicada | Arquivos |
|---|---|---|---|
| **Revisão da config Tailwind** | Tailwind v4 CSS-first: **não há `tailwind.config`**; tema via `@theme`/CSS. Breakpoints default v4 confirmados: sm 40rem, md 48rem, lg 64rem, xl 80rem, 2xl 96rem | Mantida a abordagem CSS-first; nenhum arquivo de config criado. Decisão: tokens via `@theme inline` para expor utilitários semânticos a partir de variáveis `:root` | `src/app/globals.css` |
| **🐛 Bug de tipografia** | `body { font-family: Arial }` sobrescrevia a Geist (app renderizava com Arial apesar da fonte Next carregada) | `body` passa a usar `var(--font-geist-sans, Arial, Helvetica, sans-serif)` — fallback Arial apenas se a fonte não carregar | `src/app/globals.css` |
| **Tokens de cor semânticos** | Componentes usavam cores hardcoded (`zinc-*`, `blue-*`, `green-*`) em todo o app — sem linguagem visual comum | Bloco `:root` com 20 variáveis semânticas (background, foreground, surface, surface-muted, border, border-strong, text, text-muted, text-subtle, primary + hover/active/foreground/muted, success, warning, error + muted, focus) + `@theme inline` mapeando para `--color-*` → utilitários `bg-surface`, `text-text-muted`, `border-border`, `bg-primary`, etc. | `src/app/globals.css` |
| **Container centralizado** | `page.tsx` (`max-w-4xl px-4 py-8`), `layout.tsx` header/footer e `error.tsx` duplicavam o padrão de container | Classe de componente `.container-app` em `@layer components`: `max-width: var(--container-max)` (**56rem**, preserva o `max-w-4xl` atual) + `margin-inline: auto` + `padding-inline: 1rem` (→ `1.5rem` em sm+). Padrão único para as próximas fases | `src/app/globals.css` |
| **Breakpoints** | Sem definição explícita de breakpoints | **Decisão:** usar os defaults do Tailwind v4 (sm 40rem / md 48rem / lg 64rem / xl 80rem / 2xl 96rem) — valores coerentes com o layout atual; nenhuma customização necessária. Documentado como convenção | — |
| **Fonte padrão** | Geist carregada via `next/font` mas `--font-sans` não apontava para ela (parte do bug de tipografia) | `--font-sans: var(--font-geist-sans)` e `--font-mono: var(--font-geist-mono)` no `@theme inline` — utilitários `font-sans`/`font-mono` agora usam as fontes do `next/font` | `src/app/globals.css` |

### 📌 Notas e decisões

1. **`@theme inline` vs `@theme`:** usamos `inline` porque os valores já vivem em `:root` (estratégia de tokens do Tailwind v4). O Tailwind **não emite** as variáveis `--color-*` no CSS final até um utilitário semântico ser usado — verificamos no build atual que o `@layer theme` só contém a paleta default (zinc/blue/green/red) usada pelos componentes. Os utilitários semânticos (`bg-primary`, etc.) **ainda não aparecem** porque nenhum componente os usa — adoção incremental nas Fases 3–4 os fará ser emitidos.
2. **Paleta derivada da atual, não inventada:** `primary` = `blue-600` (#2563eb, cor de ação atual), `success` = `green-600`, `warning` = `amber-600`, `error` = `red-600`, surfaces = branco/zinc. Mesma linguagem visual, agora com nomes semânticos. Isso garante que a migração das próximas fases **não altera a aparência atual** (contraste preservado).
3. **Container `56rem` ≠ `max-w-4xl`?** `max-w-4xl` = 56rem. Ou seja, `.container-app` **preserva exatamente** a largura atual — a migração é drop-in sem mudança visual. Definido via `--container-max` para permitir ajuste centralizado futuro.
4. **Convenções registradas para as próximas fases:** espaçamento pela escala padrão do Tailwind (`--spacing`), sem valores arbitrários; tipografia nos níveis existentes (base/lg/xl/3xl/4xl) com pesos medium/semibold/bold; `:focus-visible` para foco de teclado; **sem dark mode** (decisão da Fase 4 técnica mantida — tema claro único).
5. **Nenhuma mudança estrutural nesta fase** (shell, header, footer, widgets, cards) — escopo das Fases 2–4.

### 🔍 Verificação pós-build

- **Tokens `:root` confirmados no CSS final** (`--background`, `--primary`, `--container-max`, etc. presentes).
- **`.container-app` emitido** em `@layer components` com `padding-inline: 1.5rem` no breakpoint `40rem` — corretamente compilado.
- **Fonte:** `<html>` carrega a classe de variável da Geist (`geist_*__variable`) e o `body` referencia `var(--font-geist-sans)` — bug da Arial corrigido de ponta a ponta.
- **`--color-*` semânticos NÃO emitidos** até utilitário ser usado (comportamento esperado do tree-shaking do Tailwind v4; ver nota 1).

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `npm run lint` | ✅ |
| `npx tsc --noEmit` | ✅ (exit 0) |
| `npm test` | ✅ 57 passed (6 arquivos) |
| `npm run build` | ✅ rotas: `/` (estática), `/_not-found`, `/api/compress`, `/api/pdf`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/twitter-image` |
| `GET /` (server de produção) | ✅ 200 — CSS final contém tokens, `.container-app` e fonte Geist correta |

**Resumo:** fundação de design estabelecida — tokens semânticos (cores + container) com paleta derivada da atual (zero mudança visual), bug da fonte Geist corrigido, breakpoints default documentados como convenção. Nenhuma regressão funcional. **Fase 1 concluída — base pronta para a Fase 2 (Application Shell).**

### Próximos passos (Fase 2 — Application Shell)

1. Refatorar header e footer inline do `layout.tsx` para `components/layout/header.tsx` / `footer.tsx`.
2. Migrar os containers duplicados (`page.tsx`, `layout.tsx`, `error.tsx`) para `.container-app`.
3. Melhorar o ritmo vertical global (espaçamento entre header/main/footer).

---

## 2️⃣ Fase 2 — Application Shell (concluída em 07/08/2026)

> Escopo do `UI-PLAN.md` (Fase 2): refatorar header, refatorar main container, refatorar footer e melhorar o ritmo vertical global. Migrar o shell inteiro para os tokens semânticos e `.container-app` da Fase 1. Sem mudança estrutural em widgets (Fase 3).

### ✅ Execução

| Item | Situação | Solução aplicada | Arquivos |
|---|---|---|---|
| **Header extraído** | Header inline no `layout.tsx`: emoji 🖼️, cores hardcoded `zinc-*`, container duplicado `max-w-4xl px-4` | Novo `components/layout/header.tsx` (**Server Component**): ícone de imagem SVG substituindo o emoji, tile arredondado `bg-primary text-primary-foreground`, título `text-lg sm:text-xl` (tracking-tight) + subtítulo `text-sm`, tokens semânticos (`border-border`, `bg-surface`, `text-text`, `text-text-muted`) e `container-app` | `src/components/layout/header.tsx` (novo) |
| **Footer extraído** | Footer inline no `layout.tsx` com `role="contentinfo"` redundante e cores hardcoded | Novo `components/layout/footer.tsx` (**Server Component**): autor + redes sociais com `aria-label` acessíveis (mantidos), ícones `h-5 w-5` consistentes, foco `focus-visible:ring-focus`, tokens semânticos e empilhamento responsivo `flex-col ... sm:flex-row sm:justify-between` | `src/components/layout/footer.tsx` (novo) |
| **Barrel `layout`** | — | `components/layout/index.ts` exportando `Header`/`Footer` (padrão de barrel da codebase) | `src/components/layout/index.ts` (novo) |
| **`layout.tsx` enxuto** | 4 componentes inline + constantes de links no root layout | Restam apenas metadata, fonts, `SkipLink`, `Toaster` e imports de `Header`/`Footer` — **−135 linhas** | `src/app/layout.tsx` |
| **Containers unificados** | `page.tsx`, `error.tsx` e `loading.tsx` duplicavam `mx-auto max-w-4xl px-4` | Todos passam a usar `.container-app` (padding inline 1rem → 1.5rem em sm+, max-width 56rem via `--container-max`) | `page.tsx`, `error.tsx`, `loading.tsx` |
| **Ritmo vertical global** | `page.tsx` com `py-8` fixo; `loading.tsx` **sem padding** (skeleton colava no header) | Padrão de ritmo `py-6 sm:py-10` no conteúdo do `main` (mobile mais compacto, desktop mais respirável); header `py-4` e footer `py-6` preservados (shell leve) | `page.tsx`, `loading.tsx` |
| **Tokens no shell restante** | `SkipLink` e skeleton do loading com cores hardcoded (`bg-blue-600`, `bg-zinc-100`) | SkipLink: `bg-primary`/`text-primary-foreground`/`ring-focus`; skeleton: `border-border`/`bg-surface-muted` | `layout.tsx`, `loading.tsx` |

### 📌 Notas e decisões

1. **Header/Footer são Server Components** — nenhum JS de cliente adicionado ao shell; princípios RSC do Next.js preservados.
2. **Emoji → SVG:** o `🖼️` do header foi substituído por um ícone de imagem inline (`aria-hidden`, herda `currentColor`). Emoji varia por sistema operacional e não acompanha cor; o SVG fica consistente sobre o tile `bg-primary`.
3. **Paleta 1:1 preservada (zero mudança visual):** `text-text` = antigo `text-zinc-900`; `text-text-muted` = `text-zinc-600`; `border-border` = `border-zinc-200`; `bg-surface` = `bg-white`; `text-primary` = `text-blue-600`; `hover:text-primary-hover` = `hover:text-blue-700`; `ring-focus` = `ring-blue-500`.
4. **`focus-visible` no lugar de `focus`:** links do autor e das redes sociais exibem o anel de foco **apenas na navegação por teclado** (mouse não mostra ring) — convenção registrada na Fase 1 + WCAG 2.4.7. O `SkipLink` mantém `focus:` porque só existe no estado de foco.
5. **`role="contentinfo"` removido:** `<footer>` em escopo raiz já tem papel implícito `contentinfo`; o atributo era redundante.
6. **Padding do container muda sutilmente:** `page.tsx` migrou de `px-4` fixo para `.container-app` (1rem mobile → **1.5rem em ≥40rem**). Largura máxima preservada (56rem = `max-w-4xl`). Respiro lateral ligeiramente maior em telas médias — intencional e alinhado ao sistema.
7. **`loading.tsx` corrigido (bonus de consistência):** o skeleton estava sem padding e colava no header; agora usa `.container-app py-6 sm:py-10` (mesmo ritmo da página) e cores semânticas.
8. **Nenhuma mudança funcional:** business logic, APIs, widgets, stores e toasts intocados — escopo das Fases 3–4 do UI-PLAN.

### 🔍 Verificação pós-build

- **Utilities semânticas emitidas no CSS final** (`@theme inline`): `bg-surface`, `text-text-muted`, `border-border`, `bg-primary`, `ring-focus` (→ `var(--focus)`) e `.container-app` com `padding-inline: 1rem`/`1.5rem` e `max-width: var(--container-max)`.
- **HTML servido:** `<header class="border-b border-border bg-surface">` com ícone SVG, título e subtítulo; `<footer>` com os 3 links sociais e `aria-label` acessíveis; **nenhum emoji 🖼️** restante no header.
- Fonte Geist aplicada (herdada da Fase 1).

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `bun run lint` | ✅ |
| `bun run typecheck` | ✅ (exit 0) |
| `bun run test` | ✅ 57 passed (6 arquivos) |
| `bun run build` | ✅ rotas: `/`, `/_not-found`, `/api/compress`, `/api/pdf`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/twitter-image` |
| `GET /` (server de produção) | ✅ 200 — header/footer com tokens semânticos, `container-app`, ícone SVG, sem emoji |
| `POST /api/compress` (PNG → webp, q80) | ✅ 200 `{success:true}` |
| `POST /api/pdf` (1 imagem, A4, "relatorio final") | ✅ 200 — `pageCount: 1`, `relatorio_final.pdf` |

**Resumo:** shell refatorado e desacoplado — Header/Footer extraídos para `components/layout/` como Server Components (‑135 linhas no `layout.tsx`), containers unificados em `.container-app`, ritmo vertical padronizado (`py-6 sm:py-10`) e todo o shell migrado para os tokens semânticos da Fase 1 com paleta preservada 1:1. Nenhuma regressão funcional. **Fase 2 concluída — base pronta para a Fase 3 (Core Workspace).**

---

## 3️⃣ Fase 3 — Core Workspace (concluída em 07/08/2026)

> Escopo do `UI-PLAN.md` (Fase 3): redesenhar o mode switcher, o dropzone, o painel de resultado, migrar os widgets do workspace para os tokens semânticos e melhorar o layout desktop/mobile (duas colunas ↔ coluna única). Sem mudança de business logic, contratos de API ou stack.

### ✅ Execução

| Item | Situação | Solução aplicada | Arquivos |
|---|---|---|---|
| **Mode switcher** | Botões `Compressor/PDF` com `border-zinc-300`, ativo `bg-blue-600` bruto; foco `focus:ring` (mostra anel no clique do mouse) | **Segmented control** moderno: track `rounded-xl border border-border bg-surface-muted p-1 gap-1`, botões `rounded-lg` com `flex-1`; ativo `bg-primary text-primary-foreground shadow-sm`, inativo `text-text-muted hover:bg-surface hover:text-text`; foco **só por teclado** `focus-visible:ring-2 ring-focus ring-offset-1`; `aria-pressed` e `fieldset/legend sr-only` preservados; touch targets `py-2.5` mantidos | `tool-switcher.widget.tsx` |
| **FileDropzone** | Emoji 📁, cores `zinc-*`, sem estado de erro inline, hover só na borda | Redesign completo: ícone de upload SVG em tile `bg-primary-muted text-primary` (hover → `bg-primary text-primary-foreground`), hierarquia vazio ("Arraste uma imagem aqui" / "ou clique para selecionar" / hint de formatos `JPG • PNG • WEBP • AVIF`), estados **drag** (`border-primary bg-primary-muted`), **hover** (mesmo tratamento do drag), **selected** (preview com overlay "Trocar imagem" no hover/foco) e **error** (nova prop `error`, ícone X + mensagem inline com `role="alert"` + `aria-describedby`). Emoji removido | `file-dropzone.widget.tsx` |
| **Painel de resultado** | Empty state genérico "Resultado aparecerá aqui"; stats sem badge de formato; `div`s semânticos | Novo componente genérico **`EmptyState`** (ícone + título + descrição) reutilizado no compressor e no PDF; `ImagePreview` com container `border border-border`; `CompressionResultCard` com **badge do formato de saída**, **`dl/dt/dd`** semânticos, cores semânticas e botão de download com ícone; `PdfDownloadCard` com ícone de documento, filename truncado, stats `dl` e botão com ícone | `empty-state.ui.tsx` (novo), `image-preview.widget.tsx`, `compression-result-card.widget.tsx`, `pdf-download-card.widget.tsx` |
| **Layout desktop/mobile** | Settings (arquivo/qualidade/formato) e CTA dentro da coluna esquerda; resultado por último no mobile | Estrutura do `UI-PLAN.md §2`: **Workspace** (upload \| resultado, `grid gap-6 lg:grid-cols-2 lg:items-start`) → **Card de settings** (`space-y-5` com arquivo+qualidade+formato) → **CTA full-width** `size="lg"`. No mobile a ordem vira upload → resultado → settings → ação (conceito do plano); no desktop, resultado sempre visível ao lado do upload | `compress-mode.widget.tsx` |
| **Widgets de settings** | `CompressionSettings`/`QualityControl` renderizavam cada um seu próprio `Card` | Passaram a ser **conteúdo** (sem wrapper); o `Card` de settings é composto no `CompressMode` — um único bloco coeso com dividers (`border-b border-border` no arquivo) | `compression-settings.widget.tsx`, `quality-control.widget.tsx`, `compress-mode.widget.tsx` |
| **Modo PDF** | `PdfMode` era um wrapper de layout; settings e botão dentro da coluna; botões de reordenar/remover **invisíveis em touch** (hover-only) | `PdfGenerator` virou **layout owner** (mesma estrutura do compressor: workspace → settings → CTA); `pdf-mode.widget.tsx` **removido**; `dynamic()` no `ToolSwitcher` aponta para `PdfGenerator`; botões dos thumbnails agora sempre visíveis no mobile (`lg:opacity-0 lg:group-hover:opacity-100` + `focus-within`), antes impossíveis de acionar em telas touch | `pdf-generator.widget.tsx`, `pdf-mode.widget.tsx` (deletado), `tool-switcher.widget.tsx` |
| **Primitivos de UI → tokens** | `Card`/`Button`/`Badge`/`RadioGroup`/`RangeSlider` com `zinc-*`/`blue-*`/`green-*` hardcoded e **sem foco visível** no Button | `Card`: `border border-border bg-surface shadow-sm` (superfícies do UI-PLAN §10); `Button`: variantes semânticas (`bg-primary hover:bg-primary-hover active:bg-primary-active`, `bg-success`, `text-error`, etc.), `inline-flex items-center justify-center gap-2`, **`focus-visible:ring-focus`** e `disabled:opacity-50`; `Badge`: tokens com `-strong` (mesma cor de antes); `RadioGroup`: chips `border bg-surface` com seleção `bg-primary`; `RangeSlider`: `accent-primary` e valor em badge `bg-primary-muted text-primary-strong` | `card.ui.tsx`, `button.ui.tsx`, `badge.ui.tsx`, `radio-group.ui.tsx`, `range-slider.ui.tsx` |
| **Tokens novos** | Faltavam cores "fortes" para contraste em badges/textos | `--primary-strong` (#1e40af = blue-800), `--success-strong` (#166534 = green-800), `--error-strong` (#991b1b = red-800) + mapeamento no `@theme inline` — cores idênticas às usadas antes, agora com nomes semânticos | `globals.css` |
| **Ícones compartilhados** | SVGs inline duplicados nos widgets; emojis no dropzone | Novo `icons.ui.tsx` (Upload, Download, Image, Document, Check, X, ChevronUp/Down) — SVG stroke `currentColor`, `aria-hidden` — exportados pelo barrel `ui` | `icons.ui.tsx` (novo), `ui/index.ts` |

### 📌 Notas e decisões

1. **Layout segue o conceito do plano (§2):** Workspace (upload \| resultado) → Compression Settings → Primary Action. No mobile a ordem é exatamente upload → resultado → quality → format → ação; no desktop, resultado fica fixo ao lado do upload com `lg:items-start` (as alturas casam porque dropzone e empty state usam o mesmo `h-56 sm:h-64`).
2. **Emoji → SVG em todo o workspace:** 📁 (dropzone) e 📄 (PDF) foram substituídos por ícones em `icons.ui.tsx`. Emoji varia por OS e não acompanha cor; SVG herda `currentColor` e fica consistente sobre os tiles coloridos.
3. **`EmptyState` genérico:** ícone em tile `bg-surface-muted`, título `font-medium`, descrição `text-sm text-text-muted`. Reutilizado em dois pontos (compressor e PDF) com alturas iguais às do dropzone — coluna de resultado nunca "quebra" o grid.
4. **Erro inline no dropzone:** prop `error` opcional; além do toast, exibe mensagem inline com `role="alert"` (anuncia em SR) e `aria-describedby` ligando o hint ao erro. O estado é limpo ao selecionar um arquivo válido **e ao remover o arquivo** (`onRemove`); a prioridade de render é `error → preview → default`, então a mensagem sempre aparece quando setada. `aria-invalid` no container foi descartado (role button não suporta — warning do eslint jsx-a11y).
5. **Foco por teclado em todo o workspace:** `focus-visible` (não `focus`) em todos os controles interativos — anel azul `ring-focus` só aparece na navegação por teclado (WCAG 2.4.7), convenção da Fase 1. O `Button` não tinha foco visível antes; agora tem.
6. **Botões dos thumbnails do PDF corrigidos para touch:** o antigo `opacity-0 group-hover:opacity-100` tornava os botões de mover/remover **inacessíveis em telas touch** (não existe hover). Agora `lg:opacity-0 lg:group-hover:opacity-100` + `focus-within:opacity-100` — visíveis no mobile, hover-only no desktop. Melhoria de usabilidade mobile exigida pelo plano.
7. **`PdfMode` removido:** era um wrapper que só compunha layout; a responsabilidade foi absorvida pelo `PdfGenerator` (que agora é o layout owner do modo PDF, espelhando o `CompressMode`). O `dynamic()` do `ToolSwitcher` aponta para `PdfGenerator` — o lazy loading do chunk do PDF é preservado.
8. **Tokens `-strong` novos (derivados da paleta):** `blue-800`/`green-800`/`red-800` eram usados como texto de badges; viraram `--primary-strong`/`--success-strong`/`--error-strong`. Zero mudança de cor — apenas semântica. O `Badge` default ganhou `border border-border` para funcionar sobre superfícies.
9. **`Card` agora tem borda:** `border border-border bg-surface shadow-sm` (antes só `bg-white shadow-sm`). Mudança visual sutil e intencional (UI-PLAN §10: `rounded-xl border bg-white shadow-sm`), aplicada ao sistema inteiro.
10. **Paleta 1:1 preservada:** todas as cores migraram para os tokens equivalentes da Fase 1 (ex.: `text-zinc-900`→`text-text`, `text-zinc-600`→`text-text-muted`, `text-green-700`→`text-success-strong`, `bg-blue-100`→`bg-primary-muted`). Nenhuma cor nova introduzida além dos tokens `-strong` derivados.
11. **Nenhuma mudança de lógica:** stores, hooks, rotas e contratos de API intocados; widgets continuam lendo por seletores granulares (M1 da fase técnica preservada). Única alteração de comportamento: o erro inline do dropzone (feedback adicional ao toast existente) e a visibilidade dos botões dos thumbnails em touch.
12. **Variáveis semânticas emitidas no build:** `bg-primary`, `border-border`, `text-text-muted`, `bg-primary-muted`, `ring-focus`, `bg-error-muted`, `text-success-strong`, etc. passaram a aparecer no CSS final (tree-shaking do Tailwind v4 agora encontra utilitários usados).

### 🔍 Verificação pós-build

- **SSR confirmado:** `GET /` entrega segmented control (track `bg-surface-muted`, 2 botões `aria-pressed`), dropzone com ícone de upload e hint de formatos, `EmptyState` com "Seu resultado aparecerá aqui / Envie uma imagem e inicie a compressão..." e RadioGroup de formato com chips `border bg-surface`.
- **Nenhuma classe `zinc-*`/`blue-*`/`green-*`/`red-*` restante em `src/**/*.tsx`** (grep limpo) — todo o workspace e primitivos de UI migrados para tokens.
- **Chunk do PDF preservado:** o modo PDF continua lazy (PdfGenerator via `dynamic`), com fallback de loading em tokens.

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `bun run lint` | ✅ |
| `bun run typecheck` | ✅ (exit 0) |
| `bun run test` | ✅ 57 passed (6 arquivos) |
| `bun run build` | ✅ rotas: `/`, `/_not-found`, `/api/compress`, `/api/pdf`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/twitter-image` |
| `GET /` (server de produção) | ✅ 200 — segmented control, dropzone, empty states, radio chips com tokens; sem emojis 📁/📄 |
| `POST /api/compress` (PNG → webp, q80) | ✅ 200 `{success:true}` (354 B → 98 B, ratio 72.3%) |
| `POST /api/pdf` (PNG + WebP, A4) | ✅ 200 — PDF válido (`%PDF-`) |

**Resumo:** workspace redesenhado por completo — mode switcher vira segmented control com foco visível, dropzone ganha estados (drag/hover/selected/error) e ícone SVG, painel de resultado com `EmptyState` significativo + badge de formato, estrutura de layout alinhada ao conceito do plano (workspace → settings → CTA) em ambos os modos, e todo o workspace + primitivos de UI migrados para os tokens semânticos da Fase 1. Botões dos thumbnails do PDF agora funcionam em touch. Nenhuma regressão funcional. **Fase 3 concluída — base pronta para a Fase 4 (Controls).**

#### Iteração pós-revisão (achados do review)

Revisão automatizada sobre o diff da Fase 3 (commit `16715b5`). **BLOCKER: nenhum.** Três achados corrigidos:

1. **🐛 Erro inline do dropzone inalcançável quando havia preview (moderate):** a prioridade de render era `preview → error → default`; em modo compress, soltar um arquivo inválido sobre uma imagem já selecionada setava o erro **sem limpar o preview**, então a mensagem inline nova ficava morta exatamente no caso para o qual foi criada. Além disso, `handleRemove` não limpava o erro — um erro obsoleto só aparecia **depois** de remover o arquivo (comportamento invertido). **Correção:** a prioridade virou `error → preview → default` (o erro sempre renderiza quando setado) e `CompressionSettings` recebeu `onRemove` opcional chamado em `handleRemove`, que limpa o `dropzoneError` no `CompressMode`. Caminho alternativo via `useEffect` foi descartado (violava `react-hooks/set-state-in-effect` do React Compiler). | `file-dropzone.widget.tsx`, `compress-mode.widget.tsx`, `compression-settings.widget.tsx`
2. **🐛 `size="sm"` ignorado em `danger`/`ghost` (low):** o `Button` excluía `danger`/`ghost` do `sizeStyles`; o novo botão "Remover" (ícone + texto, `variant="danger" size="sm"`) renderizava **sem padding** e "Limpar todas" (`ghost size="sm"`) idem. **Correção:** `size` passou a aplicar a todas as variantes. | `button.ui.tsx`
3. **💅 Fallback de loading com coluna vazia (nit):** o fallback do `dynamic()` mantinha `lg:grid-cols-2` com um único filho — metade direita em branco no desktop enquanto o chunk do PDF carregava. **Correção:** segunda célula skeleton espelhando o layout real. | `tool-switcher.widget.tsx`

**Revalidação pós-ajustes:** `bun run lint` ✅ · `bun run typecheck` ✅ · `bun run test` ✅ 57/57 · `bun run build` ✅.

### Próximos passos (Fase 4 — Controls)

1. Revisar o quality slider (`RangeSlider`) — track/thumb custom, estados e keyboard support já nativos; avaliar toque fino do thumb.
2. Revisar o format selector (`RadioGroup`) — estados disabled e consistência dos chips.
3. Redesenhar a primary CTA — spinner no loading, estados success/error.
4. Implementar estados de interação consistentes (loading/success/error) em todos os controles.

---

## 4️⃣ Fase 4 — Controls (concluída em 07/08/2026)

> Escopo do `UI-PLAN.md` (Fase 4): redesenhar o quality slider (§7), o output format selector (§8) e a primary CTA (§9), implementando estados de interação consistentes (loading/success/error/disabled). Sem mudança de business logic, contratos de API ou stack.

### ✅ Execução

| Item | Situação | Solução aplicada | Arquivos |
|---|---|---|---|
| **Quality slider** | `RangeSlider` usava o `<input type="range">` nativo com `accent-primary` — track fino e thumb pequeno dependente do browser, sem linguagem visual própria | **Track/thumb customizados** via classe `.range-input` em `@layer components`: track de 6px `rounded-full` com **preenchimento progressivo** (`--fill` calculado no componente → gradiente `primary → border` no WebKit, `::-moz-range-progress` no Firefox), thumb de 20px `bg-primary` com borda `3px` da surface e sombra sutil, hover → `--primary-hover`, active → `--primary-active`, **foco por teclado** com anel duplo `--surface` + `--focus` (sem anel no mouse), `prefers-reduced-motion` desliga a transição do thumb. Label + badge do valor em `bg-primary-muted` preservados; `aria-valuemin/max/now/text` derivados mantidos | `range-slider.ui.tsx`, `globals.css` |
| **Format selector** | Chips com label minúsculo (`jpeg`), layout `flex` fixo (4 chips esticados em linha podiam apertar a 320px) e **sem estado disabled** | Labels em **maiúsculas** (`JPEG`/`PNG`/`WEBP`/`AVIF` — UI-PLAN §8); layout responsivo via **grid `grid-cols-2 sm:grid-cols-4`** (2×2 no mobile, 4 em coluna a partir de 640px); **prop `disabled`** no `RadioGroup` — inputs nativos desabilitados, chips com `peer-disabled:opacity-50` + `cursor-not-allowed` e hover suprimido com `peer-enabled:hover:*` (hover só quando habilitado). Format selector **desabilita durante o loading** (impede trocar formato no meio da compressão) | `radio-group.ui.tsx`, `format-selector.widget.tsx` |
| **Primary CTA (compressão)** | Botão mostrava só texto "Comprimindo..." no loading; **sem feedback de sucesso no botão** (dependia só do toast + result card) | **Spinner SVG** (`SpinnerIcon`, arco `stroke-dasharray` com `motion-safe:animate-spin` — não gira com `prefers-reduced-motion`) ao lado de "Comprimindo..."; **estado de sucesso transitório** "✓ Imagem Comprimida" por 2,5s após sucesso; `aria-busy={loading}` no botão (SR anuncia processamento). Hooks retornam `boolean` (`true` só em sucesso) para orquestrar o estado transitório | `icons.ui.tsx` (novo `SpinnerIcon`), `use-image-compression.ts`, `compress-mode.widget.tsx` |
| **Primary CTA (PDF)** | Mesmo padrão do compressor | Spinner em "Gerando PDF...", sucesso transitório "✓ PDF Gerado" por 2,5s, `aria-busy`; `RadioGroup` do tamanho de página **desabilitado durante `isLoading`** | `use-pdf-generation.ts`, `pdf-generator.widget.tsx` |
| **Estados consistentes** | Disabled/Carregando/Sucesso eram tratados de forma diferente entre os controles | Padrão único nos dois fluxos: CTA com loading (spinner + texto) → success transitório → idle; controles desabilitados enquanto processam; erro já tratado por toast + erro inline do dropzone (Fase 3) | `compress-mode.widget.tsx`, `pdf-generator.widget.tsx` |

### 📌 Notas e decisões

1. **`--fill` calculado no componente:** o `RangeSlider` calcula `((value - min) / (max - min)) * 100` e o injeta como variável CSS `--fill`. O WebKit usa um `linear-gradient` sobre o track (parte preenchida em `primary`, resto em `border`); o Firefox usa `::-moz-range-progress` nativo. Resultado idêntico nos dois engines, zero JS extra.
2. **Thumb 20px + track 6px:** mantém o `input` com `height: 1.5rem` (área de toque ≥ 24px dentro do componente; o `py-3` do label e o `mb-2` preservam o conforto de toque do bloco). O `margin-top` do thumb WebKit é `calc((0.375rem - 1.25rem) / 2)` para centralizá-lo no track.
3. **Foco do slider só por teclado:** o anel `:focus-visible` estiliza o thumb (anel duplo surface + `--focus`); clicar/arrastar não mostra anel — convenção de foco da Fase 1 (WCAG 2.4.7). O `:active` usa `--primary-active` para feedback de arrasto.
4. **Grid responsivo do formato:** `grid-cols-2 sm:grid-cols-4` (não `flex-wrap`) — decisão explícita: 4 chips em linha a 320px ficariam < 66px cada com `px-4 text-base` (apertado); em 2×2 os chips ficam confortáveis. A partir de `sm` (640px) os 4 cabem em linha. O `RadioGroup` do PDF (3 opções) mantém o layout flex default esticado.
5. **Disabled com `peer-enabled:hover`:** o hover dos chips era incondicional; com `disabled`, hover visual enganaria. Troquei para `peer-enabled:hover:*` (só aplica quando o input está habilitado) + `peer-disabled:opacity-50`/`cursor-not-allowed`. `fieldset` sem opacity extra (evita dimming duplo com o chip).
6. **`SpinnerIcon` respeita `prefers-reduced-motion`:** `motion-safe:animate-spin` só anima quando o usuário permite animação; em modo reduzido o spinner fica estático (o texto "Comprimindo.../Gerando PDF..." continua comunicando o estado).
7. **Sucesso transitório no CTA:** 2,5s com `setTimeout` guardado em `useRef` e limpo no unmount (`useEffect` cleanup) — sem vazamento. `actionState` volta a `idle` ao iniciar nova operação. O feedback de sucesso duplica propositalmente o toast + result card: o botão (foco do usuário) confirma o resultado sem exigir mover o olhar para o painel.
8. **Hooks retornam `Promise<boolean>`:** `compress`/`generate` agora retornam `true` apenas no sucesso (e `false` em erro/validação). Sem efeito colateral nos consumidores — só o `CompressMode`/`PdfGenerator` usam o retorno. `loading` continua resetado no `finally` (Fase 1 técnica).
9. **Nenhuma mudança de lógica:** stores, rotas, contratos de API, validações e testes intocados. Mudanças de comportamento: labels do formato em maiúsculas, controles desabilitados durante o processamento e feedback visual de sucesso no CTA.

### 🔍 Verificação pós-build

- **CSS final contém** `.range-input` completo (track WebKit+Firefox, thumb, hover/active, `:focus-visible`, `prefers-reduced-motion`) e o `motion-safe:animate-spin` emitido pelo `SpinnerIcon`.
- **SSR do `/`:** slider renderiza `class="range-input w-full"` com `style="--fill:77.7…%"` e `aria-valuetext="80%"`; chips do formato em `JPEG/PNG/WEBP/AVIF` com `grid grid-cols-2 gap-2 sm:grid-cols-4`; CTA com `aria-busy="false"` (loading false no SSR).
- Nenhuma classe de cor hardcoded nova; tudo via tokens semânticos.

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `bun run lint` | ✅ |
| `bun run typecheck` | ✅ (exit 0) |
| `bun run test` | ✅ 57 passed (6 arquivos) |
| `bun run build` | ✅ rotas: `/`, `/_not-found`, `/api/compress`, `/api/pdf`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/twitter-image` |
| `GET /` (server de produção) | ✅ 200 — slider customizado com `--fill`, chips em maiúsculas com grid responsivo, `aria-busy="false"` |
| `POST /api/compress` (PNG → webp, q80) | ✅ 200 `{success:true}` |
| `POST /api/compress` (PNG → png, lossless) | ✅ 200 `{success:true}` |
| `POST /api/pdf` (1 imagem, A4, "relatorio final") | ✅ 200 — PDF válido (`%PDF-`) |

**Resumo:** controls redesenhados e com estados consistentes — slider com track/thumb customizado e preenchimento progressivo (§7), format selector com labels em maiúsculas, grid responsivo 2×2→4 e estado disabled durante o processamento (§8), e primary CTA com spinner (que respeita `prefers-reduced-motion`), sucesso transitório "✓" e `aria-busy` (§9), nos dois fluxos. Nenhuma regressão funcional. **Fase 4 concluída — base pronta para a Fase 5 (UX States).**

### Próximos passos (Fase 5 — UX States)

1. Auditar os estados existentes: empty, hover, focus, dragging, selected, loading, success, error, disabled — em todos os componentes.
2. Fechar lacunas (ex.: hover/focus consistentes no result card, feedback de sucesso do download, estados do PDF thumbs já tratados na Fase 3).
3. Validar coerência visual entre os dois modos (compressão e PDF).

---

## 5️⃣ Fase 5 — UX States (concluída em 07/08/2026)

> Escopo do `UI-PLAN.md` (Fase 5): implementar estados polished de empty, hover, focus, dragging, selected, loading, success, error e disabled. Auditoria dos estados já implementados nas Fases 3–4 + fechamento das lacunas remanescentes. Sem mudança de business logic, contratos de API ou stack.

### ✅ Auditoria de estados (cobertura pós-Fase 4)

| Estado | Cobertura | Componentes |
|---|---|---|
| **Empty** | ✅ Completo | `EmptyState` (resultado do compressor e do PDF), dropzone default, resultado vazio |
| **Hover** | ✅ Completo | Botões, chips de formato, dropzone, thumb do slider, links do header/footer, thumbs do PDF (desktop), "Trocar imagem" |
| **Focus** | ✅ Completo | `focus-visible` (anel `ring-focus`) em todos os controles interativos — só teclado (WCAG 2.4.7) |
| **Dragging** | ✅ Completo | `dragActive` do dropzone (border/track `primary`), contador de profundidade (sem flicker) |
| **Selected** | ✅ Completo | Preview + overlay "Trocar imagem", row do arquivo (`CompressionSettings`), chip checked do formato/página, CTA success |
| **Loading** | ✅ Completo | CTA com spinner, controles desabilitados (slider, formato, página), skeleton do route loading, fallback lazy do PDF |
| **Success** | ✅ Completo | CTA transitório "✓", toast, result cards, `Badge` de redução/PDF |
| **Error** | ✅ Completo | Erro inline do dropzone (`role="alert"`), toasts com mensagem real do servidor, `error.tsx` com retry |
| **Disabled** | ✅ Completo | `Button` (`disabled:opacity-50`), chips `peer-disabled`, slider `:disabled`, thumbs `disabled:opacity-30` |

### ✅ Execução (lacunas fechadas)

| Item | Situação | Solução aplicada | Arquivos |
|---|---|---|---|
| **`prefers-reduced-motion` global** | Transições (`transition-colors`/`transition-opacity`) e `animate-pulse` rodavam incondicionalmente em ~18 lugares mesmo com "reduzir movimento" ativo | Bloco global `@media (prefers-reduced-motion: reduce)` que reduz animações e transições para ~0.01ms (padrão da comunidade — cobre toda a árvore sem variante por componente) | `globals.css` |
| **Skeletons respeitam reduced-motion** | `animate-pulse` do `loading.tsx` e do fallback lazy do PDF animava sem checagem | `motion-safe:animate-pulse` (explicito; já garantido pelo bloco global) | `loading.tsx`, `tool-switcher.widget.tsx` |
| **Feedback de sucesso do CTA mais forte** | Estado success transitório da Fase 4 mantinha o botão azul (`primary`) — o "✓" mudava só o texto | CTA passa a `variant="success"` (fundo verde `--success`) durante os 2,5s de sucesso, com `transition-colors` suavizando a troca; retorna a `primary` ao voltar ao idle | `compress-mode.widget.tsx`, `pdf-generator.widget.tsx` |
| **Qualidade desabilitada durante o loading** | `FormatSelector` e página do PDF já desabilitavam durante o processamento (Fase 4), mas o slider de qualidade ainda ficava ativo | `disabled={loading}` no `RangeSlider` (usa o `:disabled` customizado do `.range-input` — opacity 0.5 + `not-allowed`) — consistência total dos settings | `quality-control.widget.tsx` |

### 📌 Notas e decisões

1. **Abordagem global vs variantes:** a auditoria mostrou ~18 ocorrências de `transition-*`/`animate-pulse`. Aplicar `motion-safe:`/`motion-reduce:` em cada uma geraria churn e é frágil (novos componentes esqueceriam). O bloco global `prefers-reduced-motion: reduce` é a prática recomendada e cobre todo o DOM. As variantes `motion-safe:` existentes no spinner e skeletons ficam como intenção explícita (redundante com o global, mas inofensivo).
2. **CTA verde transitório:** decisão alinhada ao UI-PLAN §9 ("Success: provide appropriate feedback"). O `Button` já tinha a variante `success`; a mudança é só de cor, sem layout shift. Em modo reduzido, o `transition-colors` fica instantâneo (bloco global) — o estado ainda é comunicado pela cor e pelo texto.
3. **Slider disabled:** o CSS `.range-input:disabled` existia desde a Fase 4 (opacity + `cursor-not-allowed`), mas nenhum consumidor o usava. Agora o `QualityControl` o utiliza durante o processamento — mesma política dos demais settings.
4. **Estado de erro no CTA:** mantido via toast (mensagem real do servidor) + erro inline do dropzone — sem estado de erro dedicado no botão (evita ruído; o botão volta a `idle` imediatamente após falha). Decisão documentada.
5. **Resultado obsoleto em falha de re-compressão:** se uma nova compressão falhar, o `compressed` anterior permanece (não é limpo em erro). Intencional — evita perder um bom resultado por uma falha transitória; o toast comunica o erro.
6. **Nenhuma mudança de lógica:** stores, hooks, rotas, contratos e testes intocados.

### 🔍 Verificação pós-build

- **CSS final:** bloco `prefers-reduced-motion: reduce` presente; `motion-safe:animate-pulse` e `motion-safe:animate-spin` compilados dentro de `@media (prefers-reduced-motion: no-preference)`; `.range-input:disabled` presente.
- **SSR do `/`:** CTA renderiza com `variant` primary (idle no SSR, `aria-busy="false"`); slider sem `disabled` no SSR (loading false); nada de verde no estado inicial.

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `bun run lint` | ✅ |
| `bun run typecheck` | ✅ (exit 0) |
| `bun run test` | ✅ 57 passed (6 arquivos) |
| `bun run build` | ✅ rotas: `/`, `/_not-found`, `/api/compress`, `/api/pdf`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/twitter-image` |
| `GET /` (server de produção) | ✅ 200 — reduced-motion global e `motion-safe` no CSS, SSR íntegro |
| `POST /api/compress` (PNG → webp) | ✅ 200 `{success:true}` |
| `POST /api/pdf` (1 imagem, A4) | ✅ 200 — PDF válido (`%PDF-`) |

**Resumo:** auditoria dos 9 estados do UI-PLAN confirmou cobertura quase total nas Fases 3–4; lacunas fechadas — `prefers-reduced-motion` global (transições e animações respeitam a preferência do usuário em toda a árvore), skeletons com `motion-safe:animate-pulse`, feedback de sucesso verde transitório no CTA e slider de qualidade desabilitado durante o processamento (consistência total dos settings). Nenhuma regressão funcional. **Fase 5 concluída — base pronta para a Fase 6 (Accessibility).**

## 6️⃣ Fase 6 — Accessibility (concluída em 07/08/2026)

> Escopo do `UI-PLAN.md` (Fase 6): auditoria e correção de acessibilidade — navegação por teclado, suporte a screen reader (labels, anúncios, landmarks), contraste de cor (WCAG 2.2 AA) e tamanho de alvos de toque/clique. Sem mudança de business logic, contratos de API ou stack.

### ✅ Auditoria (teclado + SR + semântica — cobertura pré-existente)

| Item | Situação | Onde |
|---|---|---|
| **Skip link + foco programático** | ✅ Skip link "Pular para o conteúdo principal" (foco via teclado, `focus:not-sr-only`) aponta para `<main id="main-content" tabIndex={-1}>` | `layout.tsx` |
| **Landmarks e `lang`** | ✅ `<header>` (com `<h1>`), `<main>`, `<footer>`, `<nav aria-label="Redes sociais">`; `html lang="pt-BR"` | `layout.tsx`, `header.tsx`, `footer.tsx` |
| **Toggle de ferramenta** | ✅ `fieldset`/`legend sr-only`, `aria-pressed` nos dois botões | `tool-switcher.widget.tsx` |
| **Dropzone** | ✅ `role="button"` + `tabIndex={0}` + `aria-label` + `aria-describedby` (hint/erro), Enter/Espaço aciona o input; `<input type="file">` com `aria-hidden` e `hidden` (fora do tab order) | `file-dropzone.widget.tsx` |
| **Radios** | ✅ inputs `sr-only` navegáveis, foco visível via `peer-focus-visible` no chip, `aria-describedby` do hint | `radio-group.ui.tsx`, `format-selector.widget.tsx`, `pdf-generator.widget.tsx` |
| **Slider** | ✅ `label htmlFor`, `aria-valuemin/max/now/text` (texto formatado "80%"), foco visível no thumb | `range-slider.ui.tsx` |
| **Anúncios** | ✅ `role="alert"` no erro inline; `aria-busy` nos CTAs; toasts de sucesso/erro (Sonner) com `role="status"`; `Badge` de ordem com `sr-only` + `aria-hidden` no número | dropzone, CTAs, `pdf-generator.widget.tsx` |
| **Dados** | ✅ `<dl>/<dt>/<dd>` nos result cards; `<ul>` com `aria-label` nos thumbs do PDF; controles dos thumbs com `aria-label` e `focus-within:opacity-100` (visíveis via teclado no desktop) | `compression-result-card.widget.tsx`, `pdf-download-card.widget.tsx`, `pdf-generator.widget.tsx` |
| **Foco visível** | ✅ `focus-visible` (anel `ring-focus`) em todos os controles interativos — só teclado (WCAG 2.4.7) | componentes `ui` |
| **Reduced motion** | ✅ Bloco global `prefers-reduced-motion` (Fase 5) | `globals.css` |

### ✅ Execução (correções aplicadas)

| Item | Achado | Taxa | Solução aplicada | Arquivos |
|---|---|---|---|---|
| **Contraste do botão success (texto branco)** | `--success: #16a34a` (green-600) como fundo com texto branco | **3.30:1 ✗** (< 4.5) | Token escurecido para `--success: #15803d` (green-700) | **5.01:1 ✓** | `globals.css` |
| **Hover do botão success** | `hover:bg-success/90` (opacidade sobre fundo branco) | **3.63:1 ✗** no hover | Hover sólido `hover:bg-success-strong` (#166534) | **7.09:1 ✓** | `button.ui.tsx` |
| **Erro inline do dropzone** | `text-error` (#dc2626) sobre `bg-error-muted` (#fee2e2) — texto `text-sm` e ícone | **3.92:1 ✗** | `text-error-strong` (#991b1b) no ícone e na mensagem | **6.79:1 ✓** | `file-dropzone.widget.tsx` |
| **Botão danger (Remover)** | `text-error` — default sobre branco 4.79 ✓, mas **hover** sobre `bg-error-muted` | **3.92:1 ✗** no hover | `text-error-strong` (default 8.30:1 ✓, hover 6.79:1 ✓) | **✓** | `button.ui.tsx` |
| **Target do thumb do slider** | Thumb de **20×20px** — WCAG 2.2 **2.5.8** exige ≥ **24×24** | ✗ | Thumb para **24×24px** (`1.5rem`; `margin-top` recalculado no webkit) | **✓** | `globals.css` |
| **Target dos links sociais** | Links do footer de **20×20px** (ícone sem padding) | ✗ (< 24) | `p-2` no link → alvo 36×36px | **✓** | `footer.tsx` |
| **Outline de headings** | Página com só `<h1>` (site); sem `<h2>` para cada ferramenta | — | `<h2 className="sr-only">` por ferramenta ("Ferramenta de compressão de imagens" / "Ferramenta de geração de PDF") — hierarquia h1→h2→legends | **✓** | `compress-mode.widget.tsx`, `pdf-generator.widget.tsx` |

### 📌 Notas e decisões

1. **Contraste de texto pequeno:** meta de **4.5:1** (WCAG 1.4.3 AA) para `text-sm`/`text-base` de botões e mensagens. O `text-error` (#dc2626) sobre branco (4.79:1) continua valendo onde não há `bg-error-muted` (apenas o ícone decorativo do PDF card mantém `text-error` sobre `error-muted` — 3.92:1, dentro do exigido de **3:1** para não-texto, critério 1.4.11).
2. **`text-text-subtle` (#71717a):** medido em 4.84:1 sobre branco e **4.63:1** sobre `bg-surface-muted` — **passa** 4.5:1 nos dois casos, então nenhuma mudança foi feita (evita achatar a hierarquia de texto). Cálculo confirmado por fórmula WCAG, não por estimativa.
3. **Verde do success:** `--success` agora é green-700 (#15803d) — passa AA com texto branco em qualquer estado. A variante `success` do `Button` (Baixar PDF/Baixar Imagem + CTA transitório) é a única consumidora do token; `success-muted`/`success-strong` (badges) não foram alterados.
4. **Targets de toque:** aplicado o mínimo **24×24px** (WCAG 2.2 2.5.8 AA). Chips de formato (~44px), botões (`py-2.5`~40px, `size=lg` ~48px) e dropzone já superavam. O thumb do slider foi o único controle abaixo do mínimo; os links sociais do footer ganharam `p-2` (20→36px).
5. **Headings `sr-only`:** sem mudança visual; melhora a navegação por SR (h1 site → h2 ferramenta → legends dos grupos de formulário). Coerente com o outline existente.
6. **Nenhuma mudança de lógica:** stores, hooks, rotas, contratos e testes intocados.

### 🔍 Verificação pós-build

- **CSS final:** `--success: #15803d`; thumb do slider `1.5rem` (webkit `margin-top: calc((0.375rem - 1.5rem) / 2)`); reduzido o hover para cor sólida (sem `/90`).
- **SSR do `/`:** h2 `sr-only` presente nas duas ferramentas; botões success ainda em estado idle (primary) no SSR.
- **Semântica:** outline h1→h2 em ambas as ferramentas; landmarks inalterados; nenhum controle perdeu `focus-visible`.

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `bun run lint` | ✅ |
| `bun run typecheck` | ✅ (exit 0) |
| `bun run test` | ✅ 57 passed (6 arquivos) |
| `bun run build` | ✅ rotas: `/`, `/_not-found`, `/api/compress`, `/api/pdf`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/twitter-image` |
| `GET /` (server de produção) | ✅ 200 — tokens e CSS corretos no bundle, SSR íntegro |
| `POST /api/compress` (PNG → webp, multipart) | ✅ 200 `{success:true}` |
| `POST /api/pdf` (1 imagem, A4, multipart) | ✅ 200 — PDF válido (`%PDF-`) |

**Resumo:** auditoria WCAG 2.2 AA — a maior parte já estava em conformidade (teclado, ARIA, landmarks, `aria-busy`/`role="alert"`, reduced motion). Corrigidos: contraste do botão success (3.30→5.01:1 e hover 7.09:1), erro inline do dropzone (3.92→6.79:1), hover do botão danger (3.92→6.79:1), target do thumb do slider (20→24px, 2.5.8), target dos links sociais do footer (20→36px) e outline de headings (h2 `sr-only` por ferramenta). `text-text-subtle` validado (4.63:1 sobre `surface-muted` — passa). Nenhuma regressão funcional. **Fase 6 concluída — base pronta para a Fase 7 (Responsive QA).**

## 7️⃣ Fase 7 — Responsive QA (concluída em 07/08/2026)

> Escopo do `UI-PLAN.md` (Fase 7): garantir que o layout se comporte corretamente em todos os breakpoints — 320 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920px. Auditoria estática do CSS utilitário (sem browser automation disponível no projeto) + correções pontuais de robustez no menor breakpoint. Sem mudança de business logic, contratos de API ou stack.

### ✅ Auditoria de breakpoints (320 → 1920px)

| Viewport | Largura de conteúdo (`container-app` 1rem/1.5rem) | Comportamento |
|---|---|---|
| **320** (iPhone SE 1ª geração) | 288px | ✅ Empilha tudo verticalmente; grades mínimas cabem (verificações abaixo) |
| **375 / 390 / 430** (iPhones atuais) | 343 / 358 / 398px | ✅ Mesmo comportamento do 320 com mais folga |
| **768** (tablet portrait) | 720px | ✅ `sm:` ativado — formatos em 4 col, thumbs em 3 col, footer em linha |
| **1024+** (desktop) | 896px (max 56rem) | ✅ Workspace em 2 colunas (`lg:grid-cols-2`), dropzone/result lado a lado |
| **1280 / 1440 / 1920** | 896px (centralizado) | ✅ Layout capping no `container-max` — sem esticar |

### ✅ Verificações por componente

| Componente | Breakpoints | Resultado |
|---|---|---|
| **`container-app`** | `1rem` mobile → `1.5rem` ≥40rem; `max-width: 56rem` | ✅ Sem overflow; padding consistente |
| **Header** | `min-w-0` no bloco de texto; `sm:text-xl` no título | ✅ Subtítulo quebra sem overflow |
| **`ModeToggle`** | `flex` + botões `flex-1` | ✅ "Compressor"/"PDF" cabem em 2×139px a 320px |
| **Workspace (compress + pdf)** | `grid gap-6 lg:grid-cols-2` | ✅ 1 col no mobile, 2 col ≥1024 (2×~436px) |
| **Dropzone** | `h-56 sm:h-64`; hint `text-[11px]` | ✅ Formatos (~130px) cabem no mobile; altura consistente com preview/empty |
| **`FormatSelector`** | `grid-cols-2 sm:grid-cols-4` | ✅ 2×140px a 320px; 4×206px ≥640 |
| **`CompressionResultCard`** | `grid-cols-3 gap-4` (fixo) | ✅ A 320px: 3 col de ~75px — "Comprimida" (≈62px @12px) e valores (≈62px @16px) cabem |
| **`PdfDownloadCard`** | `grid-cols-2 gap-4`; filename `truncate` | ✅ Folga em todas as larguras |
| **Thumbs do PDF** | `grid-cols-2 sm:grid-cols-3` | ✅ A 320px: tiles de ~138px > 88px de controles sobrepostos |
| **Controls dos thumbs** | `focus-within:opacity-100`; `lg:opacity-0 lg:group-hover:opacity-100` | ✅ Sempre visíveis no touch; visíveis via foco/hover no desktop |
| **`RadioGroup` page-size** | `flex flex-wrap gap-2`, chips `flex-1` | ✅ A 320px os 3 chips quebram em 2 linhas (sem overflow) |
| **`CompressionSettings`** | filename `truncate` + `min-w-0` | ✅ Nome longo corta com "…" — sem empurrar o botão |
| **CTAs** | `w-full` | ✅ Largura total em todos os breakpoints |
| **Footer** | `flex-col` → `sm:flex-row` | ✅ Empilhado/centralizado no mobile; em linha no ≥640 |
| **`loading.tsx` / fallback lazy** | `grid lg:grid-cols-2` | ✅ Empilha no mobile |

### ✅ Execução (correção aplicada)

| Item | Achado | Solução aplicada | Arquivo |
|---|---|---|---|
| **Linha "N imagens selecionadas (tamanho) / Limpar todas"** | `flex justify-between` sem wrap: a 320–430px o `<p>` encolhe no flex e quebra em 3 linhas ("20 imagens" / "selecionadas" / "(45.6 MB)"), deixando o botão sozinho na linha | `flex flex-wrap items-center justify-between gap-x-4 gap-y-2` — o botão desce para a segunda linha no mobile e o texto fica em uma linha única | `pdf-generator.widget.tsx` |

### 📌 Notas e decisões

1. **QA estático:** o projeto não tem browser automation (sem Playwright/Puppeteer — só Vitest), então a auditoria foi feita por revisão do CSS utilitário + cálculo de larguras (conteúdo do `container-app` vs. conteúdo mínimo de cada grade). Nenhum fix-width (`w-*` fixo) ou `whitespace-nowrap` foi encontrado — só `truncate`/`min-w-0` em containers flexíveis, o que elimina overflow horizontal estrutural.
2. **320px como piso:** largura mínima verificada é o conteúdo de 288px. Todos os elementos cabem no piso; grids de 2 col dão ~138–140px por tile/chip, e o `grid-cols-3` do result card é o caso mais justo (75px/col) mas ainda folgado.
3. **`flex-wrap` na linha de contagem:** única mudança da fase. Sem ela, a quebra de 3 linhas no `<p>` era funcionalmente ok mas esteticamente ruim; com o wrap o botão "Limpar todas" desce, o texto fica íntegro e o `gap-y-2` dá respiro.
4. **Nenhuma mudança de lógica:** stores, hooks, rotas, contratos e testes intocados (uma única classe utilitária alterada).

### 🔍 Verificação pós-build

- **CSS final:** `flex-wrap`/`gap-x-4`/`gap-y-2` compilados no bundle; nenhuma media query removida.
- **SSR do `/`:** markup íntegro; a linha de contagem só existe com `files.length > 0` (fora do SSR inicial).

### 🧪 Validação (regressão manual + checks estáticos)

| Checagem | Resultado |
|---|---|
| `bun run lint` | ✅ |
| `bun run typecheck` | ✅ (exit 0) |
| `bun run test` | ✅ 57 passed (6 arquivos) |
| `bun run build` | ✅ rotas: `/`, `/_not-found`, `/api/compress`, `/api/pdf`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, `/twitter-image` |

**Resumo:** auditoria responsiva 320→1920px — layout mobile-first já cobria todos os breakpoints (grades flexíveis, empilhamento vertical, `truncate`+`min-w-0`, capping em 896px). Corrigida a única falha de polish no piso de 320–430px: a linha de contagem de imagens + "Limpar todas" agora usa `flex-wrap`, evitando a quebra em 3 linhas. Nenhuma regressão funcional. **Fase 7 concluída — base pronta para a Fase 8 (Final Validation).**

### Próximos passos (Fase 8 — Final Validation)

1. Re-auditoria geral: CSS final, SSR, rotas estáticas/dinâmicas, contratos de API.
2. Regressão completa: lint, typecheck, testes (57), build e smoke do servidor de produção.
3. Checklist final do `UI-PLAN.md` (todas as 8 fases) e atualização do status das fases no `PLAN.md`.
