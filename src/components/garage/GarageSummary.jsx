import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Car, DollarSign, LogIn, LogOut } from 'lucide-react';
import { startOfDay, endOfDay, formatISO, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

const StatCard = ({ title, value, icon, description, className }) => (
  <Card className={cn(className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const getTodayInChile = () => {
    const now = new Date();
    // Use 'sv-SE' format (YYYY-MM-DD) which is what the date input expects
    const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(now);
};

const GarageSummary = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({ active: 0, capacity: 0, entries: 0, exits: 0, income: 0 });
  const [vehicleTypeData, setVehicleTypeData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const today = getTodayInChile();
  const [dateRange, setDateRange] = useState({ from: today, to: today });

  const fetchData = useCallback(async (currentDateRange) => {
    setLoading(true);
    try {
      if (!currentDateRange.from || !currentDateRange.to) {
        setLoading(false);
        return;
      }

      const fromDate = formatISO(startOfDay(parseISO(currentDateRange.from)));
      const toDate = formatISO(endOfDay(parseISO(currentDateRange.to)));

      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_garage_summary_by_date', { p_start_date: fromDate, p_end_date: toDate });

      if (summaryError) throw summaryError;
      
      if (summaryData && summaryData.length > 0) {
        const data = summaryData[0];
        setStats({
          active: data.active_now_count || 0,
          capacity: data.capacity || 0,
          entries: data.entries_count || 0,
          exits: data.exits_count || 0,
          income: data.period_income || 0
        });
      } else {
        const { data: currentStatusData, error: currentStatusError } = await supabase.rpc('get_garage_summary_by_date', { p_start_date: formatISO(new Date()), p_end_date: formatISO(new Date()) });
        if (currentStatusError) throw currentStatusError;
        setStats({ 
            active: currentStatusData[0]?.active_now_count || 0, 
            capacity: currentStatusData[0]?.capacity || 0,
            entries: 0, 
            exits: 0, 
            income: 0 
        });
      }
      
      const { data: staysData, error: staysError } = await supabase
        .from('garage_stays')
        .select('garage_vehicles(vehicle_type, country)')
        .gte('entry_at', fromDate)
        .lte('entry_at', toDate);
      if (staysError) throw staysError;

      const typeCounts = staysData.reduce((acc, { garage_vehicles }) => {
        if (!garage_vehicles) return acc;
        acc[garage_vehicles.vehicle_type] = (acc[garage_vehicles.vehicle_type] || 0) + 1;
        return acc;
      }, {});
      setVehicleTypeData(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));
      
      const countryCounts = staysData.reduce((acc, { garage_vehicles }) => {
        if (!garage_vehicles) return acc;
        acc[garage_vehicles.country] = (acc[garage_vehicles.country] || 0) + 1;
        return acc;
      }, {});
      setCountryData(Object.entries(countryCounts).map(([name, value]) => ({ name, value })));

    } catch (error) {
      toast({ variant: "destructive", title: "Error al cargar el resumen", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  useEffect(() => {
    const handleRealtimeUpdate = () => {
      fetchData(dateRange);
    };

    const staysChannel = supabase
      .channel('realtime:garage_summary_stays')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garage_stays' }, handleRealtimeUpdate)
      .subscribe();

    const settingsChannel = supabase
      .channel('realtime:garage_summary_settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'garage_settings' }, handleRealtimeUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(staysChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [fetchData, dateRange]);

  return (
    <motion.div
      className="p-4 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resumen del Garaje</h1>
          <p className="text-muted-foreground">Estadísticas y gráficos del rendimiento del garaje.</p>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Desde:</span>
            <Input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))} />
            <span className="text-sm font-medium">Hasta:</span>
            <Input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))} />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Vehículos Activos" 
              value={`${stats.active} / ${stats.capacity}`} 
              icon={<Car className="h-4 w-4 text-muted-foreground" />} 
              description="Ocupación actual del garaje"
              className="bg-card dark:bg-slate-800/60"
            />
            <StatCard title="Ingresos del Periodo" value={stats.entries} icon={<LogIn className="h-4 w-4 text-muted-foreground" />} description="Total de entradas en el rango" />
            <StatCard title="Salidas del Periodo" value={stats.exits} icon={<LogOut className="h-4 w-4 text-muted-foreground" />} description="Total de salidas en el rango" />
            <StatCard title="Ganancias del Periodo" value={`$${(stats.income || 0).toLocaleString('es-CL')}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="Suma de estadías finalizadas" />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vehículos por Tipo</CardTitle>
                <CardDescription>Distribución de vehículos ingresados en el periodo.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {vehicleTypeData.length > 0 ? (
                    <PieChart>
                      <Pie data={vehicleTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                        {vehicleTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Sin datos para este periodo</div>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Vehículos por País</CardTitle>
                <CardDescription>Orígenes de vehículos ingresados en el periodo.</CardDescription>
              </CardHeader>
              <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                  {countryData.length > 0 ? (
                    <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Sin datos para este periodo</div>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GarageSummary;