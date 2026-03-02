# 🎨 Smart Case Mate - Design System "Legal Premium"

> Sistema de design profissional para gestão jurídica de excelência

---

## 🎯 Filosofia de Design

**Conceito**: Modern Legal Excellence
**Tom**: Minimalismo sofisticado + luxo editorial + precisão suíça
**Diferencial**: Interface que parece uma revista jurídica premium, mas com interatividade moderna e fluida

### Princípios Fundamentais

1. **Hierarquia Clara** - Informação importante se destaca naturalmente
2. **Tipografia Expressiva** - Serif elegante + Sans moderna
3. **Cores Intencionais** - Paleta reduzida mas impactante
4. **Micro-interações Deliciosas** - Animações sutis mas memoráveis
5. **Profissionalismo Premium** - Cada detalhe comunica excelência

---

## 🔤 Tipografia

### Fontes

```css
/* Display / Títulos */
font-family: 'Playfair Display', Georgia, serif;

/* UI / Corpo de texto */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Números de processo / Código */
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

### Hierarquia de Títulos

| Elemento | Tamanho | Peso | Uso |
|----------|---------|------|-----|
| `h1` | 2rem - 2.5rem | 800 | Títulos de página principais |
| `h2` | 1.5rem - 2rem | 700 | Seções importantes |
| `h3` | 1.25rem - 1.5rem | 600 | Subtítulos e cards |
| `body` | 1rem | 400 | Texto padrão |
| `.process-number` | 0.875rem | 500 | Números de processo |

### Classes Tailwind

```jsx
<h1 className="font-display">Título Principal</h1>
<p className="font-sans">Texto do corpo</p>
<code className="font-mono">0000000-00.0000.0.00.0000</code>
```

---

## 🎨 Paleta de Cores

### Light Mode

| Token | HSL | Hex | Uso |
|-------|-----|-----|-----|
| `primary` | 221 83% 20% | #0A1E4A | Azul profundo advogado - Botões principais |
| `accent` | 43 74% 66% | #E8C468 | Dourado sutil - Destaques e ênfase |
| `success` | 142 76% 36% | #158F4E | Verde jurídico - Status positivos |
| `warning` | 38 92% 50% | #F59E0B | Amarelo - Alertas |
| `destructive` | 0 72% 51% | #DC2626 | Vermelho - Ações destrutivas |
| `background` | 0 0% 99% | #FCFCFC | Branco puro - Fundo |
| `foreground` | 222 47% 11% | #0F1419 | Quase preto - Texto principal |

### Dark Mode

| Token | HSL | Hex | Uso |
|-------|-----|-----|-----|
| `primary` | 43 74% 66% | #E8C468 | Dourado - Inverte para primário |
| `accent` | 221 83% 53% | #1E40AF | Azul claro - Inverte para accent |
| `background` | 222 47% 6% | #0A0D12 | Azul escuro profundo |
| `foreground` | 0 0% 98% | #FAFAFA | Branco quente |

### Sidebar Premium

**Light Mode**: Azul profundo (#0A1E4A) com accent dourado
**Dark Mode**: Azul escuro (#0D1117) com accent dourado

### Como Usar

```jsx
// Usando tokens CSS
<div className="bg-primary text-primary-foreground">
  Botão Principal
</div>

// Usando cores semânticas
<div className="bg-success/10 text-success border border-success/20">
  Status Aprovado
</div>
```

---

## 📏 Espaçamento e Grid

### Sistema de Espaçamento

```css
--spacing-unit: 0.5rem      /* 8px - Unidade base */
--spacing-content: 1.5rem   /* 24px - Conteúdo interno */
--spacing-section: 3rem     /* 48px - Entre seções */
```

### Grid System

- **Desktop**: 12 colunas, gap 24px
- **Tablet**: 8 colunas, gap 16px
- **Mobile**: 4 colunas, gap 12px

### Border Radius

```css
--radius: 0.75rem           /* 12px - Padrão */
rounded-sm: 8px
rounded-md: 10px
rounded-lg: 12px
rounded-xl: 16px
```

---

## 🎭 Componentes

### Card Premium

```jsx
<div className="card-premium">
  {/* Hover: lift + border glow */}
  Conteúdo do card
</div>
```

**Comportamento**:
- Hover: eleva -4px + sombra aumenta + borda accent
- Transição: 300ms ease

### Glassmorphism

```jsx
<div className="glass">
  {/* Fundo translúcido com blur */}
  Conteúdo com efeito vidro
</div>
```

### Badges de Status

```jsx
<span className="badge-success">Aprovado</span>
<span className="badge-warning">Pendente</span>
<span className="badge-destructive">Rejeitado</span>
<span className="badge-info">Em análise</span>
```

### Gradient Text

```jsx
<h1 className="gradient-text">
  {/* Gradiente animado primary → accent */}
  Texto com gradiente
</h1>
```

---

## ✨ Animações e Micro-interações

### Animações Disponíveis

| Classe | Efeito | Duração | Uso |
|--------|--------|---------|-----|
| `animate-fade-in` | Fade simples | 500ms | Entrada de elementos |
| `animate-slide-up` | Slide de baixo | 500ms | Cards, modais |
| `animate-scale-in` | Scale up | 300ms | Botões, ícones |
| `shimmer` | Loading shimmer | 1.5s loop | Skeleton screens |

### Hover Effects

```jsx
<div className="hover-lift">
  {/* Eleva -4px no hover */}
</div>

<div className="hover-glow">
  {/* Sombra glow primary no hover */}
</div>
```

### Framer Motion

```jsx
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.div variants={container} initial="hidden" animate="show">
  <motion.div variants={item}>Card 1</motion.div>
  <motion.div variants={item}>Card 2</motion.div>
</motion.div>
```

---

## 🎯 Padrões de Uso

### Dashboard

```jsx
<div className="space-y-8">
  {/* Header com Health Score glassmorphism */}
  <div className="glass p-6 rounded-xl">
    <h1 className="font-display">Dashboard</h1>
  </div>

  {/* Grid de cards com hover */}
  <div className="grid gap-6 md:grid-cols-2">
    <div className="card-premium p-6">
      <h3 className="font-display">Card Title</h3>
    </div>
  </div>
</div>
```

### Processos

```jsx
{/* Número de processo com monospace */}
<span className="process-number text-sm">
  0000000-00.0000.0.00.0000
</span>

{/* Status badge */}
<span className="badge-success">Em andamento</span>
```

### Sidebar

```jsx
{/* Active state com accent dourado */}
<Link className={cn(
  "nav-item",
  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
)}>
  Dashboard
</Link>
```

---

## 📱 Responsividade

### Breakpoints

```js
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1400px' // Extra large
```

### Mobile First

```jsx
{/* Mobile: stack, Desktop: grid */}
<div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
  <Card />
  <Card />
</div>
```

---

## ♿ Acessibilidade

### Foco Visível

Todos os elementos interativos têm:
- `ring-2 ring-ring` no `:focus-visible`
- `ring-offset-2` para separação
- Transição suave 200ms

### Contraste

- Texto regular: mínimo 4.5:1
- Texto grande: mínimo 3:1
- Todos os pares de cores foram testados

### Navegação por Teclado

- Tab order lógico
- Skip links disponíveis
- ARIA labels em ícones

---

## 🚀 Implementação

### Importar no Componente

```jsx
import { cn } from "@/lib/utils";

<div className={cn(
  "card-premium",
  "hover-lift",
  isActive && "border-primary"
)}>
  Conteúdo
</div>
```

### CSS Variables

Acesse as variáveis CSS diretamente:

```jsx
<div style={{
  background: 'hsl(var(--primary))',
  color: 'hsl(var(--primary-foreground))'
}}>
  Custom component
</div>
```

---

## 📚 Exemplos de Código

### Card de Estatística

```jsx
<div className="card-premium p-6 hover-glow">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground">Total de Processos</p>
      <h3 className="font-display text-3xl mt-2">124</h3>
    </div>
    <div className="p-3 bg-primary/10 rounded-lg">
      <Scale className="h-6 w-6 text-primary" />
    </div>
  </div>
</div>
```

### Modal Premium

```jsx
<Dialog>
  <DialogContent className="glass">
    <DialogHeader>
      <DialogTitle className="font-display">
        Título do Modal
      </DialogTitle>
    </DialogHeader>
    {/* Conteúdo */}
  </DialogContent>
</Dialog>
```

### Loading State

```jsx
<div className="space-y-3">
  <div className="h-4 bg-muted shimmer rounded" />
  <div className="h-4 bg-muted shimmer rounded w-3/4" />
  <div className="h-4 bg-muted shimmer rounded w-1/2" />
</div>
```

---

## 🎓 Boas Práticas

### ✅ Fazer

- Usar `font-display` para títulos principais
- Aplicar `hover-lift` em cards clicáveis
- Usar badges semânticos (`badge-success`, etc)
- Aplicar `process-number` em números de processo
- Usar `glass` em elementos de destaque (Health Score, modais premium)

### ❌ Evitar

- Misturar fontes display e sans no mesmo título
- Abusar de animações (uma por interação)
- Usar cores hardcoded - sempre usar tokens
- Esquecer states de hover/focus/active
- Ignorar modo dark ao criar componentes

---

## 🔄 Versionamento

**Versão**: 1.0.0
**Data**: 2026-03-02
**Autor**: Claude Code + Frontend Design Skill

### Changelog

- **1.0.0** (2026-03-02): Sistema de design inicial "Legal Premium"
  - Tipografia dual: Playfair Display + Inter
  - Paleta azul profundo + dourado
  - Componentes premium (glass, cards, badges)
  - Animações e micro-interações
  - Dark mode completo

---

## 📞 Suporte

Para dúvidas sobre o Design System:
1. Consulte este documento
2. Veja exemplos no código em `src/pages/Dashboard.tsx`
3. Teste componentes no ambiente de desenvolvimento

---

**Legal Premium Design System** - Onde excelência jurídica encontra design excepcional. ⚖️✨
