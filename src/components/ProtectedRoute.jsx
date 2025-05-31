import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8"
      >
        <ShieldAlert className="w-24 h-24 text-destructive mb-6" />
        <h1 className="text-4xl font-bold text-destructive mb-4">Acceso Denegado</h1>
        <p className="text-lg text-muted-foreground mb-8">
          No tienes permiso para acceder a esta página.
        </p>
        <p className="text-sm text-muted-foreground">
          Tu rol actual es: <span className="font-semibold text-primary">{user?.role}</span>.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Esta página requiere uno de los siguientes roles: {allowedRoles.join(', ')}.
        </p>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-8">
          Volver a la página anterior
        </Button>
      </motion.div>
    );
  }
  return children;
};

export default ProtectedRoute;