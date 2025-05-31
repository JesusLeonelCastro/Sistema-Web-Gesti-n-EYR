import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users, Settings, FileText, ShieldCheck, ParkingCircle, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminPage = () => {
  const adminSections = [
    { name: "Resumen General", icon: ParkingCircle, description: "Vista rápida del estado del sistema.", path: "/admin/overview" },
    { name: "Tráilers Estacionados", icon: ParkingCircle, description: "Monitorea todos los tráilers en el estacionamiento.", path: "/admin/parked-trailers" },
    { name: "Historial Completo", icon: FileText, description: "Revisa todos los registros de entrada y salida.", path: "/admin/history" },
    { name: "Gestión de Usuarios", icon: Users, description: "Administra cuentas de operadores y administradores.", path: "/admin/users" },
    { name: "Reportes y Estadísticas", icon: BarChart3, description: "Genera reportes de ocupación, tiempos, etc.", path: "/admin/reports" },
    { name: "Configuración del Sistema", icon: Settings, description: "Ajusta parámetros globales del estacionamiento.", path: "/admin/settings" },
  ];

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
            <ShieldCheck className="w-8 h-8 mr-3 text-primary" />
            Panel de Administración GlobalPark
          </CardTitle>
          <CardDescription className="text-lg">
            Control total sobre el sistema de estacionamiento de tráilers. (Algunas secciones son placeholders)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Desde aquí puedes supervisar y gestionar todas las operaciones, usuarios y configuraciones del estacionamiento.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section, index) => (
              <motion.div
                key={section.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              >
                <Card className="h-full hover:shadow-primary/20 transition-shadow flex flex-col">
                  <CardHeader className="flex flex-row items-start space-x-4 pb-4">
                    <div className="p-3 bg-primary/10 rounded-md">
                      <section.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl !bg-clip-text !text-transparent !bg-none text-card-foreground">{section.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </CardContent>
                  <CardFooter>
                     <Button asChild variant="outline" className="w-full mt-auto">
                        <Link to={section.path}>Acceder a {section.name}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminPage;