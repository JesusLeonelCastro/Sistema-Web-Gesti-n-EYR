import React, { useState, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ListChecks, Truck, Flag, Clock, Search, XCircle, CalendarDays, Package, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaginationControls from '@/components/PaginationControls';

const ITEMS_PER_PAGE = 25;

const vehicleTypeIcons = {
    "Trailer": Truck,
    "Automovil": Car,
    "CamionSolo": Truck,
    "CamionAcoplado": Package,
    "Default": Truck
};

const OperatorActiveTrailersPage = () => {
  const [parkedTrailers] = useLocalStorage('parked_trailers', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'})}`;
  };
  
  const calculateStayDuration = (entryTimeString) => {
    const entryTime = new Date(entryTimeString);
    const now = new Date();
    let diffMs = now - entryTime;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    diffMs -= diffDays * (1000 * 60 * 60 * 24);

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    diffMs -= diffHours * (1000 * 60 * 60);

    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    let durationString = "";
    if (diffDays > 0) durationString += `${diffDays}d `;
    if (diffHours > 0 || diffDays > 0) durationString += `${diffHours}h `; 
    durationString += `${diffMinutes}m`;
    
    return durationString.trim();
  };

  const filteredAndSortedTrailers = useMemo(() => {
    let items = parkedTrailers.filter(trailer => trailer.status === 'parked');

    if (filterDate) {
      items = items.filter(trailer => {
        const entryDate = new Date(trailer.entryTime);
        const filterDateObj = new Date(filterDate + "T00:00:00"); 

        return entryDate.getFullYear() === filterDateObj.getFullYear() &&
               entryDate.getMonth() === filterDateObj.getMonth() &&
               entryDate.getDate() === filterDateObj.getDate();
      });
    }

    if (searchTerm) {
      items = items.filter(trailer => 
        trailer.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trailer.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trailer.vehicleType && trailer.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (trailer.description && trailer.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return items.sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
  }, [parkedTrailers, searchTerm, filterDate]);

  const totalPages = Math.ceil(filteredAndSortedTrailers.length / ITEMS_PER_PAGE);
  const paginatedTrailers = filteredAndSortedTrailers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRegisterExitClick = (plate) => {
    navigate(`/operator/exit-log?plate=${encodeURIComponent(plate)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card/90 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <ListChecks className="w-8 h-8 mr-3 text-primary" />
            Vehículos Activos en Estacionamiento
          </CardTitle>
          <CardDescription className="text-lg">
            Visualiza y gestiona los vehículos actualmente estacionados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="relative flex-grow w-full sm:w-auto">
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
            <div className="relative flex-grow w-full sm:w-auto">
                <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {setFilterDate(e.target.value); setCurrentPage(1);}}
                    className="pl-10 bg-muted/50 focus:bg-background w-full"
                />
                {filterDate && (
                    <Button variant="ghost" size="icon" onClick={() => {setFilterDate(''); setCurrentPage(1);}} title="Limpiar filtro de fecha" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8">
                        <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                )}
            </div>
            <Button onClick={() => navigate('/operator/entry-log')} className="w-full sm:w-auto">
              <Truck className="mr-2 h-4 w-4" /> Registrar Nueva Entrada
            </Button>
          </div>

          {paginatedTrailers.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Truck className="inline-block mr-1 h-4 w-4" />Matrícula</TableHead>
                    <TableHead><Package className="inline-block mr-1 h-4 w-4" />Tipo</TableHead>
                    <TableHead><Flag className="inline-block mr-1 h-4 w-4" />País</TableHead>
                    <TableHead><Clock className="inline-block mr-1 h-4 w-4" />Entrada</TableHead>
                    <TableHead><Clock className="inline-block mr-1 h-4 w-4" />Estadía</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTrailers.map((trailer, index) => {
                    const Icon = vehicleTypeIcons[trailer.vehicleType] || vehicleTypeIcons["Default"];
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
                        <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                        {trailer.vehicleType || 'N/A'}
                      </TableCell>
                      <TableCell>{trailer.country}</TableCell>
                      <TableCell>{formatDate(trailer.entryTime)}</TableCell>
                      <TableCell>{calculateStayDuration(trailer.entryTime)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleRegisterExitClick(trailer.plate)}>
                          Registrar Salida
                        </Button>
                      </TableCell>
                    </motion.tr>
                  )})}
                </TableBody>
              </Table>
            </motion.div>
          ) : (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-center text-muted-foreground py-8"
            >
              {searchTerm || filterDate ? `No se encontraron vehículos que coincidan con los filtros.` : "No hay vehículos estacionados actualmente."}
            </motion.p>
          )}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={parkedTrailers.filter(t => t.status === 'parked').length}
            filteredItemsCount={filteredAndSortedTrailers.length}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OperatorActiveTrailersPage;
