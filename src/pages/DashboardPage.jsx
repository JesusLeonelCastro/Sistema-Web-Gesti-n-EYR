import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, ListChecks, FileText, Users, Settings, ParkingCircle, ParkingSquare, CalendarDays, MapPin, LayoutDashboard } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';

const DashboardPage = () => {
  const { user, isAdmin, isOperator } = useAuth();
  const navigate = useNavigate();
  const [parkedTrailers] = useLocalStorage('parked_trailers', []);
  const [settings] = useLocalStorage('parking_settings', { dailyRate: 50, totalSpots: 50, currencySymbol: 'Bs.' });


  const adminShortcuts = [
    { title: "Resumen Garaje", icon: LayoutDashboard, path: "/admin/overview", color: "text-sky-400" },
    { title: "Ver Tráilers Estacionados", icon: ParkingCircle, path: "/admin/parked-trailers", color: "text-blue-400" },
    { title: "Historial de Movimientos", icon: FileText, path: "/admin/history", color: "text-green-400" },
    { title: "Gestión de Usuarios", icon: Users, path: "/admin/users", color: "text-yellow-400" }, // Common
    { title: "Ajustes Garaje", icon: Settings, path: "/admin/settings", color: "text-purple-400" },
  ];

  const operatorShortcuts = [
    { title: "Registrar Entrada", icon: Truck, path: "/operator/entry-log", color: "text-green-400" },
    { title: "Registrar Salida", icon: Truck, path: "/operator/exit-log", color: "text-red-400", props: {style: {transform: 'scaleX(-1)'}} },
    { title: "Ver Vehículos Activos", icon: ListChecks, path: "/operator/active-trailers", color: "text-blue-400" },
  ];

  const shortcuts = isAdmin ? adminShortcuts : (isOperator ? operatorShortcuts : []);
  const totalSpots = settings.totalSpots; 
  const availableSpots = totalSpots - parkedTrailers.length;

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
          <CardTitle className="text-3xl">Panel Principal de San Jose Garaje</CardTitle>
          <CardDescription className="text-lg">
            Este es tu punto de partida para el sistema de garaje. Desde aquí puedes navegar a las secciones relevantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Card className="bg-primary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium !text-primary">Vehículos Estacionados</CardTitle>
                  <ParkingSquare className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{parkedTrailers.length}</div>
                  <p className="text-xs text-primary/80">Actualmente en el recinto.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Card className="bg-secondary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium !text-secondary">Espacios Disponibles</CardTitle>
                  <MapPin className="h-5 w-5 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{availableSpots >= 0 ? availableSpots : 0}</div>
                  <p className="text-xs text-secondary/80">De {totalSpots} totales.</p>
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
          
          <h3 className="text-xl font-semibold mb-4 text-foreground">Navegación Rápida (Garaje)</h3>
           <p className="text-muted-foreground mb-6">
            Utiliza la barra de navegación a la izquierda para acceder a todas las funcionalidades del sistema de garaje.
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
              No tienes un rol específico asignado para el sistema de garaje. Contacta al administrador.
            </p>
          )}

        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardPage;