import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Search, Printer, Tag, ChevronLeft, ChevronRight, Eye, DollarSign } from 'lucide-react';
import { formatInChileanTime } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import OrderTicketPDF from '@/components/restaurant/OrderTicketPDF';
import OrderHistoryPDF from '@/components/restaurant/OrderHistoryPDF';
import { Label } from '@/components/ui/label';

const OrderHistory = () => {
    const { toast } = useToast();
    const { categories } = useRestaurant();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('todos');
    const [filteredTotal, setFilteredTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const rowsPerPage = 30;

    const handlePrintTable = async () => {
      setIsPrinting(true);
      try {
        const filters = { searchTerm, dateFilter, categoryFilter };
        const blob = await pdf(<OrderHistoryPDF data={filteredOrders} totalAmount={filteredTotal} filters={filters} />).toBlob();
        const fileName = `Historial-Pedidos-Restaurante-${new Date().toISOString().slice(0, 10)}.pdf`;
        saveAs(blob, fileName);
        toast({
          title: "Reporte Generado",
          description: "El PDF con el historial de pedidos se ha descargado.",
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

    const handlePrintTicket = async (order) => {
        const orderItems = order.restaurant_order_items.map(oi => ({...oi.restaurant_menu_items, quantity: oi.quantity}));
        const orderForTicket = {...order, items: orderItems};
        
        try {
          const blob = await pdf(<OrderTicketPDF order={orderForTicket} />).toBlob();
          const fileName = `TICKET-PEDIDO-${orderForTicket.order_code}.pdf`;
          saveAs(blob, fileName);
          toast({
            title: "Ticket Generado",
            description: `El ticket para el pedido ${orderForTicket.order_code} se ha descargado.`,
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

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };
    
    useEffect(() => {
      const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('restaurant_orders')
                .select('*, profiles(full_name), restaurant_order_items(*, restaurant_menu_items(*, restaurant_categories(name)))')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error al cargar el historial', description: error.message });
        } finally {
            setLoading(false);
        }
      };
      fetchOrders();
    }, [toast]);
    
    const filteredOrders = useMemo(() => {
      setCurrentPage(1);
      return orders.filter(order => {
          const matchesSearch = 
            (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.order_code && order.order_code.toLowerCase().includes(searchTerm.toLowerCase()));

          const orderDate = format(parseISO(order.created_at), 'yyyy-MM-dd');
          const matchesDate = !dateFilter || orderDate === dateFilter;

          const orderCategoryName = order.restaurant_order_items[0]?.restaurant_menu_items?.restaurant_categories?.name;
          const matchesCategory = categoryFilter === 'todos' || (orderCategoryName && orderCategoryName === categoryFilter);

          return matchesSearch && matchesDate && matchesCategory;
        });
    }, [searchTerm, dateFilter, categoryFilter, orders]);

    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredOrders.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredOrders, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

    useEffect(() => {
        const total = filteredOrders
            .filter(order => order.status === 'completado')
            .reduce((sum, order) => sum + (order.total_amount_clp || 0), 0);
        setFilteredTotal(total);
    }, [filteredOrders]);

    const getStatusPillClass = (status) => {
        switch (status) {
            case 'completado':
                return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'en preparación':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case 'cancelado':
                return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <motion.div className="p-4 sm:p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Historial de Pedidos</h1>
                    <p className="text-muted-foreground">Todos los pedidos registrados en el restaurante.</p>
                </div>
                 <Button onClick={handlePrintTable} disabled={isPrinting}>
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
                <div className="text-2xl font-bold">${filteredTotal.toLocaleString('es-CL')}</div>
                <p className="text-xs text-muted-foreground">Suma de pedidos completados según los filtros aplicados.</p>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle>Todos los Pedidos</CardTitle>
                      <CardDescription>Busca y filtra todos los registros de pedidos.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="relative flex-grow sm:flex-grow-0 sm:w-48">
                           <Label htmlFor="order-search" className="sr-only">Buscar</Label>
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input id="order-search" placeholder="Buscar por cliente/código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
                        </div>
                        <div className="grid gap-1.5 flex-grow sm:flex-grow-0">
                           <Label htmlFor="order-date">Fecha</Label>
                           <Input id="order-date" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full" />
                        </div>
                        <div className="grid gap-1.5 flex-grow sm:flex-grow-0">
                           <Label htmlFor="order-category">Categoría</Label>
                           <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filtrar por categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todas las categorías</SelectItem>
                                    {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
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
                                    <TableHead>Código</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Operador</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center print:hidden">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                ) : paginatedOrders.length > 0 ? (
                                    paginatedOrders.map(order => {
                                        return (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs">{order.order_code || order.id.substring(0,8)}</TableCell>
                                                <TableCell className="font-medium">{order.customer_name || 'N/A'}</TableCell>
                                                <TableCell>{formatInChileanTime(order.created_at, 'dd/MM/yy, HH:mm')}</TableCell>
                                                <TableCell>
                                                    <span className="flex items-center gap-2"><Tag className="h-3 w-3" />{order.restaurant_order_items[0]?.restaurant_menu_items.restaurant_categories.name || 'N/A'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getStatusPillClass(order.status)}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{order.profiles?.full_name || 'N/A'}</TableCell>
                                                <TableCell className="text-right font-semibold">${(order.total_amount_clp || 0).toLocaleString('es-CL')}</TableCell>
                                                <TableCell className="text-center print:hidden">
                                                    <Button variant="outline" size="icon" onClick={() => handleViewDetails(order)}><Eye className="h-4 w-4"/></Button>
                                                    <Button variant="outline" size="icon" onClick={() => handlePrintTicket(order)}><Printer className="h-4 w-4"/></Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={8} className="h-24 text-center">No se encontraron pedidos.</TableCell></TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <p className="text-sm text-muted-foreground">
                                                Mostrando {paginatedOrders.length} de {filteredOrders.length} registros.
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

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Detalles del Pedido: {selectedOrder?.order_code}</DialogTitle>
                  <DialogDescription>
                    Lista de productos incluidos en esta orden.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-64 overflow-y-auto pr-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cant.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder?.restaurant_order_items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.restaurant_menu_items?.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">${(item.total_price_clp || 0).toLocaleString('es-CL')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={2} className="text-right font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">${(selectedOrder?.total_amount_clp || 0).toLocaleString('es-CL')}</TableCell>
                        </TableRow>
                    </TableFooter>
                  </Table>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cerrar</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default OrderHistory;