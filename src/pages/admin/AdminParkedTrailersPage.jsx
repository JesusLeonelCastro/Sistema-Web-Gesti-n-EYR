import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { motion } from 'framer-motion';
import { Truck, Flag, Clock, Search, XCircle, Package, Car, ParkingSquare, Eye } from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TrailerDetailsDialog from '@/pages/admin/components/TrailerDetailsDialog';
import { formatDate, calculateStayDuration, vehicleTypeIcons } from '@/lib/parkingUtils';

const ITEMS_PER_PAGE = 25;

const AdminParkedTrailersPage = () => {
  const [parkedTrailers, setParkedTrailers] = useLocalStorage('parked_trailers', []);
  const [trailerHistory, setTrailerHistory] = useLocalStorage('trailer_history', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [settings] = useLocalStorage('parking_settings', { dailyRate: 50, totalSpots: 50, currencySymbol: 'Bs.', vehicleTypeRates: {} });
  const { toast } = useToast();
  const [selectedTrailerForDialog, setSelectedTrailerForDialog] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const getRateForVehicle = (vehicleType) => {
    const specificRate = settings.vehicleTypeRates?.[vehicleType];
    if (specificRate !== undefined && specificRate !== null && specificRate !== '' && !isNaN(Number(specificRate)) && Number(specificRate) > 0) {
      return Number(specificRate);
    }
    return settings.dailyRate;
  };

  const filteredTrailers = useMemo(() => {
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

  const totalPages = Math.ceil(filteredTrailers.length / ITEMS_PER_PAGE);
  const paginatedTrailers = filteredTrailers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openViewDialog = (trailer) => {
    setSelectedTrailerForDialog(trailer);
    setIsViewDialogOpen(true);
  };

  const handleForceExit = (trailerToExit) => {
    const exitTime = new Date();
    const entryTime = new Date(trailerToExit.entryTime);
    const durationMs = exitTime - entryTime;
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    const rate = getRateForVehicle(trailerToExit.vehicleType);
    const fee = durationDays * rate;

    const updatedTrailer = {
      ...trailerToExit,
      status: 'exited',
      exitTime: exitTime.toISOString(),
      durationDays,
      fee,
      forcedExit: true,
    };

    setParkedTrailers(prev => prev.filter(t => t.id !== trailerToExit.id));
    setTrailerHistory(prev => [...prev, { ...updatedTrailer, type: 'exit' }]);

    toast({
      title: "Salida Forzada Registrada",
      description: `El vehículo ${trailerToExit.plate} ha sido marcado como salido. Tarifa: ${settings.currencySymbol}${fee.toFixed(2)}.`,
      variant: "default"
    });
    setIsViewDialogOpen(false);
    setSelectedTrailerForDialog(null);
  };

  const handleUpdateEntryTime = (trailerToUpdate, newEntryTime) => {
    setParkedTrailers(prev => prev.map(t => 
      t.id === trailerToUpdate.id ? { ...t, entryTime: newEntryTime.toISOString() } : t
    ));
    setTrailerHistory(prev => prev.map(h => {
      if (h.id === trailerToUpdate.id) {
        if (h.type === 'entry') {
          return { ...h, entryTime: newEntryTime.toISOString() };
        } else if (h.type === 'exit') {
          // Recalculate duration and fee for exit records
          const entry = newEntryTime;
          const exit = new Date(h.exitTime);
          const durationMs = exit - entry;
          const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
          const rate = getRateForVehicle(h.vehicleType);
          const fee = durationDays * rate;
          return { ...h, entryTime: newEntryTime.toISOString(), durationDays, fee };
        }
      }
      return h;
    }));
    toast({
      title: "Fecha de Entrada Actualizada",
      description: `La fecha de entrada para ${trailerToUpdate.plate} ha sido actualizada.`,
    });
    if (selectedTrailerForDialog && selectedTrailerForDialog.id === trailerToUpdate.id) {
      setSelectedTrailerForDialog(prev => ({...prev, entryTime: newEntryTime.toISOString()}));
    }
  };


  return (
     <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col"
    >
      <Card className="flex-grow flex flex-col">
        <CardHeader>
            <CardTitle className="text-3xl flex items-center">
              <ParkingSquare className="w-8 h-8 mr-3 text-primary" />
              Vehículos Estacionados Actualmente
            </CardTitle>
            <CardDescription className="text-lg">
              Gestiona los vehículos que se encuentran dentro del estacionamiento.
            </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow flex flex-col">
            <div className="flex items-center justify-between my-4 gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                    type="text"
                    placeholder="Buscar por matrícula, país, tipo..."
                    value={searchTerm}
                    onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                    className="pl-10 bg-muted/50 focus:bg-background w-full"
                    />
                    {searchTerm && (
                    <Button variant="ghost" size="icon" onClick={() => {setSearchTerm(''); setCurrentPage(1);}} title="Limpiar búsqueda" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8">
                        <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                    )}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto">
                {paginatedTrailers.length > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
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
                            transition={{ delay: index * 0.03 }}
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
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="sm" onClick={() => openViewDialog(trailer)}>
                                <Eye className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Ver</span>
                              </Button>
                            </TableCell>
                        </motion.tr>
                        )})}
                    </TableBody>
                    </Table>
                </motion.div>
                ) : (
                <motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="text-center text-muted-foreground py-10"
                >
                    {searchTerm ? `No se encontraron vehículos que coincidan con "${searchTerm}".` : "No hay vehículos estacionados."}
                </motion.p>
                )}
            </div>
            <div className="mt-auto pt-4 border-t">
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={parkedTrailers.filter(t => t.status === 'parked').length}
                    filteredItemsCount={filteredTrailers.length}
                />
            </div>
        </CardContent>
      </Card>

      {selectedTrailerForDialog && (
        <TrailerDetailsDialog
          isOpen={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          trailer={selectedTrailerForDialog}
          onForceExit={handleForceExit}
          onUpdateEntryTime={handleUpdateEntryTime}
          settings={settings}
          getRateForVehicle={getRateForVehicle}
        />
      )}
    </motion.div>
  );
};

export default AdminParkedTrailersPage;