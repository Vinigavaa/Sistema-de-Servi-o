"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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
  dia: string
  quantidade: number
}

interface ChartBarDefaultProps {
  title: string
  description: string
  data: ChartData[]
  color?: string
}

export function ChartBarDefault({
  title,
  description,
  data,
  color = "var(--chart-1)"
}: ChartBarDefaultProps) {
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
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="dia"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <div className="px-6 pb-4 text-sm text-muted-foreground">
        Total: <span className="font-medium text-foreground">{total}</span> serviços concluídos
      </div>
    </Card>
  )
}
