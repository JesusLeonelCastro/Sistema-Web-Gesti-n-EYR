
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { formatInChileanTime, calculateStayDuration, calculateGarageRate } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import EntryTicketPDF from '@/components/garage/EntryTicketPDF';
import VehicleDetailsDialog from '@/components/garage/VehicleDetailsDialog';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, Search, Car, Calendar, Globe, Clock, Printer, LogOut, ChevronLeft, ChevronRight, Eye, DollarSign } from 'lucide-react';
import { Label } from '@/components/ui/label';

const StayDurationCell = ({ entryAt }) => {
  const [duration, setDuration] = useState(calculateStayDuration(entryAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(calculateStayDuration(entryAt));
    }, 1000); 

    return () => clearInterval(timer);
  }, [entryAt]);

  return <TableCell>{duration.formatted}</TableCell>;
};

const LiveCostCell = ({ entryAt, vehicleType, settings }) => {
  const [cost, setCost] = useState(0);

  useEffect(() => {
    const updateCost = () => {
        const c = calculateGarageRate(entryAt, new Date(), settings, vehicleType);
        setCost(c);
    }
    updateCost();
    const timer = setInterval(updateCost, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [entryAt, vehicleType, settings]);

  return <TableCell className="text-right font-medium">${cost.toLocaleString('es-CL')}</TableCell>;
}

const ActiveVehicles = ({ setActiveModule }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStayForDetails, setSelectedStayForDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const rowsPerPage = 30;

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('garage_settings').select('*').single();
      setSettings(data);
    } catch (e) {
      console.error("Error fetching settings:", e);
    }
  };

  const fetchActiveVehicles = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('garage_stays')
        .select(`id, entry_at, garage_vehicles (*)`)
        .eq('status', 'activo').order('entry_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      setVehicles(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error al cargar vehículos", description: error.message });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => {
    fetchActiveVehicles();
    fetchSettings();

    const channel = supabase.channel('realtime:garage_stays')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garage_stays' }, (payload) => {
        fetchActiveVehicles();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchActiveVehicles]);
  
  const handleRegisterExit = (vehicle) => {
    setActiveModule('register-exit', { license_plate: vehicle.garage_vehicles.license_plate });
  };
  
  const handlePrintTicket = async (stay) => {
    const ticketData = {
      stayId: stay.id.split('-')[0].toUpperCase(),
      license_plate: stay.garage_vehicles.license_plate,
      vehicle_type: stay.garage_vehicles.vehicle_type,
      country: stay.garage_vehicles.country,
      driver_name: stay.garage_vehicles.driver_name,
      entry_at: stay.entry_at
    };
    try {
      const blob = await pdf(<EntryTicketPDF ticketData={ticketData} />).toBlob();
      const fileName = `TICKET-INGRESO-${ticketData.license_plate}.pdf`;
      saveAs(blob, fileName);
       toast({
        title: "Ticket Generado",
        description: `El ticket para ${ticketData.license_plate} se ha descargado.`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error al generar el PDF",
        description: "No se pudo crear el ticket en PDF.",
      });
    }
  };

  const handleViewDetails = (stay) => {
    setSelectedStayForDetails(stay);
    setIsDetailsOpen(true);
  };
  
  const filteredVehicles = useMemo(() => {
    setCurrentPage(1);
    return vehicles.filter(stay => {
      const vehicle = stay.garage_vehicles;
      const matchesSearch = vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !dateFilter || format(parseISO(stay.entry_at), 'yyyy-MM-dd') === dateFilter;
      return matchesSearch && matchesDate;
    });
  }, [vehicles, searchTerm, dateFilter]);
  
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredVehicles.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredVehicles, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredVehicles.length / rowsPerPage);


  return (
    <>
      <motion.div className="p-4 sm:p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Vehículos Activos en Garaje</h1>
            <p className="text-muted-foreground">Visualiza y gestiona los vehículos que se encuentran actualmente en el garaje.</p>
          </header>

          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <CardTitle>Lista de Vehículos ({filteredVehicles.length})</CardTitle>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 w-full sm:w-auto">
                        <Label htmlFor="active-search" className="sr-only">Buscar</Label>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="active-search" placeholder="Buscar por matrícula..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex-1 w-full sm:w-auto">
                        <Label htmlFor="active-date" className="sr-only">Fecha</Label>
                        <Input id="active-date" type="date" className="w-full" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                    </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead><Car className="inline-block mr-2 h-4 w-4" />Matrícula</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead><Globe className="inline-block mr-2 h-4 w-4" />País</TableHead>
                        <TableHead><Calendar className="inline-block mr-2 h-4 w-4" />Entrada</TableHead>
                        <TableHead><Clock className="inline-block mr-2 h-4 w-4" />Estadía</TableHead>
                        <TableHead className="text-right"><DollarSign className="inline-block mr-1 h-4 w-4"/>Costo Est.</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedVehicles.length > 0 ? (
                        paginatedVehicles.map((stay) => (
                          <TableRow key={stay.id}>
                            <TableCell className="font-medium">{stay.garage_vehicles.license_plate}</TableCell>
                            <TableCell>{stay.garage_vehicles.vehicle_type}</TableCell>
                            <TableCell>{stay.garage_vehicles.country}</TableCell>
                            <TableCell>{formatInChileanTime(stay.entry_at, "dd/MM/yy, HH:mm")}</TableCell>
                            <StayDurationCell entryAt={stay.entry_at} />
                            <LiveCostCell 
                              entryAt={stay.entry_at} 
                              vehicleType={stay.garage_vehicles.vehicle_type} 
                              settings={settings} 
                            />
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleViewDetails(stay)}><Eye className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" onClick={() => handlePrintTicket(stay)}><Printer className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="sm" onClick={() => handleRegisterExit(stay)}><LogOut className="mr-2 h-4 w-4"/>Salida</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={7} className="text-center h-24">No se encontraron vehículos activos.</TableCell></TableRow>
                      )}
                    </TableBody>
                     <TableFooter>
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="text-sm text-muted-foreground">
                                Mostrando {paginatedVehicles.length} de {filteredVehicles.length} vehículos.
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                  disabled={currentPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  Anterior
                                </Button>
                                <span className="text-sm">Página {currentPage} de {totalPages}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                  disabled={currentPage === totalPages}
                                >
                                  Siguiente
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
      <VehicleDetailsDialog 
        stay={selectedStayForDetails}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </>
  );
};

export default ActiveVehicles;
