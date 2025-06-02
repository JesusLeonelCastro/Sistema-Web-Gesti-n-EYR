
import React, { useState, useMemo, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ParkingSquare, Search, XCircle, LogOut, Edit, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PaginationControls from '@/components/PaginationControls';
import { formatDate, calculateStayDuration, vehicleTypeIcons } from '@/lib/parkingUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Added Dialog, DialogContent
import TrailerDetailsDialog from '@/pages/admin/components/TrailerDetailsDialog';
import EditEntryTimeForm from '@/pages/admin/components/EditEntryTimeForm';

const ITEMS_PER_PAGE = 10;

const AdminParkedTrailersPage = () => {
  const [parkedTrailers, setParkedTrailers] = useLocalStorage('parked_trailers', []);
  const [trailerHistory, setTrailerHistory] = useLocalStorage('trailer_history', []);
  const [settings] = useLocalStorage('parking_settings', { dailyRate: 50, currencySymbol: 'Bs.', vehicleTypeRates: {} });
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrailerDetails, setSelectedTrailerDetails] = useState(null);
  const [editingTrailer, setEditingTrailer] = useState(null);
  const [showForceExitDialog, setShowForceExitDialog] = useState(false);
  const [trailerToForceExit, setTrailerToForceExit] = useState(null);
  const [forceExitNotes, setForceExitNotes] = useState('');

  const { toast } = useToast();

  const getRateForVehicle = useCallback((vehicleType) => {
    const specificRate = settings.vehicleTypeRates?.[vehicleType];
    if (specificRate !== undefined && specificRate !== null && specificRate !== '' && !isNaN(Number(specificRate)) && Number(specificRate) > 0) {
      return Number(specificRate);
    }
    return settings.dailyRate;
  }, [settings.vehicleTypeRates, settings.dailyRate]);

  const filteredParkedTrailers = useMemo(() => {
    return parkedTrailers
      .filter(trailer => trailer.status === 'parked')
      .filter(trailer =>
        trailer.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trailer.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trailer.vehicleType && trailer.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (trailer.description && trailer.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
  }, [parkedTrailers, searchTerm]);

  const totalPages = Math.ceil(filteredParkedTrailers.length / ITEMS_PER_PAGE);
  const paginatedTrailers = filteredParkedTrailers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOpenForceExitDialog = (trailer) => {
    setTrailerToForceExit(trailer);
    setShowForceExitDialog(true);
  };

  const handleConfirmForceExit = (exitingTrailerData) => {
    if (!exitingTrailerData) return;
  
    const exitTime = new Date();
    const entryTime = new Date(exitingTrailerData.entryTime);
    let durationMs = exitTime - entryTime;
    if (durationMs < 0) durationMs = 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const durationDays = Math.ceil(durationMs / oneDayMs);
    const finalDurationDays = durationDays < 1 ? 1 : durationDays;
    
    const rate = getRateForVehicle(exitingTrailerData.vehicleType);
    const calculatedFee = finalDurationDays * rate;
  
    const exitedTrailer = {
      ...exitingTrailerData,
      exitTime: exitTime.toISOString(),
      status: 'exited',
      forcedExit: true,
      exitNotes: exitingTrailerData.exitNotes || "Salida forzada por administrador.",
      durationDays: finalDurationDays,
      calculatedFee: calculatedFee,
      type: 'exit',
      exitOperatorId: user?.id,
      exitOperatorName: user?.name || user?.username || 'Sistema (Admin)',
    };
  
    setParkedTrailers(prev => prev.filter(t => t.id !== exitingTrailerData.id));
    setTrailerHistory(prev => [...prev.filter(h => h.id !== exitingTrailerData.id), exitedTrailer]);
  
    toast({
      title: "Salida Forzada Registrada",
      description: `El vehículo ${exitedTrailer.plate} ha sido marcado como salido. Tarifa: ${settings.currencySymbol} ${calculatedFee.toFixed(2)}.`,
      variant: "warning",
    });
  
    setShowForceExitDialog(false); 
    setTrailerToForceExit(null); 
    setForceExitNotes(''); 
    setSelectedTrailerDetails(null); 
  };
  
  const handleUpdateEntryTime = (trailerToUpdate, newEntryTimeISO) => {
    setParkedTrailers(prevTrailers =>
     prevTrailers.map(t =>
       t.id === trailerToUpdate.id ? { ...t, entryTime: newEntryTimeISO } : t
     )
   );
   setTrailerHistory(prevHistory =>
       prevHistory.map(item => 
           item.id === trailerToUpdate.id ? { ...item, entryTime: newEntryTimeISO } : item
       )
   );
 
   if (selectedTrailerDetails && selectedTrailerDetails.id === trailerToUpdate.id) {
    setSelectedTrailerDetails(prev => ({...prev, entryTime: newEntryTimeISO}));
   }
   
   setEditingTrailer(null); 
   
   toast({
     title: "Hora de Entrada Actualizada",
     description: `La hora de entrada para el vehículo ${trailerToUpdate.plate} ha sido modificada.`,
   });
 };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <ParkingSquare className="w-8 h-8 mr-3 text-green-500" />
            Vehículos Estacionados
          </CardTitle>
          <CardDescription className="text-lg">
            Gestiona los vehículos actualmente en el estacionamiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between my-4">
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por matrícula, país..."
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                className="pl-10 bg-muted/50 focus:bg-background"
              />
              {searchTerm && (
                <Button variant="ghost" size="icon" onClick={() => {setSearchTerm(''); setCurrentPage(1);}} title="Limpiar búsqueda" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8">
                  <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              Total Estacionados: {filteredParkedTrailers.length}
            </p>
          </div>

          {paginatedTrailers.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">País</TableHead>
                  <TableHead className="hidden md:table-cell">Entrada</TableHead>
                  <TableHead>Estadía</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrailers.map((trailer, index) => {
                  const IconComponent = vehicleTypeIcons[trailer.vehicleType] || vehicleTypeIcons["Default"];
                  return (
                  <motion.tr 
                    key={trailer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-primary/5"
                  >
                    <TableCell className="font-medium text-primary">{trailer.plate}</TableCell>
                    <TableCell className="flex items-center">
                      <IconComponent className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{trailer.vehicleType || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{trailer.country}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(trailer.entryTime)}</TableCell>
                    <TableCell>{calculateStayDuration(trailer.entryTime)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedTrailerDetails(trailer)} title="Ver Detalles">
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                       <Button variant="ghost" size="icon" onClick={() => setEditingTrailer(trailer)} title="Editar Hora de Entrada">
                        <Edit className="h-4 w-4 text-yellow-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenForceExitDialog(trailer)} title="Forzar Salida">
                        <LogOut className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                )})}
              </TableBody>
            </Table>
            </div>
          ) : (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-center text-muted-foreground py-10"
            >
              {searchTerm ? "No se encontraron vehículos que coincidan con la búsqueda." : "No hay vehículos estacionados."}
            </motion.p>
          )}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={parkedTrailers.filter(t => t.status === 'parked').length}
            filteredItemsCount={filteredParkedTrailers.length}
          />
        </CardContent>
      </Card>

      {selectedTrailerDetails && (
        <TrailerDetailsDialog
          trailer={selectedTrailerDetails}
          isOpen={!!selectedTrailerDetails}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedTrailerDetails(null);
          }}
          settings={settings}
          getRateForVehicle={getRateForVehicle}
          onForceExitRequest={handleOpenForceExitDialog} 
          onEditRequest={() => {
            setEditingTrailer(selectedTrailerDetails);
            setSelectedTrailerDetails(null); 
          }}
        />
      )}
      
      {editingTrailer && (
        <Dialog open={!!editingTrailer} onOpenChange={(isOpen) => { if (!isOpen) setEditingTrailer(null); }}>
          <DialogContent>
             <EditEntryTimeForm
              trailer={editingTrailer}
              onSave={(trailerId, newTime) => handleUpdateEntryTime(editingTrailer, newTime.toISOString())}
              onCancel={() => setEditingTrailer(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showForceExitDialog} onOpenChange={setShowForceExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Salida Forzada</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres forzar la salida del vehículo <span className="font-semibold">{trailerToForceExit?.plate}</span>? Esta acción no se puede deshacer.
              <div className="mt-4">
                <label htmlFor="forceExitNotesMain" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notas de Salida Forzada (Opcional)
                </label>
                <Input
                  id="forceExitNotesMain"
                  value={forceExitNotes}
                  onChange={(e) => setForceExitNotes(e.target.value)}
                  placeholder="Ej: No pagó, abandonado, etc."
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setTrailerToForceExit(null); setForceExitNotes('');}}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleConfirmForceExit({...trailerToForceExit, exitNotes: forceExitNotes})} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Forzar Salida
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </motion.div>
  );
};

export default AdminParkedTrailersPage;
