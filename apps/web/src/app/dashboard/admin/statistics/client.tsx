"use client";
import { useTheme } from 'next-themes';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getTokenUsage } from '~/app/dashboard/admin/statistics/statistics';
import { ChartContainer, ChartTooltipContent } from '~/components/ui/chart';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
const chartColor = COLORS[0];

const chartConfig = {
    runs: {
        label: 'Runs',
        color: chartColor,
    },
};

export default function UsageChart({ tokenData }: { tokenData: Awaited<ReturnType<typeof getTokenUsage>> }) {
    const theme = useTheme();
    return <ChartContainer config={ chartConfig } className="h-[170px] w-full">
        <ResponsiveContainer>
            <AreaChart
                data={ tokenData.overviewResults }
                dataKey={ 'inputTokens' }
                margin={ { right: 10, bottom: 0, left: -10, top: 20 } }
            >
                <defs>
                    <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor={ chartColor }
                            stopOpacity={ 0.15 }
                        />
                        <stop
                            offset="100%"
                            stopColor={ chartColor }
                            stopOpacity={ 0.1 }
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={ false }
                    stroke={
                        theme.resolvedTheme === 'dark' ? '#262626' : '#e5e5e5'
                    }
                />
                <XAxis
                    dataKey="createdAt"
                    tick={ { fontSize: 12 } }
                    tickLine={ false }
                    axisLine={ false }
                    dy={ 10 }
                />
                <YAxis
                    dataKey="inputTokens"
                    allowDecimals={ false }
                    tick={ { fontSize: 12 } }
                    tickLine={ false }
                    axisLine={ false }
                    tickFormatter={ (value) => value.toString() }
                    dx={ -8 }
                    domain={ [0, 'dataMax + 10'] }
                />
                <Tooltip content={ <ChartTooltipContent /> } />
                <Area
                    type="monotone"
                    dataKey="count"
                    name="runs"
                    stroke={ chartColor }
                    fillOpacity={ 1 }
                    fill="url(#colorRuns)"
                />
            </AreaChart>
        </ResponsiveContainer>
    </ChartContainer>
}

export function CostDistributionChart({ tokenData }: { tokenData: Awaited<ReturnType<typeof getTokenUsage>> }) {
    return <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Pie
                data={ tokenData.overviewResults }
                cx="50%"
                cy="50%"
                labelLine={ false }
                label={ ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` }
                outerRadius={ 80 }
                fill="#8884d8"
                dataKey="value"
            >
                { tokenData.overviewResults.map((entry, index: number) => (
                    <Cell key={ `cell-${index}` } fill={ COLORS[index % COLORS.length] } />
                )) }
            </Pie>
            <Tooltip />
        </PieChart>
    </ResponsiveContainer>
}