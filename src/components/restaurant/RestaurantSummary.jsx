import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChefHat, DollarSign, Activity, ClipboardList, Loader2, PieChart, BarChart } from 'lucide-react';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import {
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';

const getTodayInChile = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(now);
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

const RestaurantSummary = () => {
    const { summaryData, allOrders, allOrderItems, menuItems, loading, calculateSummaryData } = useRestaurant();

    const today = getTodayInChile();
    const [dateRange, setDateRange] = useState({ from: today, to: today });

    useEffect(() => {
        if (!loading && dateRange.from && dateRange.to) {
            const fromDate = startOfDay(parseISO(dateRange.from));
            const toDate = endOfDay(parseISO(dateRange.to));
            calculateSummaryData(allOrders, allOrderItems, menuItems, { from: fromDate, to: toDate });
        }
    }, [allOrders, allOrderItems, menuItems, dateRange, loading, calculateSummaryData]);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const SummaryCard = ({ title, value, icon: Icon, description, isLoading }) => (
        <motion.div variants={cardVariants}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <>
                            <div className="text-2xl font-bold">{value}</div>
                            <p className="text-xs text-muted-foreground">{description}</p>
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/80 backdrop-blur-sm p-2 border border-border rounded-md shadow-lg">
                    <p className="label font-bold">{`${label}`}</p>
                    <p className="intro text-primary">{`Venta: $${payload[0].value.toLocaleString('es-CL')}`}</p>
                </div>
            );
        }
        return null;
    };
    
    const PieCustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-background/80 backdrop-blur-sm p-2 border border-border rounded-md shadow-lg">
            <p className="label font-bold">{`${payload[0].name}`}</p>
            <p className="intro text-primary">{`Venta: $${payload[0].value.toLocaleString('es-CL')}`}</p>
            <p className="text-muted-foreground">{`(${(payload[0].percent * 100).toFixed(2)}%)`}</p>
          </div>
        );
      }
      return null;
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
            <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Resumen del Restaurante</h1>
                  <p className="text-muted-foreground">Una vista rápida del rendimiento de tu restaurante.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Desde:</span>
                    <Input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))} />
                    <span className="text-sm font-medium">Hasta:</span>
                    <Input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))} />
                </div>
            </header>

            {loading && !summaryData ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard 
                        title="Ventas del Periodo"
                        value={`$${(summaryData?.periodSales || 0).toLocaleString('es-CL')}`}
                        icon={DollarSign}
                        description="Total de ventas completadas en el rango."
                        isLoading={loading || !summaryData}
                    />
                    <SummaryCard 
                        title="Pedidos en Preparación"
                        value={summaryData?.activeOrders || 0}
                        icon={Activity}
                        description="Pedidos actuales esperando ser completados."
                        isLoading={loading || !summaryData}
                    />
                    <SummaryCard 
                        title="Platos en Menú"
                        value={summaryData?.menuItemCount || 0}
                        icon={ChefHat}
                        description="Total de platos disponibles."
                        isLoading={loading || !summaryData}
                    />
                    <SummaryCard 
                        title="Total Pedidos del Periodo"
                        value={summaryData?.periodOrdersCount || 0}
                        icon={ClipboardList}
                        description="Total de pedidos generados en el rango."
                        isLoading={loading || !summaryData}
                    />
                </div>
                
                <div className="mt-8 grid gap-8 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5" /> Ventas por Categoría
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                {summaryData?.salesByCategoryChartData && summaryData.salesByCategoryChartData.length > 0 ? (
                                    <RechartsPieChart>
                                        <Pie data={summaryData.salesByCategoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" labelLine={false} label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                            {summaryData.salesByCategoryChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieCustomTooltip />} />
                                    </RechartsPieChart>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">No hay datos para mostrar.</div>
                                )}
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart className="h-5 w-5" /> Ventas Diarias del Periodo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                 {summaryData?.salesByDayChartData && summaryData.salesByDayChartData.length > 0 ? (
                                    <LineChart data={summaryData.salesByDayChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value.toLocaleString('es-CL')}`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                                    </LineChart>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">No hay datos para mostrar.</div>
                                )}
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
              </>
            )}
        </motion.div>
    );
};

export default RestaurantSummary;