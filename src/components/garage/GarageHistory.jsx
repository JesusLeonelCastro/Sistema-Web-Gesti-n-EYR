import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { formatInChileanTime } from '@/lib/utils';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import GarageHistoryPDF from '@/components/garage/GarageHistoryPDF';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Printer, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

const GarageHistory = () => {
  const { toast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entryDateFilter, setEntryDateFilter] = useState('');
  const [exitDateFilter, setExitDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 30;

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const filters = {
        searchTerm,
        entryDateFilter,
        exitDateFilter,
        statusFilter,
      };
      const blob = await pdf(<GarageHistoryPDF data={filteredHistory} totalRevenue={totalRevenue} filters={filters} />).toBlob();
      const fileName = `Historial-Garaje-San-Jose-${new Date().toISOString().slice(0, 10)}.pdf`;
      saveAs(blob, fileName);
      toast({
        title: "Reporte Generado",
        description: "El PDF con el historial del garaje se ha descargado.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error al generar el PDF",
        description: "No se pudo crear el reporte en PDF.",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('garage_stays')
          .select('*, garage_vehicles(*), profiles(full_name)')
          .order('entry_at', { ascending: false });

        if (error) throw error;
        setHistory(data);
      } catch (error) {
        toast({
          variant: "destructive", title: "Error al cargar el historial", description: error.message,
        });
      } finally { setLoading(false); }
    };
    fetchHistory();
  }, [toast]);
  
  const filteredHistory = useMemo(() => {
    setCurrentPage(1);
    return history.filter(stay => {
        const vehicle = stay.garage_vehicles;
        if (!vehicle) return false;
        const matchesSearch = 
            vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (vehicle.vehicle_type && vehicle.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (vehicle.country && vehicle.country.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesEntryDate = !entryDateFilter || format(parseISO(stay.entry_at), 'yyyy-MM-dd') === entryDateFilter;
        const matchesExitDate = !exitDateFilter || (stay.exit_at && format(parseISO(stay.exit_at), 'yyyy-MM-dd') === exitDateFilter);
        const matchesStatus = statusFilter === 'todos' || stay.status === statusFilter;

        return matchesSearch && matchesEntryDate && matchesExitDate && matchesStatus;
    });
  }, [searchTerm, entryDateFilter, exitDateFilter, statusFilter, history]);
  
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredHistory.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredHistory, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage);

  useEffect(() => {
    const revenue = filteredHistory
      .filter(stay => stay.status === 'finalizado')
      .reduce((acc, stay) => acc + (stay.total_paid_clp || 0), 0);
    setTotalRevenue(revenue);
  }, [filteredHistory]);

  return (
    <motion.div className="p-4 sm:p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historial del Garaje</h1>
          <p className="text-muted-foreground">Todos los movimientos registrados en el sistema.</p>
        </div>
        <Button onClick={handlePrint} disabled={isPrinting}>
          {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
          Exportar a PDF
        </Button>
      </header>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ganancias Totales (Filtradas)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalRevenue.toLocaleString('es-CL')}</div>
          <p className="text-xs text-muted-foreground">Suma de estadías finalizadas en la vista actual.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Historial de Movimientos</CardTitle>
              <CardDescription>Busca y filtra todos los registros de estadías.</CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-48">
                <Label htmlFor="search" className="sr-only">Buscar</Label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="search" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
              </div>
              <div className="grid gap-1.5 flex-grow sm:flex-grow-0">
                <Label htmlFor="entry-date">Fecha Ingreso</Label>
                <Input id="entry-date" type="date" value={entryDateFilter} onChange={(e) => setEntryDateFilter(e.target.value)} className="w-full" />
              </div>
              <div className="grid gap-1.5 flex-grow sm:flex-grow-0">
                <Label htmlFor="exit-date">Fecha Salida</Label>
                <Input id="exit-date" type="date" value={exitDateFilter} onChange={(e) => setExitDateFilter(e.target.value)} className="w-full" />
              </div>
              <div className="grid gap-1.5 flex-grow sm:flex-grow-0">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead className="text-right">Total Pagado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                ) : paginatedHistory.length > 0 ? (
                  paginatedHistory.map((stay) => (
                    <TableRow key={stay.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{stay.garage_vehicles?.license_plate}</TableCell>
                      <TableCell className="text-muted-foreground">{stay.garage_vehicles?.vehicle_type}</TableCell>
                      <TableCell>{formatInChileanTime(stay.entry_at, 'dd/MM/yy, HH:mm')}</TableCell>
                      <TableCell>{stay.exit_at ? formatInChileanTime(stay.exit_at, 'dd/MM/yy, HH:mm') : 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stay.status === 'activo' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                          {stay.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{stay.profiles?.full_name || 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold">${(stay.total_paid_clp || 0).toLocaleString('es-CL')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">No se encontraron registros.</TableCell></TableRow>
                )}
              </TableBody>
               <TableFooter>
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-sm text-muted-foreground">
                          Mostrando {paginatedHistory.length} de {filteredHistory.length} registros.
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
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GarageHistory;