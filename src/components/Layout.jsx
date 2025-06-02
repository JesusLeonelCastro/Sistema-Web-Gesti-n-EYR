import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, LogOut, ParkingSquare, Users, FileText, Settings as SettingsIcon, BarChart3, 
  ChevronLeft, Menu, Truck, ListChecks, Sun, Moon, ChefHat, Utensils, ShoppingCart, FileSpreadsheet, Clock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


const NavLinkContent = ({ to, icon: Icon, children, isOpen, exact = false }) => {
  const location = useLocation();
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
  
  const linkClasses = `flex items-center px-3 py-2.5 text-sm font-medium rounded-md hover:bg-muted transition-colors group whitespace-nowrap`;
  const activeLinkClasses = "bg-primary/10 text-primary";

  return (
    <Link to={to} className={`${linkClasses} ${isActive ? activeLinkClasses : 'text-muted-foreground hover:text-foreground'}`}>
      <Icon className={`w-5 h-5 mr-3 transition-colors flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
      {isOpen && <span className="truncate">{children}</span>}
    </Link>
  );
};

const SystemSwitcher = ({ isOpen }) => {
  const { activeSystem, switchSystem } = useAuth();

  if (!isOpen) {
    return (
      <div className="px-2 py-3 border-b">
        <Button variant="ghost" size="icon" onClick={() => switchSystem(activeSystem === 'parking' ? 'restaurant' : 'parking')} className="w-full">
          {activeSystem === 'parking' ? <ParkingSquare className="w-5 h-5 text-primary" /> : <ChefHat className="w-5 h-5 text-primary" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 border-b">
      <Select value={activeSystem} onValueChange={switchSystem}>
        <SelectTrigger className="w-full bg-muted/50">
          <SelectValue placeholder="Seleccionar Sistema" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="parking">
            <div className="flex items-center">
              <ParkingSquare className="w-4 h-4 mr-2" />
              Sistema de Garaje
            </div>
          </SelectItem>
          <SelectItem value="restaurant">
            <div className="flex items-center">
              <ChefHat className="w-4 h-4 mr-2" />
              Sistema de Restaurante
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};


const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { isAdmin, isOperator, activeSystem } = useAuth();

  const parkingAdminNav = [
    { to: "/admin/overview", icon: LayoutDashboard, label: "Resumen Garaje" },
    { to: "/admin/parked-trailers", icon: ParkingSquare, label: "Estacionados" },
    { to: "/admin/history", icon: FileText, label: "Historial Garaje" },
    { to: "/admin/users", icon: Users, label: "Usuarios" }, // Common
    { to: "/admin/reports", icon: BarChart3, label: "Reportes Garaje" },
    { to: "/admin/settings", icon: SettingsIcon, label: "Ajustes Garaje" },
  ];

  const parkingOperatorNav = [
    { to: "/operator/entry-log", icon: Truck, label: "Registrar Entrada" },
    { to: "/operator/exit-log", icon: Truck, label: "Registrar Salida", props: {style: {transform: 'scaleX(-1)'}} },
    { to: "/operator/active-trailers", icon: ListChecks, label: "Vehículos Activos" },
  ];

  const restaurantAdminNav = [
    { to: "/restaurant/admin/overview", icon: LayoutDashboard, label: "Resumen Restaurante" },
    { to: "/restaurant/admin/menu", icon: Utensils, label: "Gestión de Menú" },
    { to: "/restaurant/admin/orders", icon: FileSpreadsheet, label: "Historial Pedidos" },
    { to: "/admin/users", icon: Users, label: "Usuarios" }, // Common
     { to: "/restaurant/admin/settings", icon: SettingsIcon, label: "Ajustes Restaurante" },
  ];

  const restaurantOperatorNav = [
    { to: "/restaurant/operator/orders", icon: ShoppingCart, label: "Toma de Pedidos" },
    { to: "/restaurant/operator/active-orders", icon: ListChecks, label: "Pedidos Activos" },
  ];
  
  const commonNavItems = [
     { to: "/dashboard", icon: LayoutDashboard, label: "Panel Principal" },
  ];

  let navItems = commonNavItems;
  if (activeSystem === 'parking') {
    if (isAdmin) navItems = parkingAdminNav;
    else if (isOperator) navItems = parkingOperatorNav;
  } else if (activeSystem === 'restaurant') {
    if (isAdmin) navItems = restaurantAdminNav;
    else if (isOperator) navItems = restaurantOperatorNav;
  }


  const systemIcon = activeSystem === 'parking' ? ParkingSquare : ChefHat;
  const systemName = activeSystem === 'parking' ? 'Garaje' : 'Restaurante';


  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 240 : 68 }}
      transition={{ duration: 0.2, ease: "circOut" }}
      className="fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background"
    >
      <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} h-16 px-4 border-b`}>
        <Link to="/" className={`flex items-center space-x-2 ${!isOpen && 'justify-center'}`}>
          <motion.div whileHover={{ scale: isOpen ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
            <span className="text-primary flex-shrink-0">
                 {React.createElement(systemIcon, { className: "w-7 h-7" })}
            </span>
          </motion.div>
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-semibold text-foreground whitespace-nowrap"
            >
              San Jose <span className="text-sm text-primary">{systemName}</span>
            </motion.span>
          )}
        </Link>
        {isOpen && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
      </div>

      <SystemSwitcher isOpen={isOpen} />
      
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLinkContent key={item.to} to={item.to} icon={item.icon} isOpen={isOpen} exact={item.to === "/dashboard"}>
            {item.label}
          </NavLinkContent>
        ))}
      </nav>
      {isOpen && (
         <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="px-3 py-3 mt-auto border-t"
          >
          <p className="text-xs text-center text-muted-foreground">
            © {new Date().getFullYear()} San Jose
          </p>
        </motion.div>
      )}
    </motion.aside>
  );
};

const ChileTimeDisplay = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateChileTime = () => {
      const chileTime = new Date().toLocaleTimeString('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
      });
      setTime(chileTime);
    };

    updateChileTime();
    const intervalId = setInterval(updateChileTime, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Clock className="w-4 h-4" />
      <span>{time} <span className="text-xs">(CLT)</span></span>
    </div>
  );
};


const Layout = () => {
  const { user, logout, isAuthenticated, activeSystem } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation(); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (isAuthenticated && location.pathname === '/login') {
     const defaultPath = activeSystem === 'restaurant' ? '/restaurant/dashboard' : '/dashboard';
     return <Navigate to={user.role === 'administrator' ? (activeSystem === 'restaurant' ? '/restaurant/admin/overview' : '/admin/overview') : 
                         user.role === 'operator' ? (activeSystem === 'restaurant' ? '/restaurant/operator/orders' : '/operator/entry-log') : 
                         defaultPath} replace />;
  }

  if (location.pathname === '/login') {
    return (
       <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <Toaster />
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div 
        className="flex-1 flex flex-col transition-all duration-200 ease-circOut"
        style={{ paddingLeft: isSidebarOpen ? '240px' : '68px' }}
      >
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 sm:px-6 border-b bg-background/95 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <ChileTimeDisplay />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.name || user?.username}
            </span>
            <Button variant="outline" onClick={logout} size="sm">
              <LogOut className="w-4 h-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + activeSystem} 
              initial="initial"
              animate="in"
              exit="out"
              variants={{
                initial: { opacity: 0, y: 15 },
                in: { opacity: 1, y: 0 },
                out: { opacity: 0, y: -15 },
              }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="h-full" 
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <Toaster />
      </div>
    </div>
  );
};

export default Layout;