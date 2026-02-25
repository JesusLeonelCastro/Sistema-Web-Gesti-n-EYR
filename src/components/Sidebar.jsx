
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/components/ui/use-toast';
import { Car, LayoutGrid, ParkingCircle, History, ChefHat, ClipboardList, Users, Settings, LogIn, LogOut as LogOutIcon, Activity, ShoppingCart, LogOut, UtensilsCrossed, X } from 'lucide-react';

const Sidebar = ({ activeModule, setActiveModule, sidebarOpen, setSidebarOpen }) => {
  const { logout } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const sidebarRef = useRef(null);

  const handleModuleClick = moduleId => {
    setActiveModule(moduleId);
  };
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente"
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, setSidebarOpen]);

  const adminModules = [
    { 
      category: "GARAJE", 
      modules: [
        { id: 'garage-summary', name: 'Resumen Garaje', icon: LayoutGrid }, 
        { id: 'register-entry', name: 'Registrar Entrada', icon: LogIn },
        { id: 'parked-vehicles', name: 'Estacionados', icon: ParkingCircle }, 
        { id: 'garage-history', name: 'Historial Garaje', icon: History }
      ] 
    },
    { category: "RESTAURANTE", modules: [{ id: 'restaurant-summary', name: 'Resumen Restaurante', icon: LayoutGrid }, { id: 'menu-management', name: 'Gestionar Menú', icon: ChefHat }, { id: 'order-history', name: 'Historial Pedidos', icon: ClipboardList }] },
    { category: "GENERAL", modules: [{ id: 'users', name: 'Usuarios', icon: Users }, { id: 'general-settings', name: 'Ajustes Generales', icon: Settings }] }
  ];
  
  const operatorModules = [
    { category: "GARAJE", modules: [{ id: 'register-entry', name: 'Registrar Entrada', icon: LogIn }, { id: 'register-exit', name: 'Registrar Salida', icon: LogOutIcon }, { id: 'active-vehicles', name: 'Vehículos Activos', icon: Activity }, { id: 'garage-history', name: 'Historial Garaje', icon: History }] },
    { category: "RESTAURANTE", modules: [{ id: 'take-orders', name: 'Toma de Pedidos', icon: ShoppingCart }, { id: 'active-orders', name: 'Pedidos Activos', icon: ClipboardList }] }
  ];

  const modules = profile?.role === 'administrador' ? adminModules : operatorModules;

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-border flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-secondary flex items-center space-x-2">
            <Car className="h-6 w-6 text-foreground" />
            <UtensilsCrossed className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">SAN JOSE</h1>
            <p className="text-xs text-muted-foreground -mt-1">Garaje & Restaurante</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {profile ? modules.map((category, categoryIndex) => (
          <motion.div key={category.category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: categoryIndex * 0.1 }}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">{category.category}</h2>
            <div className="space-y-1">
              {category.modules.map(module => (
                <button key={module.id} onClick={() => handleModuleClick(module.id)} className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-3 transition-colors duration-200 ${activeModule === module.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                  <module.icon className={`h-5 w-5 ${activeModule === module.id ? 'text-primary' : ''}`} />
                  <span className="text-sm">{module.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )) : <div className="p-4 text-center text-muted-foreground">Cargando módulos...</div>}
      </div>

      <div className="p-4 border-t border-border">
        <button onClick={handleLogout} className="w-full px-3 py-2 rounded-md text-left flex items-center space-x-3 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200">
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              ref={sidebarRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 w-64 h-full bg-card z-50 flex flex-col lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:inset-y-0 z-30">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-border">
          {sidebarContent}
        </div>
      </div>
    </>
  );
};
export default Sidebar;
