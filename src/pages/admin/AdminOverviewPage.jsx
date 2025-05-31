import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Users, Truck, Clock, DollarSign, TrendingUp, AlertTriangle, ParkingSquare } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';

const COLORS_COUNTRY = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const COLORS_VEHICLE_TYPE = ['#FFBB28', '#00C49F', '#0088FE', '#FF8042', '#A28DFF', '#FFD700'];


const AdminOverviewPage = () => {
  const { user } = useAuth();
  const [parkedTrailers] = useLocalStorage('parked_trailers', []);
  const [trailerHistory] = useLocalStorage('trailer_history', []);
  const [settings] = useLocalStorage('parking_settings', { dailyRate: 50, totalSpots: 50, currencySymbol: 'Bs.' });

  const activeTrailers = parkedTrailers.filter(t => t.status === 'parked').length;
  const totalMovementsToday = trailerHistory.filter(t => new Date(t.entryTime).toDateString() === new Date().toDateString()).length;
  
  const totalRevenue = useMemo(() => {
    return trailerHistory
      .filter(t => t.type === 'exit' && t.fee)
      .reduce((sum, t) => sum + parseFloat(t.fee), 0);
  }, [trailerHistory]);

  const entriesByCountry = useMemo(() => {
    const counts = {};
    parkedTrailers.filter(t => t.status === 'parked').forEach(t => {
      counts[t.country] = (counts[t.country] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [parkedTrailers]);

  const entriesByVehicleType = useMemo(() => {
    const counts = {};
    parkedTrailers.filter(t => t.status === 'parked').forEach(t => {
      counts[t.vehicleType] = (counts[t.vehicleType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [parkedTrailers]);


  const occupancyPercentage = settings.totalSpots > 0 ? (activeTrailers / settings.totalSpots) * 100 : 0;
  const capacityAlert = occupancyPercentage >= 90;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-foreground">Resumen del Estacionamiento</motion.h1>
      <motion.p variants={itemVariants} className="text-muted-foreground text-lg">
        Bienvenido, {user?.name || user?.username}. Aquí tienes una vista rápida de la actividad.
      </motion.p>

      {capacityAlert && (
        <motion.div variants={itemVariants}>
          <Alert variant="warning" className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold text-yellow-700 dark:text-yellow-300">¡Alerta de Capacidad!</AlertTitle>
            <AlertDescription className="text-yellow-600 dark:text-yellow-400">
              El estacionamiento está al {occupancyPercentage.toFixed(1)}% de su capacidad ({activeTrailers}/{settings.totalSpots} espacios ocupados).
              Considere gestionar el espacio disponible.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={cardVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Vehículos Activos", value: activeTrailers, icon: Truck, trend: "+5 hoy" },
          { title: "Capacidad Total", value: `${activeTrailers} / ${settings.totalSpots}`, icon: ParkingSquare, trend: `${occupancyPercentage.toFixed(1)}% lleno` },
          { title: "Movimientos Hoy", value: totalMovementsToday, icon: Clock, trend: "Entradas/Salidas" },
          { title: "Ingresos Totales", value: `${settings.currencySymbol} ${totalRevenue.toFixed(2)}`, icon: DollarSign, trend: "Histórico" }
        ].map((item, index) => (
          <motion.div variants={itemVariants} key={index}>
            <Card className="bg-card/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                <item.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{item.value}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" /> {item.trend}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={cardVariants} className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="bg-card/80 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle>Vehículos por País</CardTitle>
              <CardDescription>Distribución de vehículos activos por país de origen.</CardDescription>
            </CardHeader>
            <CardContent>
              {entriesByCountry.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={entriesByCountry} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill="#8884d8">
                       {entriesByCountry.map((entry, index) => (
                        <Cell key={`cell-country-${index}`} fill={COLORS_COUNTRY[index % COLORS_COUNTRY.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} vehículos`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-10">No hay datos de vehículos por país.</p>}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="bg-card/80 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle>Vehículos por Tipo</CardTitle>
              <CardDescription>Distribución de vehículos activos por tipo.</CardDescription>
            </CardHeader>
            <CardContent>
                {entriesByVehicleType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={entriesByVehicleType} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value) => [`${value} vehículos`, 'Cantidad']}
                        />
                        <Legend wrapperStyle={{ fontSize: 14 }} />
                        <Bar dataKey="value" name="Cantidad" radius={[4, 4, 0, 0]}>
                        {entriesByVehicleType.map((entry, index) => (
                            <Cell key={`cell-type-${index}`} fill={COLORS_VEHICLE_TYPE[index % COLORS_VEHICLE_TYPE.length]} />
                        ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-10">No hay datos de vehículos por tipo.</p>}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AdminOverviewPage;