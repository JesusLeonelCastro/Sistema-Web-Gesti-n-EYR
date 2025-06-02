import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Search, XCircle, CalendarDays, Eye, Printer, Download, ShoppingCart, User, Clock, CheckCircle, X, AlertTriangle, UserCog } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import useLocalStorage from '@/hooks/useLocalStorage';
import { formatDate } from '@/lib/parkingUtils';
import { generateOrderTicketPDF, generateOrdersHistoryPDF } from '@/lib/pdfGenerator';
import PaginationControls from '@/components/PaginationControls';
import { useToast } from '@/components/ui/use-toast';
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 15;

const RestaurantAdminOrdersPage = () => {
  const [ordersHistory] = useLocalStorage('restaurant_orders_history', []);
  const [settings] = useLocalStorage('restaurant_settings', { currencySymbol: 'Bs.', restaurantName: 'San Jose Restaurante' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { toast } = useToast();

  const filteredOrders = useMemo(() => {
    let items = ordersHistory;
    if (filterDate) {
        items = items.filter(item => {
            const itemDate = new Date(item.orderTime);
            const filterDateObj = new Date(filterDate + "T00:00:00"); 
            return itemDate.getFullYear() === filterDateObj.getFullYear() &&
                   itemDate.getMonth() === filterDateObj.getMonth() &&
                   itemDate.getDate() === filterDateObj.getDate();
        });
    }
    if (searchTerm) {
      items = items.filter(item =>
        (item.displayId && item.displayId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.customerName && item.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.operatorName && item.operatorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.items.some(dish => dish.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return items.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
  }, [ordersHistory, searchTerm, filterDate]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDownloadPDF = () => {
    if (filteredOrders.length === 0) {
        toast({ title: "No hay datos", description: "No hay pedidos para generar el PDF.", variant: "destructive" });
        return;
    }
    generateOrdersHistoryPDF(filteredOrders, settings);
    toast({ title: "PDF Generado", description: "El historial de pedidos se ha descargado." });
  };

  const handlePrintTicket = (order) => {
    generateOrderTicketPDF(order, settings);
    toast({ title: "Ticket Generado", description: `Ticket para el pedido ${order.displayId || order.id.substring(0,8)} listo para imprimir/guardar.` });
  };

  const getStatusRowClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/5 dark:bg-green-700/10 hover:bg-green-500/10 dark:hover:bg-green-700/20';
      case 'pending':
        return 'bg-yellow-500/5 dark:bg-yellow-700/10 hover:bg-yellow-500/10 dark:hover:bg-yellow-700/20';
      case 'cancelled':
        return 'bg-red-500/5 dark:bg-red-700/10 hover:bg-red-500/10 dark:hover:bg-red-700/20';
      default:
        return 'hover:bg-primary/5';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Completado</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 flex items-center"><Clock className="w-3 h-3 mr-1" />Pendiente</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200 flex items-center"><X className="w-3 h-3 mr-1" />Cancelado</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" />Desconocido</span>;
    }
  };


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl flex items-center">
                <FileSpreadsheet className="w-8 h-8 mr-3 text-amber-500" />
                Historial de Pedidos
              </CardTitle>
              <CardDescription className="text-lg">
                Consulta todos los pedidos registrados del restaurante.
              </CardDescription>
            </div>
            <Button onClick={handleDownloadPDF} disabled={filteredOrders.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between my-4 gap-4">
            <div className="relative flex-grow w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por ID, cliente, operador, plato..."
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
          </div>

          {paginatedOrders.length > 0 ? (
             <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><ShoppingCart className="inline-block mr-1 h-4 w-4" />ID Pedido</TableHead>
                  <TableHead><Clock className="inline-block mr-1 h-4 w-4" />Fecha y Hora</TableHead>
                  <TableHead className="hidden sm:table-cell"><User className="inline-block mr-1 h-4 w-4" />Cliente</TableHead>
                  <TableHead>Total ({settings.currencySymbol})</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead><UserCog className="inline-block mr-1 h-4 w-4" />Operador</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order, index) => (
                  <motion.tr 
                    key={order.id + index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn("transition-colors", getStatusRowClass(order.status))}
                  >
                    <TableCell className="font-mono text-xs text-primary">{order.displayId || order.id.substring(0,12)}</TableCell>
                    <TableCell>{formatDate(order.orderTime, true)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{order.customerName || 'N/A'}</TableCell>
                    <TableCell className="font-semibold">{order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                        {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{order.operatorName || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)} title="Ver Detalles">
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePrintTicket(order)} title="Imprimir Ticket">
                        <Printer className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-center text-muted-foreground py-10"
              >
                {searchTerm || filterDate ? `No se encontraron pedidos que coincidan con los filtros.` : "No hay historial de pedidos."}
            </motion.p>
          )}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={ordersHistory.length}
            filteredItemsCount={filteredOrders.length}
          />
        </CardContent>
      </Card>

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-lg">
            <DialogHeader>
              <DialogTitle>Detalles del Pedido #{selectedOrder.displayId || selectedOrder.id.substring(0,8)}</DialogTitle>
              <DialogDescription>
                Cliente: {selectedOrder.customerName || 'N/A'} | Fecha: {formatDate(selectedOrder.orderTime, true)} <br/>
                Operador: {selectedOrder.operatorName || 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-60 overflow-y-auto">
              <h4 className="font-semibold mb-2">Platillos:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {selectedOrder.items.map(item => (
                  <li key={item.id}>{item.name} (x{item.quantity}) - {settings.currencySymbol} {(item.price * item.quantity).toFixed(2)}</li>
                ))}
              </ul>
              <p className="font-bold mt-3 text-right">Total: {settings.currencySymbol} {selectedOrder.totalAmount?.toFixed(2)}</p>
              <div className="text-sm mt-1 text-right">Estado: {getStatusBadge(selectedOrder.status)}</div>
              {selectedOrder.notes && <p className="text-xs mt-2 text-muted-foreground">Notas: {selectedOrder.notes}</p>}
            </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
                <Button onClick={() => {handlePrintTicket(selectedOrder); setSelectedOrder(null);}}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir Ticket
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default RestaurantAdminOrdersPage;