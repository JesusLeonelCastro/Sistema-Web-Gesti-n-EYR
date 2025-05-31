import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Utensils, ShoppingCart, ListChecks, Settings, CalendarDays, LayoutDashboard, FileSpreadsheet, Users } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';

const RestaurantDashboardPage = () => {
  const { user, isAdmin, isOperator } = useAuth();
  const navigate = useNavigate();
  // Placeholder data for restaurant - replace with actual hooks later
  const [menuItems] = useLocalStorage('restaurant_menu_items', []); 
  const [activeOrders] = useLocalStorage('restaurant_active_orders', []);

  const adminShortcuts = [
    { title: "Resumen Restaurante", icon: LayoutDashboard, path: "/restaurant/admin/overview", color: "text-orange-400" },
    { title: "Gestión de Menú", icon: Utensils, path: "/restaurant/admin/menu", color: "text-lime-500" },
    { title: "Historial Pedidos", icon: FileSpreadsheet, path: "/restaurant/admin/orders", color: "text-amber-500" },
    { title: "Usuarios", icon: Users, path: "/admin/users", color: "text-yellow-400" }, // Common
    { title: "Ajustes Restaurante", icon: Settings, path: "/restaurant/admin/settings", color: "text-rose-400" },
  ];

  const operatorShortcuts = [
    { title: "Tomar Pedidos", icon: ShoppingCart, path: "/restaurant/operator/orders", color: "text-teal-400" },
    { title: "Pedidos Activos", icon: ListChecks, path: "/restaurant/operator/active-orders", color: "text-cyan-400" },
  ];

  const shortcuts = isAdmin ? adminShortcuts : (isOperator ? operatorShortcuts : []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando datos del usuario...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      <Card className="shadow-xl bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-3xl">Panel Principal de San Jose Restaurante</CardTitle>
          <CardDescription className="text-lg">
            Bienvenido al sistema de gestión del restaurante. Accede a las funciones según tu rol.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Card className="bg-primary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium !text-primary">Platillos en Menú</CardTitle>
                  <Utensils className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{menuItems.length}</div>
                  <p className="text-xs text-primary/80">Disponibles actualmente.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Card className="bg-secondary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium !text-secondary">Pedidos Activos</CardTitle>
                  <ShoppingCart className="h-5 w-5 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{activeOrders.length}</div>
                  <p className="text-xs text-secondary/80">En preparación o entrega.</p>
                </CardContent>
              </Card>
            </motion.div>
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <Card className="bg-accent/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium !text-accent">Fecha Actual</CardTitle>
                  <CalendarDays className="h-5 w-5 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{new Date().toLocaleDateString('es-ES')}</div>
                  <p className="text-xs text-accent/80">{new Date().toLocaleTimeString('es-ES')}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          <h3 className="text-xl font-semibold mb-4 text-foreground">Navegación Rápida (Restaurante)</h3>
           <p className="text-muted-foreground mb-6">
            Utiliza la barra de navegación a la izquierda para acceder a todas las funcionalidades del sistema de restaurante.
          </p>
          
          { (isAdmin || isOperator) && shortcuts.length > 0 && (
            <>
              <h4 className="text-lg font-medium mb-3 text-muted-foreground">Accesos directos para tu rol:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shortcuts.map((shortcut, index) => (
                  <motion.div
                    key={shortcut.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                  >
                    <Card 
                      className="hover:shadow-primary/30 hover:border-primary/50 transition-all duration-300 ease-out cursor-pointer transform hover:-translate-y-1"
                      onClick={() => navigate(shortcut.path)}
                    >
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium !bg-clip-text !text-transparent !bg-none text-card-foreground">{shortcut.title}</CardTitle>
                        <shortcut.icon className={`w-6 h-6 ${shortcut.color}`} {...shortcut.props} />
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">Ir a {shortcut.title.toLowerCase()}.</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          { !isAdmin && !isOperator && (
             <p className="text-center text-muted-foreground py-8">
              No tienes un rol específico asignado para el sistema de restaurante. Contacta al administrador.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RestaurantDashboardPage;