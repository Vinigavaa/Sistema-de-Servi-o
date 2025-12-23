"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface ChartData {
  date: string
  total: number
}

interface ChartLineInteractiveProps {
  data: ChartData[]
  periodo: "semana" | "mes"
  onPeriodoChange: (periodo: "semana" | "mes") => void
  periodoLabel: string
}

const chartConfig = {
  total: {
    label: "Serviços",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartLineInteractive({
  data,
  periodo,
  onPeriodoChange,
  periodoLabel
}: ChartLineInteractiveProps) {
  const total = React.useMemo(
    () => data.reduce((acc, curr) => acc + curr.total, 0),
    [data]
  )

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Serviços Concluídos</CardTitle>
          <CardDescription>
            {periodoLabel}
          </CardDescription>
        </div>
        <div className="flex">
          <button
            data-active={periodo === "semana"}
            className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
            onClick={() => onPeriodoChange("semana")}
          >
            <span className="text-muted-foreground text-xs">
              Semanal
            </span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {periodo === "semana" ? total.toLocaleString() : "-"}
            </span>
          </button>
          <button
            data-active={periodo === "mes"}
            className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
            onClick={() => onPeriodoChange("mes")}
          >
            <span className="text-muted-foreground text-xs">
              Mensal
            </span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {periodo === "mes" ? total.toLocaleString() : "-"}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
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
