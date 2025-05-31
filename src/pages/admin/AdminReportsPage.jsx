import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChart3, PieChart as PieIcon, DollarSign, Users, CalendarDays } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const AdminReportsPage = () => {
  const [trailerHistory] = useLocalStorage('trailer_history', []);
  const [parkedTrailers] = useLocalStorage('parked_trailers', []);

  const trailersByCountryData = useMemo(() => {
    const counts = parkedTrailers.reduce((acc, trailer) => {
      acc[trailer.country] = (acc[trailer.country] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [parkedTrailers]);

  const dailyIncomeData = useMemo(() => {
    const incomeByDate = trailerHistory
      .filter(item => item.type === 'exit' && item.fee)
      .reduce((acc, item) => {
        const date = new Date(item.exitTime).toLocaleDateString('es-ES');
        acc[date] = (acc[date] || 0) + item.fee;
        return acc;
      }, {});
    return Object.entries(incomeByDate)
      .map(([date, income]) => ({ date, income }))
      .sort((a,b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-'))); // Sort by date
  }, [trailerHistory]);

  const averageStayDurationData = useMemo(() => {
    const durationsByCountry = trailerHistory
      .filter(item => item.type === 'exit' && item.durationDays)
      .reduce((acc, item) => {
        if (!acc[item.country]) {
          acc[item.country] = { totalDays: 0, count: 0 };
        }
        acc[item.country].totalDays += item.durationDays;
        acc[item.country].count += 1;
        return acc;
      }, {});
    return Object.entries(durationsByCountry).map(([name, data]) => ({
      name,
      avgDuration: parseFloat((data.totalDays / data.count).toFixed(1))
    }));
  }, [trailerHistory]);
  
  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C', '#FF69B4'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <Card className="bg-card/80 backdrop-blur-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-purple-500" />
            Reportes y Estadísticas
          </CardTitle>
          <CardDescription className="text-lg">
            Análisis detallado del rendimiento y operaciones del estacionamiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10">
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><PieIcon className="w-6 h-6 mr-2 text-blue-500" />Tráilers Estacionados por País (Actual)</CardTitle>
                <CardDescription>Distribución de los tráilers actualmente en el recinto.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] md:h-[400px]">
                {trailersByCountryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={trailersByCountryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {trailersByCountryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} tráilers`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No hay datos de tráilers estacionados para mostrar.</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><DollarSign className="w-6 h-6 mr-2 text-green-500" />Ingresos Diarios (Simulado)</CardTitle>
                <CardDescription>Evolución de los ingresos generados por día.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] md:h-[400px]">
                {dailyIncomeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyIncomeData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        formatter={(value) => [`${value} unidades`, "Ingresos"]}
                      />
                      <Legend wrapperStyle={{fontSize: "12px"}}/>
                      <Line type="monotone" dataKey="income" name="Ingresos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No hay datos de ingresos para mostrar.</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><CalendarDays className="w-6 h-6 mr-2 text-orange-500" />Duración Promedio de Estadía por País (Días)</CardTitle>
                <CardDescription>Tiempo medio que los tráilers de cada país permanecen estacionados.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] md:h-[400px]">
                {averageStayDurationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={averageStayDurationData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        formatter={(value) => [`${value} días`, "Duración Prom."]}
                      />
                      <Legend wrapperStyle={{fontSize: "12px"}}/>
                      <Bar dataKey="avgDuration" name="Duración Prom. (días)" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No hay datos de duración de estadía para mostrar.</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminReportsPage;