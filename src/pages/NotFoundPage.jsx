import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-200px)] p-8"
    >
      <motion.div 
        animate={{ rotate: [0, 10, -10, 10, 0] }} 
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AlertTriangle className="w-32 h-32 text-destructive mb-8" />
      </motion.div>
      <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-destructive via-red-500 to-orange-500 mb-4">
        404
      </h1>
      <h2 className="text-3xl font-semibold text-foreground mb-6">Página No Encontrada</h2>
      <p className="text-lg text-muted-foreground mb-10 max-w-md">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
        Verifica la URL o regresa al inicio.
      </p>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
          <Link to="/">
            <Home className="mr-2 h-5 w-5" />
            Volver al Inicio
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default NotFoundPage;