import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn as LogInIcon, AppWindow as AppWindowIcon, Truck, Utensils } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(username, password);
      if (user) {
        if (user.role === 'administrator') {
          navigate('/admin/overview', { replace: true });
        } else if (user.role === 'operator') {
          navigate('/operator/entry-log', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4"
    >
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1}} 
            transition={{delay: 0.2, duration:0.5}}
            className="flex justify-center items-center space-x-2 mb-4"
          >
            <Truck className="w-12 h-12 text-primary" />
            <Utensils className="w-12 h-12 text-secondary" />
          </motion.div>
          <CardTitle>Sistema Gestión San José</CardTitle>
          <CardDescription>Accede a los módulos de Garaje y Restaurante.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="ej: adminpark"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-muted/50 border-border focus:bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-muted/50 border-border focus:bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity" disabled={isLoading}>
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <LogInIcon className="w-5 h-5 mr-2 animate-spin" />
                </motion.div>
              ) : (
                <LogInIcon className="w-5 h-5 mr-2" />
              )}
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm">
          <p className="text-muted-foreground">
            ¿Necesitas acceso? <Link to="#" className="font-medium text-primary hover:underline">Contacta al supervisor</Link>
          </p>
          <div className="mt-4 text-xs text-center text-muted-foreground/80">
            <p>Admin: <span className="font-semibold">adminpark</span> / Pass: <span className="font-semibold">password123</span></p>
            <p>Operador: <span className="font-semibold">operador01</span> / Pass: <span className="font-semibold">opPassword</span></p>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default LoginPage;