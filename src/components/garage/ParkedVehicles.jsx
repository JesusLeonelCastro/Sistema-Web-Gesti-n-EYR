
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Loader2, Edit, LogOut, Search, Printer, ChevronLeft, ChevronRight, DollarSign, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { formatInChileanTime, calculateStayDuration, getChileanTime, calculateGarageRate } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import EntryTicketPDF from '@/components/garage/EntryTicketPDF';
import VehicleDetailsDialog from '@/components/garage/VehicleDetailsDialog';


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

const EditStayDialog = ({ stay, isOpen, onOpenChange, onUpdated }) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [entryDate, setEntryDate] = useState('');
  const [entryTime, setEntryTime] = useState('');

  useEffect(() => {
    if (stay) {
      const entry = parseISO(stay.entry_at);
      setEntryDate(format(entry, 'yyyy-MM-dd'));
      setEntryTime(format(entry, 'HH:mm'));
    }
  }, [stay]);

  const handleUpdate = async () => {
    if (!stay || !entryDate || !entryTime) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Debe seleccionar una fecha y hora." });
      return;
    }
    setIsUpdating(true);
    try {
      const newEntryAt = new Date(`${entryDate}T${entryTime}:00`);
      const { error } = await supabase
        .from('garage_stays')
        .update({ entry_at: newEntryAt.toISOString() })
        .eq('id', stay.id);

      if (error) throw error;

      toast({ title: "Estadía actualizada", description: "La fecha de ingreso ha sido modificada." });
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error al actualizar", description: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!stay) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Fecha de Ingreso</DialogTitle>
          <DialogDescription>
            Ajuste la fecha y hora de entrada para la matrícula <span className="font-bold">{stay.garage_vehicles.license_plate}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="entry-date">Fecha de Ingreso</Label>
            <Input id="entry-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-time">Hora de Ingreso</Label>
            <Input id="entry-time" type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ForceExitDialog = ({ stay, onForceExit, isForcingExit }) => {
  const [cost, setCost] = useState(null);
  const [loadingCost, setLoadingCost] = useState(true);

  useEffect(() => {
    const calculateCost = async () => {
      if (!stay) return;
      setLoadingCost(true);
      try {
        const { data: settings, error: settingsError } = await supabase.from('garage_settings').select('*').single();
        if (settingsError || !settings) throw new Error("No se pudieron cargar las tarifas.");
        
        const calculatedCost = calculateGarageRate(
            stay.entry_at, 
            getChileanTime(), 
            settings, 
            stay.garage_vehicles.vehicle_type
        );
        
        setCost(calculatedCost);
      } catch (error) {
        console.error(error);
        setCost(null);
      } finally {
        setLoadingCost(false);
      }
    };
    calculateCost();
  }, [stay]);

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Forzar Salida?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acción marcará el vehículo con matrícula <span className="font-bold text-destructive">{stay.garage_vehicles.license_plate}</span> como salido.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {loadingCost ? (
        <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : cost !== null && (
        <div className="p-3 bg-secondary rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>Monto a cobrar:</span>
          </div>
          <span className="font-bold text-lg text-primary">${cost.toLocaleString('es-CL')}</span>
        </div>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isForcingExit}>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={() => onForceExit(cost)} disabled={isForcingExit || loadingCost} className="bg-destructive hover:bg-destructive/90">
          {isForcingExit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sí, forzar salida'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};


const ParkedVehicles = () => {
  const { toast } = useToast();
  const [activeStays, setActiveStays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStayForExit, setSelectedStayForExit] = useState(null);
  const [selectedStayForEdit, setSelectedStayForEdit] = useState(null);
  const [selectedStayForDetails, setSelectedStayForDetails] = useState(null);
  const [isForcingExit, setIsForcingExit] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 30;

  const fetchActiveStays = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('garage_stays')
        .select('*, garage_vehicles(*)')
        .eq('status', 'activo')
        .order('entry_at', { ascending: false });
      if (error) throw error;
      setActiveStays(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error al cargar vehículos", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchActiveStays();
    const channel = supabase
      .channel('parked-vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garage_stays' }, fetchActiveStays)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchActiveStays]);

  const filteredStays = useMemo(() => {
    setCurrentPage(1);
    return activeStays.filter(stay =>
      stay.garage_vehicles.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stay.garage_vehicles.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stay.garage_vehicles.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, activeStays]);
  
  const paginatedStays = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredStays.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredStays, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredStays.length / rowsPerPage);

  const handleForceExit = async (cost) => {
    if (!selectedStayForExit) return;
    setIsForcingExit(true);
    try {
      const { error } = await supabase.from('garage_stays').update({
        status: 'finalizado',
        exit_at: getChileanTime().toISOString(),
        total_paid_clp: cost
      }).eq('id', selectedStayForExit.id);
      if (error) throw error;
      toast({
        title: "Salida Forzada Registrada",
        description: `El vehículo ${selectedStayForExit.garage_vehicles.license_plate} ha sido marcado como salido con un costo de $${cost.toLocaleString('es-CL')}.`
      });
      fetchActiveStays();
    } catch (error) {
      toast({ variant: "destructive", title: "Error al forzar salida", description: error.message });
    } finally {
      setIsForcingExit(false);
      setSelectedStayForExit(null);
    }
  };

  const handleEdit = (stay) => {
    setSelectedStayForEdit(stay);
    setIsEditDialogOpen(true);
  };

  const handleViewDetails = (stay) => {
    setSelectedStayForDetails(stay);
    setIsDetailsOpen(true);
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

  return (
    <>
      <motion.div className="p-4 sm:p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Vehículos Estacionados (Administrador)</h1>
          <p className="text-muted-foreground">Visualice, edite y gestione los vehículos activos en el garaje.</p>
        </header>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-grow">
                <CardTitle>Vehículos Activos ({filteredStays.length})</CardTitle>
                <CardDescription>Total de vehículos actualmente en el garaje.</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por matrícula, tipo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead className="hidden lg:table-cell">País</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Estadía</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">
                      <div className="flex justify-center items-center gap-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span>Cargando vehículos...</span></div>
                    </TableCell></TableRow>
                  ) : paginatedStays.length > 0 ? (
                    paginatedStays.map(stay => (
                      <TableRow key={stay.id}>
                        <TableCell className="font-medium">{stay.garage_vehicles.license_plate}</TableCell>
                        <TableCell className="hidden md:table-cell">{stay.garage_vehicles.vehicle_type}</TableCell>
                        <TableCell className="hidden lg:table-cell">{stay.garage_vehicles.country}</TableCell>
                        <TableCell>{formatInChileanTime(stay.entry_at, 'dd/MM/yy, HH:mm')}</TableCell>
                        <StayDurationCell entryAt={stay.entry_at} />
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleViewDetails(stay)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" onClick={() => handlePrintTicket(stay)}><Printer className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" onClick={() => handleEdit(stay)}><Edit className="h-4 w-4" /></Button>
                            <AlertDialog onOpenChange={open => !open && setSelectedStayForExit(null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" onClick={() => setSelectedStayForExit(stay)}><LogOut className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              {selectedStayForExit && selectedStayForExit.id === stay.id && (
                                <ForceExitDialog stay={selectedStayForExit} onForceExit={handleForceExit} isForcingExit={isForcingExit} />
                              )}
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">No se encontraron vehículos activos.</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Mostrando {paginatedStays.length} de {filteredStays.length} vehículos.
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4" /> Anterior
                          </Button>
                          <span className="text-sm">Página {currentPage} de {totalPages}</span>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                            Siguiente <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <EditStayDialog 
        stay={selectedStayForEdit} 
        isOpen={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        onUpdated={() => {
          fetchActiveStays();
          setSelectedStayForEdit(null);
        }}
      />
      <VehicleDetailsDialog 
        stay={selectedStayForDetails}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </>
  );
};
export default ParkedVehicles;
