# Implementação dos Gráficos do Dashboard

Este documento descreve como os gráficos do dashboard foram implementados usando **shadcn/ui Charts** (baseado em Recharts) e como eles se comunicam com a API.

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard (page.tsx)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  useEffect → fetch('/api/dashboard?periodo=semana') │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Estado: data, periodo, loading          │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         ▼                  ▼                  ▼             │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│  │  Gráfico   │    │  Gráfico   │    │  Gráfico   │        │
│  │   Linha    │    │   Barra    │    │   Barra    │        │
│  │ (Serviços) │    │ (Faturado) │    │(Não Fatur.)│        │
│  └────────────┘    └────────────┘    └────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API /api/dashboard                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Prisma → Busca serviços → Processa dados → JSON    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. API do Dashboard

### Arquivo: `app/api/dashboard/route.ts`

A API é responsável por buscar e processar os dados dos serviços do banco de dados.

### Estrutura da Resposta

```typescript
{
  periodo: {
    tipo: "semana" | "mes",
    inicio: string,  // ISO date
    fim: string      // ISO date
  },
  resumo: {
    horasTrabalhadas: number,
    segundosTotais: number,
    servicosAtivos: number,
    servicosConcluidos: number,
    servicosFaturados: number,
    lucroEstimado: number,
    valorHora: number
  },
  graficos: {
    horasPorDia: [{ dia: string, horas: number }],
    servicosPorData: [{ date: string, total: number }],
    faturadosPorDia: [{ dia: string, quantidade: number }],
    naoFaturadosPorDia: [{ dia: string, quantidade: number }]
  }
}
```

### Exemplo de Chamada

```typescript
// Buscar dados da semana atual
const response = await fetch('/api/dashboard?periodo=semana');

// Buscar dados do mês atual
const response = await fetch('/api/dashboard?periodo=mes');

// Buscar dados com offset (semana/mês anterior)
const response = await fetch('/api/dashboard?periodo=semana&offset=-1');
```

### Código da API (resumido)

```typescript
// app/api/dashboard/route.ts
export const GET = withAuth(async (request: NextRequest, userId: string) => {
    const url = new URL(request.url);
    const periodo = url.searchParams.get('periodo') ?? 'semana';
    const offset = parseInt(url.searchParams.get('offset') ?? '0');

    // Calcula intervalo de datas
    let inicio: Date, fim: Date;
    if (periodo === 'mes') {
        const range = getMonthRange(dataReferencia);
        inicio = range.inicio;
        fim = range.fim;
    } else {
        const range = getWeekRange(dataReferencia);
        inicio = range.inicio;
        fim = range.fim;
    }

    // Busca serviços concluídos no período
    const servicosConcluidosNoPeriodo = await prisma.servico.findMany({
        where: {
            userId,
            status: 'CONCLUIDO',
            finalizado_em: { gte: inicio, lte: fim }
        }
    });

    // Processa e agrupa dados por dia
    servicosConcluidosNoPeriodo.forEach(servico => {
        if (servico.finalizado_em) {
            const dataFinal = new Date(servico.finalizado_em);
            const diaSemana = dataFinal.getDay();
            const dataStr = dataFinal.toISOString().split('T')[0];

            if (servico.faturado) {
                servicosFaturadosPorDia[diaSemana]++;
            } else {
                servicosNaoFaturadosPorDia[diaSemana]++;
            }

            servicosPorData[dataStr] = (servicosPorData[dataStr] ?? 0) + 1;
        }
    });

    return NextResponse.json({
        periodo: { tipo: periodo, inicio, fim },
        resumo: { ... },
        graficos: {
            servicosPorData: dadosServicosPorData,
            faturadosPorDia: dadosFaturadosPorDia,
            naoFaturadosPorDia: dadosNaoFaturadosPorDia
        }
    });
});
```

---

## 2. Componentes de Gráfico (shadcn/ui)

### Dependências Necessárias

```bash
# Instalar recharts (base do shadcn charts)
npm install recharts

# Adicionar componente chart do shadcn
npx shadcn@latest add chart
```

### Componentes Utilizados

O shadcn/ui fornece wrappers para o Recharts:

```typescript
import {
  ChartContainer,      // Container responsivo
  ChartTooltip,        // Tooltip customizado
  ChartTooltipContent, // Conteúdo do tooltip
  type ChartConfig,    // Tipagem de configuração
} from "@/components/ui/chart"
```

---

## 3. Gráfico de Linha Interativo

### Arquivo: `components/chart-line-interactive.tsx`

Este gráfico mostra os serviços concluídos por dia, com opção de visualização semanal ou mensal.

### Interface de Props

```typescript
interface ChartData {
  date: string   // Formato: "2024-12-23"
  total: number  // Quantidade de serviços
}

interface ChartLineInteractiveProps {
  data: ChartData[]
  periodo: "semana" | "mes"
  onPeriodoChange: (periodo: "semana" | "mes") => void
  periodoLabel: string
}
```

### Configuração do Gráfico

```typescript
const chartConfig = {
  total: {
    label: "Serviços",
    color: "var(--chart-1)", // Usa variável CSS do tema
  },
} satisfies ChartConfig
```

### Implementação Completa

```tsx
export function ChartLineInteractive({
  data,
  periodo,
  onPeriodoChange,
  periodoLabel
}: ChartLineInteractiveProps) {
  // Calcula total de serviços
  const total = React.useMemo(
    () => data.reduce((acc, curr) => acc + curr.total, 0),
    [data]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviços Concluídos</CardTitle>
        <CardDescription>{periodoLabel}</CardDescription>

        {/* Botões de alternância Semanal/Mensal */}
        <div className="flex">
          <button
            data-active={periodo === "semana"}
            onClick={() => onPeriodoChange("semana")}
          >
            Semanal: {periodo === "semana" ? total : "-"}
          </button>
          <button
            data-active={periodo === "mes"}
            onClick={() => onPeriodoChange("mes")}
          >
            Mensal: {periodo === "mes" ? total : "-"}
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* ChartContainer aplica estilos e responsividade */}
        <ChartContainer config={chartConfig}>
          <LineChart data={data}>
            <CartesianGrid vertical={false} />

            {/* Eixo X com formatação de data */}
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />

            {/* Tooltip customizado */}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="total"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />

            {/* Linha do gráfico */}
            <Line
              dataKey="total"
              type="monotone"
              stroke="var(--color-total)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

---

## 4. Gráfico de Barras

### Arquivo: `components/chart-bar-default.tsx`

Este componente é reutilizável para exibir dados por dia da semana.

### Interface de Props

```typescript
interface ChartData {
  dia: string        // "Dom", "Seg", "Ter", etc.
  quantidade: number // Quantidade de serviços
}

interface ChartBarDefaultProps {
  title: string
  description: string
  data: ChartData[]
  color?: string  // Cor customizada (opcional)
}
```

### Implementação Completa

```tsx
export function ChartBarDefault({
  title,
  description,
  data,
  color = "var(--chart-1)"
}: ChartBarDefaultProps) {
  // Configuração dinâmica com cor customizada
  const chartConfig = {
    quantidade: {
      label: "Serviços",
      color: color,
    },
  } satisfies ChartConfig

  const total = data.reduce((acc, curr) => acc + curr.quantidade, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />

            {/* Eixo X com dias da semana */}
            <XAxis
              dataKey="dia"
              tickLine={false}
              axisLine={false}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            {/* Barras com cantos arredondados */}
            <Bar
              dataKey="quantidade"
              fill="var(--color-quantidade)"
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>

      {/* Rodapé com total */}
      <div className="px-6 pb-4 text-sm text-muted-foreground">
        Total: <span className="font-medium">{total}</span> serviços
      </div>
    </Card>
  )
}
```

---

## 5. Página do Dashboard

### Arquivo: `app/(protected)/dashboard/page.tsx`

A página conecta todos os componentes e gerencia o estado.

### Implementação

```tsx
"use client"

import { useEffect, useState } from "react"
import { ChartLineInteractive } from "@/components/chart-line-interactive"
import { ChartBarDefault } from "@/components/chart-bar-default"

interface DashboardData {
  periodo: { tipo: string; inicio: string; fim: string }
  resumo: { ... }
  graficos: {
    servicosPorData: { date: string; total: number }[]
    faturadosPorDia: { dia: string; quantidade: number }[]
    naoFaturadosPorDia: { dia: string; quantidade: number }[]
  }
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<"semana" | "mes">("semana")
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Busca dados quando o período muda
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const response = await fetch(`/api/dashboard?periodo=${periodo}`)
      if (response.ok) {
        setData(await response.json())
      }
      setLoading(false)
    }
    fetchData()
  }, [periodo])

  // Formata label do período
  const formatPeriodoLabel = () => {
    if (!data) return ""
    const inicio = new Date(data.periodo.inicio)
    const fim = new Date(data.periodo.fim)

    if (periodo === "semana") {
      return `${inicio.toLocaleDateString("pt-BR", {
        day: "numeric", month: "short"
      })} - ${fim.toLocaleDateString("pt-BR", {
        day: "numeric", month: "short", year: "numeric"
      })}`
    }
    return inicio.toLocaleDateString("pt-BR", {
      month: "long", year: "numeric"
    })
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="space-y-6 p-6">
      <h1>Dashboard</h1>

      {/* Gráfico de Linha - Serviços por dia */}
      <ChartLineInteractive
        data={data?.graficos.servicosPorData ?? []}
        periodo={periodo}
        onPeriodoChange={setPeriodo}
        periodoLabel={formatPeriodoLabel()}
      />

      {/* Grid com 2 gráficos de barra */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartBarDefault
          title="Serviços Faturados"
          description="Por dia da semana"
          data={data?.graficos.faturadosPorDia ?? []}
          color="var(--chart-2)"  // Verde
        />
        <ChartBarDefault
          title="Serviços Não Faturados"
          description="Por dia da semana"
          data={data?.graficos.naoFaturadosPorDia ?? []}
          color="var(--chart-3)"  // Laranja
        />
      </div>
    </div>
  )
}
```

---

## 6. Fluxo de Dados

```
1. Usuário acessa /dashboard
   │
2. useEffect dispara fetch para /api/dashboard?periodo=semana
   │
3. API busca serviços do Prisma
   │
   ├─► Filtra serviços CONCLUÍDOS no período
   ├─► Agrupa por data (para gráfico de linha)
   ├─► Agrupa por dia da semana separando faturados/não faturados
   │
4. API retorna JSON com dados formatados
   │
5. Dashboard atualiza estado com setData()
   │
6. React re-renderiza os componentes de gráfico
   │
   ├─► ChartLineInteractive recebe servicosPorData
   ├─► ChartBarDefault (1) recebe faturadosPorDia
   └─► ChartBarDefault (2) recebe naoFaturadosPorDia
   │
7. Usuário clica em "Mensal"
   │
8. setPeriodo("mes") → useEffect dispara nova requisição
   │
9. Ciclo se repete com novos dados
```

---

## 7. Variáveis CSS de Cores

O shadcn/ui usa variáveis CSS para as cores dos gráficos, definidas no tema:

```css
/* globals.css ou theme */
:root {
  --chart-1: hsl(221 83% 53%);  /* Azul */
  --chart-2: hsl(142 71% 45%);  /* Verde */
  --chart-3: hsl(38 92% 50%);   /* Laranja */
  --chart-4: hsl(0 84% 60%);    /* Vermelho */
  --chart-5: hsl(262 83% 58%);  /* Roxo */
}

.dark {
  --chart-1: hsl(221 83% 63%);
  --chart-2: hsl(142 71% 55%);
  /* ... */
}
```

---

## 8. Exemplo de Dados

### Dados retornados pela API

```json
{
  "periodo": {
    "tipo": "semana",
    "inicio": "2024-12-22T03:00:00.000Z",
    "fim": "2024-12-28T02:59:59.999Z"
  },
  "graficos": {
    "servicosPorData": [
      { "date": "2024-12-22", "total": 3 },
      { "date": "2024-12-23", "total": 5 },
      { "date": "2024-12-24", "total": 2 }
    ],
    "faturadosPorDia": [
      { "dia": "Dom", "quantidade": 1 },
      { "dia": "Seg", "quantidade": 3 },
      { "dia": "Ter", "quantidade": 2 },
      { "dia": "Qua", "quantidade": 0 },
      { "dia": "Qui", "quantidade": 4 },
      { "dia": "Sex", "quantidade": 1 },
      { "dia": "Sáb", "quantidade": 0 }
    ],
    "naoFaturadosPorDia": [
      { "dia": "Dom", "quantidade": 2 },
      { "dia": "Seg", "quantidade": 1 },
      { "dia": "Ter", "quantidade": 0 },
      { "dia": "Qua", "quantidade": 3 },
      { "dia": "Qui", "quantidade": 1 },
      { "dia": "Sex", "quantidade": 2 },
      { "dia": "Sáb", "quantidade": 1 }
    ]
  }
}
```

---

## Referências

- [shadcn/ui Charts](https://ui.shadcn.com/charts)
- [Recharts Documentation](https://recharts.org/en-US/)
- [Next.js App Router](https://nextjs.org/docs/app)
