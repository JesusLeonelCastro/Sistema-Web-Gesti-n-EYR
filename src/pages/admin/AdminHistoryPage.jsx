
import React, { useState, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from 'framer-motion';
import { History, Search, XCircle, Download, CalendarDays, Filter, ArrowUpDown, User as UserIcon, Ticket } from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';
import { formatDate, calculateStayDuration, vehicleTypeIcons } from '@/lib/parkingUtils';
import { generateHistoryPDF, generateEntryTicketPDF } from '@/lib/pdfGenerator';
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';

const ITEMS_PER_PAGE = 20;

const HistoryTable = ({ historyItems, settings, totalCalculatedFee, onGenerateTicket }) => {
  if (!historyItems || historyItems.length === 0) {
    return null;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Matrícula</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="hidden sm:table-cell">Entrada</TableHead>
          <TableHead className="hidden sm:table-cell">Op. Entrada</TableHead>
          <TableHead className="hidden sm:table-cell">Salida</TableHead>
          <TableHead className="hidden sm:table-cell">Op. Salida</TableHead>
          <TableHead>Estadía</TableHead>
          <TableHead className="text-right">Tarifa ({settings.currencySymbol})</TableHead>
          <TableHead className="text-center">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {historyItems.map((item, index) => {
          const IconComponent = vehicleTypeIcons[item.vehicleType] || vehicleTypeIcons["Default"];
          
          let rowClassName = "hover:bg-primary/5";
          let exitCellText = item.exitTime ? formatDate(item.exitTime) : <span className="text-muted-foreground">---------------</span>;
          let exitCellClassName = "hidden sm:table-cell";

          if (item.forcedExit) {
            rowClassName = cn(rowClassName, 'bg-yellow-500/10 dark:bg-yellow-700/20');
          } else if (item.status === 'exited') {
            rowClassName = cn(rowClassName, 'bg-red-500/5 dark:bg-red-700/10');
            exitCellClassName = cn(exitCellClassName, "text-red-600 dark:text-red-400");
          } else if (!item.exitTime) { 
            rowClassName = cn(rowClassName, 'bg-green-500/5 dark:bg-green-700/10');
            exitCellClassName = cn(exitCellClassName, "text-green-600 dark:text-green-400");
          }

          return (
            <motion.tr
              key={item.id + (item.exitTime || '') + index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={rowClassName}
            >
              <TableCell className="font-medium text-primary">{item.plate}</TableCell>
              <TableCell className="flex items-center">
                <IconComponent className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{item.vehicleType || 'N/A'}</span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{formatDate(item.entryTime)}</TableCell>
              <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{item.entryOperatorName || 'N/A'}</TableCell>
              <TableCell className={exitCellClassName}>
                {exitCellText}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{item.exitOperatorName || 'N/A'}</TableCell>
              <TableCell>
                {item.exitTime ? calculateStayDuration(item.entryTime, item.exitTime) : calculateStayDuration(item.entryTime)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {item.status === 'exited' ? (item.calculatedFee !== undefined ? item.calculatedFee.toFixed(2) : 'N/A') : 'N/A'}
                {item.forcedExit && <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-1">(Forzada)</span>}
              </TableCell>
              <TableCell className="text-center">
                {item.type === 'entry' || (item.status === 'parked' && !item.exitTime) || (item.status === 'exited' && item.entryTime) ? (
                  <Button variant="ghost" size="icon" onClick={() => onGenerateTicket(item)} title="Generar Ticket de Ingreso">
                    <Ticket className="h-4 w-4 text-blue-500" />
                  </Button>
                ) : null}
              </TableCell>
            </motion.tr>
          )
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={8} className="text-right font-bold text-lg">Total Tarifas (Visibles):</TableCell>
          <TableCell className="text-right font-bold text-lg">{settings.currencySymbol} {totalCalculatedFee.toFixed(2)}</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};


const AdminHistoryPage = () => {
  const [trailerHistory] = useLocalStorage('trailer_history', []);
  const [settings] = useLocalStorage('parking_settings', { dailyRate: 50, currencySymbol: 'Bs.', vehicleTypeRates: {}, parkingName: 'San Jose Parking' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const getRateForVehicle = (vehicleType) => {
    const specificRate = settings.vehicleTypeRates?.[vehicleType];
    if (specificRate !== undefined && specificRate !== null && specificRate !== '' && !isNaN(Number(specificRate)) && Number(specificRate) > 0) {
      return Number(specificRate);
    }
    return settings.dailyRate;
  };

  const enrichedHistory = useMemo(() => {
    return trailerHistory.map(item => {
      const rate = getRateForVehicle(item.vehicleType);
      const fee = item.status === 'exited' && item.durationDays !== undefined ? item.durationDays * rate : item.fee;
      return { ...item, calculatedFee: fee };
    });
  }, [trailerHistory, settings]);


  const filteredHistory = useMemo(() => {
    let items = enrichedHistory;
    if (filterDate) {
        items = items.filter(item => {
            const itemDate = new Date(item.exitTime || item.entryTime);
            const filterDateObj = new Date(filterDate + "T00:00:00");
            return itemDate.getFullYear() === filterDateObj.getFullYear() &&
                   itemDate.getMonth() === filterDateObj.getMonth() &&
                   itemDate.getDate() === filterDateObj.getDate();
        });
    }
    if (movementTypeFilter === 'entry') {
        items = items.filter(item => item.status === 'parked' || !item.exitTime);
    } else if (movementTypeFilter === 'exit') {
        items = items.filter(item => item.status === 'exited' && item.exitTime);
    }

    if (searchTerm) {
      items = items.filter(item =>
        item.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.country && item.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.vehicleType && item.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.entryOperatorName && item.entryOperatorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.exitOperatorName && item.exitOperatorName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return items.sort((a, b) => new Date(b.exitTime || b.entryTime) - new Date(a.exitTime || a.entryTime));
  }, [enrichedHistory, searchTerm, filterDate, movementTypeFilter]);

  const totalCalculatedFeeForFiltered = useMemo(() => {
    return filteredHistory.reduce((sum, item) => {
        return sum + (item.status === 'exited' && item.calculatedFee ? item.calculatedFee : 0);
    }, 0);
  }, [filteredHistory]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDownloadPDF = () => {
    generateHistoryPDF(filteredHistory, settings, totalCalculatedFeeForFiltered);
  };

  const handleGenerateEntryTicket = (vehicleEntry) => {
    if (!vehicleEntry || !vehicleEntry.entryTime) {
        toast({
            title: "Error al generar ticket",
            description: "No hay suficiente información para generar el ticket de entrada.",
            variant: "destructive",
        });
        return;
    }
    generateEntryTicketPDF(vehicleEntry, settings);
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col"
    >
      <Card className="flex-grow flex flex-col shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <History className="w-8 h-8 mr-3 text-primary" />
            Historial de Movimientos
          </CardTitle>
          <CardDescription className="text-lg">
            Consulta todos los registros de entrada y salida de vehículos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por matrícula, operador..."
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
            <div className="relative flex-grow">
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
            <div className="relative flex-grow">
                <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Select value={movementTypeFilter} onValueChange={(value) => {setMovementTypeFilter(value); setCurrentPage(1);}}>
                    <SelectTrigger className="pl-10 bg-muted/50 focus:bg-background w-full">
                        <SelectValue placeholder="Tipo de Movimiento" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Movimientos</SelectItem>
                        <SelectItem value="entry">Solo Entradas (Estacionados)</SelectItem>
                        <SelectItem value="exit">Solo Salidas</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleDownloadPDF} className="w-full lg:w-auto">
              <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
          </div>

          <div className="flex-grow overflow-y-auto">
            {paginatedHistory.length > 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <HistoryTable 
                    historyItems={paginatedHistory} 
                    settings={settings} 
                    totalCalculatedFee={totalCalculatedFeeForFiltered}
                    onGenerateTicket={handleGenerateEntryTicket}
                />
              </motion.div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-center text-muted-foreground py-10"
              >
                {searchTerm || filterDate || movementTypeFilter !== 'all' ? `No se encontraron registros que coincidan con los filtros.` : "No hay historial de movimientos."}
              </motion.p>
            )}
          </div>
          <div className="mt-auto pt-4 border-t">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={trailerHistory.length}
              filteredItemsCount={filteredHistory.length}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminHistoryPage;
