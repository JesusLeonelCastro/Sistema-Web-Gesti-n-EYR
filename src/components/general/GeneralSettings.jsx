
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const settingsSchema = z.object({
  capacity: z.coerce.number().int().positive("La capacidad debe ser un número positivo."),
  rate_under_8_hours_clp: z.coerce.number().int().nonnegative("La tarifa no puede ser negativa."),
  car_rate_clp: z.coerce.number().int().nonnegative("La tarifa no puede ser negativa."),
  truck_rate_clp: z.coerce.number().int().nonnegative("La tarifa no puede ser negativa."),
  trailer_rate_clp: z.coerce.number().int().nonnegative("La tarifa no puede ser negativa."),
  articulated_truck_rate_clp: z.coerce.number().int().nonnegative("La tarifa no puede ser negativa."),
});

const GeneralSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      capacity: 50,
      rate_under_8_hours_clp: 0,
      car_rate_clp: 10000,
      truck_rate_clp: 12000,
      trailer_rate_clp: 15000,
      articulated_truck_rate_clp: 20000,
    }
  });

  const fetchSettings = useCallback(async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.from('garage_settings').select('*').single();
      if (error) throw error;
      if (data) {
        form.reset(data);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al cargar la configuración",
        description: error.message,
      });
    } finally {
      setFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('garage_settings')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', 1);
      
      if (error) throw error;

      toast({
        title: "¡Configuración Guardada!",
        description: "Los ajustes del garaje se han actualizado correctamente.",
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al guardar la configuración",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="p-4 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Ajustes Generales</h1>
          <p className="text-muted-foreground">Gestiona la configuración principal del sistema.</p>
        </header>

        
          <Card>
            <CardHeader>
              <CardTitle>Ajustes del Garaje</CardTitle>
              <CardDescription>Configura la capacidad y las tarifas del garaje en Pesos Chilenos (CLP).</CardDescription>
            </CardHeader>
            <CardContent>
              {fetching ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacidad del Garaje</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="rate_under_8_hours_clp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tarifa Menos de 8 Horas (CLP)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="car_rate_clp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tarifa Automóvil (CLP)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="truck_rate_clp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tarifa Camión Solo (CLP)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="trailer_rate_clp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tarifa Tráiler (CLP)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="articulated_truck_rate_clp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tarifa Camión Acoplado (CLP)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
          
        
      </div>
    </motion.div>
  );
};

export default GeneralSettings;
