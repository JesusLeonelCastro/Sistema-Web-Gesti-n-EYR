import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Car, UtensilsCrossed, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { success, error } = await login(email, password);

    if (success) {
      toast({
        title: "¡Bienvenido de nuevo!",
        description: "Has iniciado sesión correctamente.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error,
      });
    }
    setIsSubmitting(false);
  };

  const loading = authLoading || isSubmitting;

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - Sistema Garaje & Restaurante</title>
        <meta name="description" content="Accede al sistema integrado de gestión de garaje y restaurante" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <Card className="border-border">
            <CardHeader className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center items-center space-x-4 mb-2"
              >
                <div className="p-3 rounded-full bg-secondary">
                  <Car className="h-7 w-7 text-foreground" />
                </div>
                <div className="p-3 rounded-full bg-secondary">
                  <UtensilsCrossed className="h-7 w-7 text-foreground" />
                </div>
              </motion.div>
              
              <CardTitle className="text-2xl font-bold text-foreground">
                Sistema Integrado
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Inicia sesión para continuar
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@sistema.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-muted-foreground">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Iniciando...</> : 'Iniciar Sesión'}
                </Button>
              </form>
              <br />
              <p className='text-center'>----</p>
               <br />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Login;