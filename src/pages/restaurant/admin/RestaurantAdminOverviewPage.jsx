import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Utensils, DollarSign, TrendingUp, Users, ShoppingBag, CalendarDays, Filter, XCircle } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { menuCategories } from '@/pages/restaurant/admin/RestaurantMenuManagementPage'; 
import { formatDate, getCurrentUTCISOString } from '@/lib/parkingUtils';

const RestaurantAdminOverviewPage = () => {
  const { user } = useAuth();
  const [menuItems] = useLocalStorage('restaurant_menu_items', []);
  const [ordersHistory] = useLocalStorage('restaurant_orders_history', []); 
  const [systemUsers] = useLocalStorage('sanjose_users', []);
  const [settings] = useLocalStorage('restaurant_settings', { currencySymbol: 'Bs.' });

  const getTodayInSantiago = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });

  const [filterDate, setFilterDate] = useState(getTodayInSantiago()); 
  const [showOverall, setShowOverall] = useState(false); 

  const filteredOrders = useMemo(() => {
    if (showOverall || !filterDate) {
      return ordersHistory.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
    }
    
    return ordersHistory.filter(o => {
      // Get the date part of orderTime in Santiago's timezone
      const orderDateInSantiago = new Date(o.orderTime).toLocaleDateString('en-CA', {timeZone: 'America/Santiago'});
      return orderDateInSantiago === filterDate;
    }).sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));

  }, [ordersHistory, filterDate, showOverall]);

  const totalMenuItems = menuItems.length;
  const totalOrdersForPeriod = filteredOrders.length;
  const totalRevenueForPeriod = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  const revenueByCategoryForPeriod = useMemo(() => {
    const categoryRevenue = {};
    menuCategories.forEach(cat => categoryRevenue[cat.id] = { total: 0, count: 0, icon: cat.icon });
    categoryRevenue['Otros'] = { total: 0, count: 0, icon: Utensils };

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const category = item.category || 'Otros';
        if (!categoryRevenue[category]) {
          categoryRevenue[category] = { total: 0, count: 0, icon: Utensils }; 
        }
        categoryRevenue[category].total += (item.price * item.quantity);
        categoryRevenue[category].count += item.quantity;
      });
    });
    return Object.entries(categoryRevenue)
                 .filter(([_, data]) => data.total > 0 || data.count > 0) 
                 .sort(([,a], [,b]) => b.total - a.total); 
  }, [filteredOrders]);


  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const handleFilterDateChange = (e) => {
    setFilterDate(e.target.value);
    setShowOverall(false); 
  };

  const toggleShowOverall = () => {
    setShowOverall(!showOverall);
    if (!showOverall) { 
      setFilterDate(''); 
    } else { 
      setFilterDate(getTodayInSantiago());
    }
  }

  const getPeriodLabel = () => {
    if (showOverall) return "Histórico";
    
    // Construct a UTC ISO string from filterDate for formatDate function
    // filterDate is 'YYYY-MM-DD'
    const parts = filterDate.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) -1; // JS months are 0-indexed
    const day = parseInt(parts[2]);
    
    // Create a date object that represents midnight UTC on that day
    // This is just for display formatting, not for filtering logic
    const displayDateUTC = new Date(Date.UTC(year, month, day, 0, 0, 0));
    
    if (filterDate === getTodayInSantiago()) return `Hoy (${formatDate(displayDateUTC.toISOString())})`;
    return filterDate ? `El ${formatDate(displayDateUTC.toISOString())}` : "No definido";
  }


  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resumen del Restaurante</h1>
          <p className="text-muted-foreground text-lg">
            Bienvenido, {user?.name || user?.username}. Aquí tienes una vista rápida de la actividad del restaurante.
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-card/50 backdrop-blur-sm rounded-lg shadow">
        <div className="relative flex-grow w-full sm:w-auto">
            <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="date"
                value={filterDate}
                onChange={handleFilterDateChange}
                disabled={showOverall}
                className="pl-10 bg-muted/50 focus:bg-background w-full"
                max={getTodayInSantiago()} // Max date is today in Santiago
            />
        </div>
        <Button onClick={toggleShowOverall} variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {showOverall ? "Mostrar Fecha Específica" : "Mostrar Resumen General"}
        </Button>
      </motion.div>

      <motion.div variants={cardVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Platillos en Menú", value: totalMenuItems, icon: Utensils, trend: "Actualmente" },
          { title: "Pedidos", value: totalOrdersForPeriod, icon: ShoppingBag, trend: getPeriodLabel() },
          { title: "Ingresos", value: `${settings.currencySymbol} ${totalRevenueForPeriod.toFixed(2)}`, icon: DollarSign, trend: getPeriodLabel() },
          { title: "Usuarios Activos", value: systemUsers.length, icon: Users, trend: "En el sistema" }
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
                   {item.trend}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-card/80 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
                Ingresos por Categoría ({getPeriodLabel()})
            </CardTitle>
            <CardDescription>Desglose de ingresos por categoría de menú para el período seleccionado.</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByCategoryForPeriod.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {revenueByCategoryForPeriod.map(([categoryName, data]) => {
                  const CategoryIcon = data.icon;
                  return (
                  <motion.div variants={itemVariants} key={categoryName}>
                    <Card className="bg-muted/30">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                          <CategoryIcon className="w-4 h-4 mr-2" />
                          {categoryName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <p className="text-2xl font-semibold text-foreground">{settings.currencySymbol} {data.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{data.count} ítems vendidos</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )})}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">
                {showOverall && !ordersHistory.length ? "No hay datos de ingresos históricos por categoría." :
                 !showOverall && !filteredOrders.length && filterDate ? `No hay datos de ingresos por categoría para ${getPeriodLabel().split('(')[0].trim()}.` :
                 "No hay datos de ingresos para el período/filtros seleccionados."
                }
              </p>
            )}
          </CardContent>        
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-card/80 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle>Gráficos y Estadísticas (Próximamente)</CardTitle>
            <CardDescription>Visualizaciones de ventas, platos populares, etc.</CardDescription>
          </CardHeader>
          <CardContent className="h-60 flex items-center justify-center">
            <p className="text-muted-foreground">Los gráficos de rendimiento se mostrarán aquí.</p>
          </CardContent>
        </Card>
      </motion.div>

    </motion.div>
  );
};

export default RestaurantAdminOverviewPage;