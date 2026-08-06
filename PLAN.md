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

1. **TypeScript 7.0.2 (major, tsgo) — ⏸️ adiado.** Upgrade sem rede de testes (M7) contraria o plano. Reavaliar na Fase 3, quando o CI (M7) existir.
2. **ESLint 10.8.0 (major) — ⏸️ adiado.** Compatível tecnicamente (peer `>=9.0.0` + flat config já em uso), mas é major sem testes. Reavaliar junto do TS 7 na Fase 3/4.
3. **`@types/node` 26.x (major) — ⏸️ adiado.** Runtime atual é Node 22. Mantido 20.x; revisitar quando o runtime de produção for definido.
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

## 🗺️ Roadmap de implementação (ordem otimizada)

**Etapa 0 — Dependências em dia (pré-requisito, ~1 h)** ✅ *concluída em 06/08/2026 — ver seção "Etapa 0" acima*
`npm outdated` → atualizar patches/minors (Next 16.3, React 19.2.8, sharp 0.35, zustand, tailwind 4.3) → avaliar majors (TS 7/eslint 10) com a rede de testes do M7 → decisão documentada sobre o `pdf-lib` (L3). Concluir antes de iniciar qualquer Fase. **Estado final:** minors/patches aplicados e validados; majors adiados (TS 7, ESLint 10, @types/node 26); `pdf-lib` congelado com reavaliação na Fase 4.

**Fase 1 — Correções de bugs e Quick Wins (½ dia)**
H1 (loading travado) → H4 (dead code) → H3 (extração de utilitários) → M8 + demais Quick Wins (sizes/preload, type=button, sitemap, check 10MB, error.tsx).

**Fase 2 — Fundações (1–2 dias)**
H2/H3 (módulo `constants.ts` + tipos compartilhados) → M2 (dropzone controlado + hook `useFileDropzone`) → M1 (seletores + `dragActive` local). *Testes: adicionar Vitest e cobrir `formatBytes`, validadores e utilidades antes das mudanças estruturais.*

**Fase 3 — Arquitetura (2–3 dias)**
M3 (page RSC + `ToolSwitcher` + `next/dynamic` do PDF) → M6 (magic bytes na rota PDF + `pageCount` correto + `error.tsx`) → M7 (CI: lint + tsc + test + build).

**Fase 4 — Polimento (1–2 dias)**
M4 (ARIA de teclado para tabs/radios) → M5 (decisão e correção do dark mode) → Itens baixos (env de URL, viewport/OG image, avaliação do pdf-lib, atualização do README).

**Ordem racional:** corrigir o que quebra primeiro (Fase 1, esforço mínimo/retorno máximo), depois unificar regras e desacoplar (Fase 2, evita que a refatoração da Fase 3 duplique o esforço de atualização de constantes), depois arquitetura e CI (Fase 3), por fim acessibilidade e cosmética (Fase 4).
