
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { motion } from 'framer-motion';
import { Settings, Percent, Clock, Save, AlertCircle, Info, Utensils, Trash2, AlertTriangle, DownloadCloud } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const RestaurantAdminSettingsPage = () => {
  const defaultRestaurantSettings = {
    restaurantName: 'San Jose Restaurante',
    defaultTaxRate: 0, 
    estimatedPreparationTime: 30, 
    currencySymbol: 'Bs.', 
  };
  const [settings, setSettings] = useLocalStorage('restaurant_settings', defaultRestaurantSettings);
  const [tempSettings, setTempSettings] = useState(settings);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  const [, setMenuItems] = useLocalStorage('restaurant_menu_items', []);
  const [, setOrdersHistory] = useLocalStorage('restaurant_orders_history', []);
  const [, setActiveOrders] = useLocalStorage('restaurant_active_orders', []);
  const [, setOrderCounters] = useLocalStorage('restaurant_order_counters', {});


  useEffect(() => {
    setTempSettings({ ...defaultRestaurantSettings, ...settings });
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'defaultTaxRate' || name === 'estimatedPreparationTime') {
      processedValue = value === '' ? '' : Number(value);
       if (isNaN(processedValue) || processedValue < 0) {
         processedValue = tempSettings[name] > 0 ? tempSettings[name] : 0; 
       }
    }
    setTempSettings(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: null}));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!tempSettings.restaurantName.trim()) {
      newErrors.restaurantName = "El nombre del restaurante es obligatorio.";
    }
    if (tempSettings.defaultTaxRate === '' || Number(tempSettings.defaultTaxRate) < 0 || Number(tempSettings.defaultTaxRate) > 100 || isNaN(Number(tempSettings.defaultTaxRate))) {
      newErrors.defaultTaxRate = "La tasa de impuesto debe ser un número entre 0 y 100.";
    }
    if (tempSettings.estimatedPreparationTime === '' || Number(tempSettings.estimatedPreparationTime) <= 0 || isNaN(Number(tempSettings.estimatedPreparationTime))) {
      newErrors.estimatedPreparationTime = "El tiempo de preparación debe ser un número positivo.";
    }
    if (!tempSettings.currencySymbol.trim()) {
        newErrors.currencySymbol = "El símbolo de moneda es obligatorio.";
    } else if (tempSettings.currencySymbol.length > 5) {
        newErrors.currencySymbol = "El símbolo de moneda no debe exceder los 5 caracteres.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: 'Error de Validación',
        description: 'Por favor, corrige los campos marcados.',
        variant: 'destructive',
      });
      return;
    }
    
    setSettings({
        restaurantName: tempSettings.restaurantName.trim(),
        defaultTaxRate: Number(tempSettings.defaultTaxRate),
        estimatedPreparationTime: Number(tempSettings.estimatedPreparationTime),
        currencySymbol: tempSettings.currencySymbol.trim(),
    });
    toast({
      title: 'Configuración Guardada',
      description: 'Los ajustes del restaurante han sido actualizados.',
    });
  };

  const handleResetRestaurantData = () => {
    setMenuItems([]);
    setOrdersHistory([]);
    setActiveOrders([]);
    setOrderCounters({}); 
    setSettings(defaultRestaurantSettings); 
    setTempSettings(defaultRestaurantSettings); 
    toast({
      title: "Datos del Restaurante Reiniciados",
      description: "Todo el menú, historial de pedidos, pedidos activos y configuraciones del restaurante han sido borrados y restaurados a sus valores por defecto.",
      variant: "default",
      duration: 7000
    });
  };

  const handleExportRestaurantData = () => {
    const restaurantData = {
      restaurant_settings: JSON.parse(localStorage.getItem('restaurant_settings') || '{}'),
      restaurant_menu_items: JSON.parse(localStorage.getItem('restaurant_menu_items') || '[]'),
      restaurant_orders_history: JSON.parse(localStorage.getItem('restaurant_orders_history') || '[]'),
      restaurant_active_orders: JSON.parse(localStorage.getItem('restaurant_active_orders') || '[]'),
      restaurant_order_counters: JSON.parse(localStorage.getItem('restaurant_order_counters') || '{}'),
      users: JSON.parse(localStorage.getItem('users') || '[]'), // Include users as they might be relevant for both systems
    };

    const jsonString = JSON.stringify(restaurantData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restaurant_data_export_supabase.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Datos Exportados',
      description: 'Los datos del sistema de restaurante han sido exportados en formato JSON.',
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <Settings className="w-8 h-8 mr-3 text-rose-500" />
            Configuración del Restaurante
          </CardTitle>
          <CardDescription className="text-lg">
            Ajusta los parámetros generales de operación del restaurante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className="space-y-2">
                <Label htmlFor="restaurantName" className="flex items-center text-base">
                  <Utensils className="w-5 h-5 mr-2 text-muted-foreground" />
                  Nombre del Restaurante
                </Label>
                <Input 
                  id="restaurantName" 
                  name="restaurantName"
                  type="text" 
                  value={tempSettings.restaurantName} 
                  onChange={handleChange} 
                  placeholder="Ej: Comidas San Jose" 
                  className={`text-lg ${errors.restaurantName ? 'border-destructive focus:ring-destructive' : ''}`}
                />
                {errors.restaurantName && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.restaurantName}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="defaultTaxRate" className="flex items-center text-base">
                  <Percent className="w-5 h-5 mr-2 text-muted-foreground" />
                  Tasa de Impuesto (%)
                </Label>
                <Input 
                  id="defaultTaxRate" 
                  name="defaultTaxRate"
                  type="number" 
                  value={tempSettings.defaultTaxRate} 
                  onChange={handleChange} 
                  placeholder="Ej: 13" 
                  min="0"
                  max="100"
                  step="0.01"
                  className={`text-lg ${errors.defaultTaxRate ? 'border-destructive focus:ring-destructive' : ''}`}
                />
                {errors.defaultTaxRate && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.defaultTaxRate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedPreparationTime" className="flex items-center text-base">
                  <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
                  Tiempo Estimado de Preparación (min)
                </Label>
                <Input 
                  id="estimatedPreparationTime" 
                  name="estimatedPreparationTime"
                  type="number" 
                  value={tempSettings.estimatedPreparationTime} 
                  onChange={handleChange} 
                  placeholder="Ej: 30" 
                  min="1"
                  step="1"
                  className={`text-lg ${errors.estimatedPreparationTime ? 'border-destructive focus:ring-destructive' : ''}`}
                />
                {errors.estimatedPreparationTime && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.estimatedPreparationTime}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currencySymbolRest" className="flex items-center text-base">
                <Info className="w-5 h-5 mr-2 text-muted-foreground" />
                Símbolo de Moneda
              </Label>
              <Input 
                id="currencySymbolRest" 
                name="currencySymbol"
                type="text" 
                value={tempSettings.currencySymbol} 
                onChange={handleChange} 
                placeholder="Ej: Bs." 
                maxLength="5"
                className={`text-lg w-full md:w-1/2 ${errors.currencySymbol ? 'border-destructive focus:ring-destructive' : ''}`}
              />
              {errors.currencySymbol && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.currencySymbol}</p>}
            </div>
            
            <CardFooter className="pt-8 pb-0 px-0 flex flex-col sm:flex-row justify-between gap-4">
              <Button type="submit" className="w-full sm:w-auto text-base py-3">
                <Save className="w-5 h-5 mr-2" /> Guardar Configuración
              </Button>
              <Button type="button" variant="outline" onClick={handleExportRestaurantData} className="w-full sm:w-auto text-base py-3">
                <DownloadCloud className="w-5 h-5 mr-2" /> Exportar Datos para Supabase
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto shadow-xl border-destructive/50 mt-12">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center text-destructive">
            <AlertTriangle className="w-7 h-7 mr-3" />
            Zona de Peligro
          </CardTitle>
          <CardDescription className="text-destructive/90">
            Las acciones en esta sección son irreversibles y pueden causar pérdida de datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-base text-foreground">Reiniciar Datos del Restaurante</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Esto borrará todos los ítems del menú, el historial de pedidos, los pedidos activos y las configuraciones específicas del restaurante. 
                Los datos del sistema de estacionamiento y los usuarios no se verán afectados.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="w-4 h-4 mr-2" /> Reiniciar Todos los Datos del Restaurante
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente todos los datos del módulo de restaurante, incluyendo menú, pedidos y configuraciones. 
                      Los datos del sistema de estacionamiento no se verán afectados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetRestaurantData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      Sí, reiniciar datos del restaurante
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RestaurantAdminSettingsPage;
