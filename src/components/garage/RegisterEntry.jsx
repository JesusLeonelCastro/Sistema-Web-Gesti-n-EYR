import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SOUTH_AMERICAN_COUNTRIES, VEHICLE_TYPES } from '@/lib/constants';
import { getChileanTime } from '@/lib/utils';
import { pdf } from '@react-pdf/renderer';
import EntryTicketPDF from '@/components/garage/EntryTicketPDF';
import { saveAs } from 'file-saver';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Car } from 'lucide-react';

const formSchema = z.object({
  license_plate: z.string().min(1, "La matrícula es obligatoria.").max(10, "La matrícula es muy larga."),
  vehicle_type: z.enum(VEHICLE_TYPES, { required_error: "Debe seleccionar un tipo de vehículo." }),
  country: z.string().min(1, "Debe seleccionar un país."),
  driver_name: z.string().optional(),
  notes: z.string().optional(),
});

const GarageCapacityIndicator = () => {
  const [capacity, setCapacity] = useState(0);
  const [occupied, setOccupied] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('garage_settings')
        .select('capacity')
        .single();
      if (settingsError) throw settingsError;
      setCapacity(settings.capacity);

      const { count, error: countError } = await supabase
        .from('garage_stays')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'activo');
      if (countError) throw countError;
      setOccupied(count);
    } catch (error) {
      console.error("Error fetching garage status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    const channel = supabase
      .channel('garage_stays_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garage_stays' },
        (payload) => {
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStatus]);

  if (loading) {
    return <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando estado...</div>;
  }

  const percentage = capacity > 0 ? (occupied / capacity) * 100 : 0;
  let colorClass = 'text-green-500';
  if (percentage > 85) {
    colorClass = 'text-red-500';
  } else if (percentage > 60) {
    colorClass = 'text-yellow-500';
  }

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Car className="h-4 w-4" />
        <span>Ocupación:</span>
        <span className={`font-bold ${colorClass}`}>{occupied} / {capacity}</span>
      </div>
      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const RegisterEntry = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      license_plate: "", vehicle_type: "", country: "", driver_name: "", notes: "",
    },
  });

  const generateAndDownloadPdf = async (ticketData) => {
    try {
      const blob = await pdf(<EntryTicketPDF ticketData={ticketData} />).toBlob();
      const fileName = `TICKET-INGRESO-${ticketData.license_plate}.pdf`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error al generar el PDF",
        description: "No se pudo crear el ticket en PDF.",
      });
    }
  };

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      const normalizedPlate = values.license_plate.toUpperCase().replace(/[\s-]/g, '');
      const entryTime = getChileanTime();

      const { data: existingStay, error: stayError } = await supabase
        .from('garage_stays')
        .select('*, garage_vehicles!inner(license_plate)')
        .eq('garage_vehicles.license_plate', normalizedPlate)
        .eq('status', 'activo').maybeSingle();
      if (stayError) throw stayError;
      if (existingStay) {
        toast({
          variant: "destructive", title: "Error: Vehículo ya está adentro",
          description: `El vehículo con matrícula ${values.license_plate} ya tiene una estadía activa.`,
        });
        setIsLoading(false);
        return;
      }

      let { data: vehicle, error: vehicleError } = await supabase
        .from('garage_vehicles').select('id')
        .eq('license_plate', normalizedPlate).single();
      if (vehicleError && vehicleError.code !== 'PGRST116') throw vehicleError;

      if (!vehicle) {
        const { data: newVehicle, error: newVehicleError } = await supabase
          .from('garage_vehicles').insert({
            license_plate: normalizedPlate, vehicle_type: values.vehicle_type,
            country: values.country, driver_name: values.driver_name, notes: values.notes,
          }).select('id').single();
        if (newVehicleError) throw newVehicleError;
        vehicle = newVehicle;
      }

      const { data: newStay, error: newStayError } = await supabase
        .from('garage_stays').insert({
          vehicle_id: vehicle.id, created_by: user.id, entry_at: entryTime.toISOString(),
        }).select('id').single();
      if (newStayError) throw newStayError;

      const ticketDataForPdf = {
        stayId: newStay.id.split('-')[0].toUpperCase(),
        ...values,
        license_plate: normalizedPlate,
        entry_at: entryTime.toISOString(),
      };
      
      await generateAndDownloadPdf(ticketDataForPdf);

      toast({
        title: "¡Entrada Registrada!",
        description: `El vehículo con matrícula ${values.license_plate} ha ingresado. El ticket PDF se ha descargado.`,
      });
      form.reset();

    } catch (error) {
      toast({
        variant: "destructive", title: "Error al registrar la entrada", description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="p-4 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Registrar Entrada de Vehículo</h1>
          <p className="text-muted-foreground mt-1">Complete los datos para registrar un nuevo ingreso al garaje.</p>
          <div className="mt-4">
            <GarageCapacityIndicator />
          </div>
        </header>
        
        <Card>
          <CardHeader>
            <CardTitle>Datos del Vehículo</CardTitle>
            <CardDescription>Ingrese la información del vehículo que está ingresando.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="license_plate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matrícula</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: 1234ABC" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="vehicle_type" render={({ field }) => (
                    <FormItem><FormLabel>Tipo de Vehículo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger></FormControl>
                        <SelectContent>{VEHICLE_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>País</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un país" /></SelectTrigger></FormControl>
                        <SelectContent>{SOUTH_AMERICAN_COUNTRIES.map(country => (<SelectItem key={country} value={country}>{country}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="driver_name" render={({ field }) => (
                    <FormItem><FormLabel>Nombres del Conductor (Opcional)</FormLabel><FormControl><Input placeholder="Ej: Jesus Leonel" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notas (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="Alguna nota adicional ..." className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar y Generar Ticket
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default RegisterEntry;