
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Search, Car, Calendar, Clock, DollarSign, LogOut, User, ArrowRight, Info } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatInChileanTime, getChileanTime, calculateGarageRate, calculateStayDuration } from '@/lib/utils';
import { differenceInHours } from 'date-fns';

const formSchema = z.object({
  license_plate: z.string().min(1, "Debe ingresar una matrícula."),
});

const RegisterExit = ({ activeModuleData, setActiveModule }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [stayDetails, setStayDetails] = useState(null);
  const [cost, setCost] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exitDate, setExitDate] = useState(null);
  const [isUnder8Hours, setIsUnder8Hours] = useState(false);
  const [settings, setSettings] = useState(null);
  const [durationData, setDurationData] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      license_plate: "",
    },
  });
  
  const fetchStayDetails = useCallback(async (license_plate) => {
    setIsLoading(true);
    setStayDetails(null);
    setCost(null);
    setExitDate(null);
    setIsUnder8Hours(false);
    setSettings(null);
    setDurationData(null);

    const normalizedPlate = license_plate.toUpperCase().replace(/[\s-]/g, '');

    try {
      const { data: vehicle, error: vehicleError } = await supabase
        .from('garage_vehicles')
        .select('id, license_plate, vehicle_type, driver_name')
        .eq('license_plate', normalizedPlate)
        .maybeSingle();
      
      if (vehicleError) throw vehicleError;

      if (!vehicle) {
        toast({
          variant: "destructive",
          title: "Vehículo no encontrado",
          description: `No existe un vehículo con la matrícula ${license_plate}.`,
        });
        setIsLoading(false);
        return;
      }

      const { data: stay, error: stayError } = await supabase
        .from('garage_stays')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'activo')
        .maybeSingle();
        
      if (stayError) throw stayError;

      if (!stay) {
        toast({
          variant: "destructive",
          title: "No Encontrado",
          description: `No se encontró una estadía activa para la matrícula ${license_plate}.`,
        });
        setIsLoading(false);
        return;
      }
      
      const { data: garageSettings, error: settingsError } = await supabase
        .from('garage_settings')
        .select('*')
        .single();

      if (settingsError || !garageSettings) {
        toast({
          variant: "destructive",
          title: "Error de Configuración",
          description: "No se pudieron cargar las tarifas del garaje.",
        });
        setIsLoading(false);
        return;
      }
      
      setSettings(garageSettings);
      
      const now = getChileanTime();
      setExitDate(now);

      const totalCost = calculateGarageRate(stay.entry_at, now, garageSettings, vehicle.vehicle_type);
      setCost(totalCost);
      
      const hours = differenceInHours(now, new Date(stay.entry_at));
      setIsUnder8Hours(hours < 8);
      
      const calcDuration = calculateStayDuration(stay.entry_at, now);
      setDurationData(calcDuration);

      setStayDetails({ ...stay, garage_vehicles: vehicle });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Inesperado",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (activeModuleData?.license_plate) {
      form.setValue('license_plate', activeModuleData.license_plate);
      fetchStayDetails(activeModuleData.license_plate);
      setActiveModule('register-exit', null);
    }
  }, [activeModuleData, form, fetchStayDetails, setActiveModule]);


  const handleRegisterExit = async () => {
    if (!stayDetails || cost === null) return;

    setIsConfirming(true);
    try {
      const { error } = await supabase
        .from('garage_stays')
        .update({
          status: 'finalizado',
          exit_at: getChileanTime().toISOString(),
          total_paid_clp: cost,
        })
        .eq('id', stayDetails.id);
      
      if (error) throw error;

      toast({
        title: "¡Salida Registrada!",
        description: `El vehículo ${stayDetails.garage_vehicles.license_plate} ha salido. Total pagado: $${cost.toLocaleString('es-CL')}`,
      });
      setStayDetails(null);
      setCost(null);
      setExitDate(null);
      setDurationData(null);
      form.reset({ license_plate: "" });

    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error al registrar la salida",
        description: error.message,
      });
    } finally {
      setIsConfirming(false);
      setIsDialogOpen(false);
    }
  };

  const onSubmit = (values) => {
    fetchStayDetails(values.license_plate);
  };

  const formatDurationString = (d) => {
    if (!d) return '';
    // Prefer totalDays if available (for long durations handled by utility), otherwise standard days
    const days = d.totalDays !== undefined ? d.totalDays : (d.days || 0);
    return `${days} días, ${d.hours || 0} horas, ${d.minutes || 0} minutos`;
  };

  return (
    <motion.div 
      className="flex flex-col h-full p-4 sm:p-6 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Registrar Salida de Vehículo</h1>
        <p className="text-muted-foreground mt-1">Busque el vehículo por su matrícula para registrar su salida.</p>
      </header>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Buscar Vehículo</CardTitle>
                    <CardDescription>Ingrese la matrícula para encontrar la estadía.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
                        <FormField
                            control={form.control}
                            name="license_plate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg">Matrícula</FormLabel>
                                    <FormControl>
                                    <div className="relative">
                                        <Input 
                                        placeholder="1234ABC" 
                                        {...field} 
                                        className="h-14 text-2xl pl-4 tracking-widest font-mono text-center"
                                        style={{textTransform: 'uppercase'}}
                                        />
                                    </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                                Buscar Vehículo
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Detalles de la Salida</CardTitle>
                    <CardDescription>
                        {stayDetails ? `Vehículo: ${stayDetails.garage_vehicles.license_plate}` : 'Esperando búsqueda...'}
                    </CardDescription>
                </CardHeader>
                
                {stayDetails ? (
                    <>
                    <CardContent className="space-y-4 flex-grow">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoCard icon={Car} label="Tipo de Vehículo" value={stayDetails.garage_vehicles.vehicle_type} />
                            <InfoCard icon={User} label="Conductor" value={stayDetails.garage_vehicles.driver_name || 'No especificado'} />
                            <InfoCard icon={Calendar} label="Fecha de Ingreso" value={formatInChileanTime(stayDetails.entry_at, 'dd-MM-yyyy, HH:mm')} />
                            <InfoCard icon={Calendar} label="Fecha de Salida" value={formatInChileanTime(exitDate, 'dd-MM-yyyy, HH:mm')} />
                        </div>

                        {durationData?.duration && (
                            <div className="text-sm text-gray-600 flex items-center gap-2 px-2 pt-2 animate-in fade-in duration-300">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>Estadía: {formatDurationString(durationData.duration)}</span>
                            </div>
                        )}
                        
                        <div className="border-t border-dashed border-border/50 my-4"></div>

                        <div className="space-y-2">
                             <h4 className="font-semibold">Resumen de Costo</h4>
                             {isUnder8Hours ? (
                               <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
                                 <div className="flex justify-between items-center text-primary font-medium">
                                   <span className="flex items-center gap-2"><Clock className="w-4 h-4"/> Estadía &lt; 8 Horas</span>
                                   <span>Tarifa Especial</span>
                                 </div>
                               </div>
                             ) : (
                               <>
                                <div className="flex justify-between items-center text-sm text-muted-foreground pt-1">
                                    <span className='flex items-center gap-1'><Info className='w-4 h-4'/>Período de gracia:</span>
                                    <span>{settings?.grace_period_hours || 0} horas</span>
                                </div>
                               </>
                             )}
                             
                             <div className="border-t border-border/50 my-2"></div>
                             <div className="flex justify-between items-center text-2xl font-bold text-primary">
                                 <span>Total a Pagar:</span>
                                 <span>${cost?.toLocaleString('es-CL') ?? '0'}</span>
                             </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                         <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <Button variant= "destructive" className="w-full text-lg py-7" size="lg" disabled={isConfirming} onClick={() => setIsDialogOpen(true)}>
                                {isConfirming ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Finalizar y Registrar Salida'}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Confirmar Salida?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se registrará la salida del vehículo <span className="font-bold text-primary">{stayDetails.garage_vehicles.license_plate}</span>.
                                El total a pagar es de <span className="font-bold text-primary">${cost?.toLocaleString('es-CL')}</span>. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isConfirming}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleRegisterExit} disabled={isConfirming}>
                                 {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                        <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Los detalles de la estadía aparecerán aquí una vez que busques una matrícula.</p>
                    </div>
                )}
            </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

const InfoCard = ({ icon: Icon, label, value }) => (
    <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </div>
        <p className="font-bold text-lg mt-1">{value}</p>
    </div>
);

export default RegisterExit;
