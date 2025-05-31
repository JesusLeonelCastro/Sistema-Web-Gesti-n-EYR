import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { PackageSearch, PackagePlus, History, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';


const EmployeeTasksPage = () => {
  const employeeActions = [
    { name: "Consultar Inventario", icon: PackageSearch, description: "Verifica la disponibilidad y detalles de los productos.", path:"/operator/active-trailers" },
    { name: "Registrar Entrada de Stock", icon: PackagePlus, description: "Añade nuevos productos o cantidades al inventario.", path:"/operator/entry-log" },
    { name: "Registrar Salida de Stock", icon: PackagePlus, transform: 'scaleX(-1)', description: "Registra productos que salen del inventario.", path:"/operator/exit-log"},
    { name: "Historial de Movimientos", icon: History, description: "Consulta el historial de tus transacciones de inventario.", path:"/admin/history"},
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
            <Briefcase className="w-8 h-8 mr-3 text-secondary" />
            Panel de Operador
          </CardTitle>
          <CardDescription className="text-lg">
            Accede a tus funciones y gestiona las tareas asignadas para el estacionamiento de tráilers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Aquí puedes realizar tus operaciones diarias relacionadas con el registro y control de tráilers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {employeeActions.map((action, index) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              >
                <Card className="h-full hover:shadow-secondary/20 transition-shadow flex flex-col">
                  <CardHeader className="flex flex-row items-start space-x-4 pb-4">
                    <div className="p-3 bg-secondary/10 rounded-md">
                      <action.icon className="w-6 h-6 text-secondary" style={action.transform ? { transform: action.transform } : {}} />
                    </div>
                    <div>
                       <CardTitle className="text-xl !bg-clip-text !text-transparent !bg-none text-card-foreground">{action.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                   <CardFooter>
                     <Button asChild variant="outline" className="w-full mt-auto bg-secondary/20 hover:bg-secondary/30 border-secondary/50 text-secondary-foreground">
                        <Link to={action.path}>Ir a {action.name}</Link>
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

export default EmployeeTasksPage;