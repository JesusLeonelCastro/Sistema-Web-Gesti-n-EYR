import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Printer, XCircle, AlertTriangle } from 'lucide-react';
import { formatInChileanTime } from '@/lib/utils';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import OrderTicketPDF from '@/components/restaurant/OrderTicketPDF';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const ActiveOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { refreshAllData } = useRestaurant();

    const fetchActiveOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('restaurant_orders')
                .select('*, profiles(full_name), restaurant_order_items(*, restaurant_menu_items(name, price_clp))')
                .eq('status', 'en preparación')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setOrders(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error al cargar pedidos', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchActiveOrders();

        const channel = supabase.channel('active_orders_v9')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_orders' }, payload => {
                fetchActiveOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const updateData = { status: newStatus };
            if (newStatus === 'completado' || newStatus === 'cancelado') {
                updateData.completed_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('restaurant_orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;
            
            toast({ title: `Pedido marcado como ${newStatus}.` });
            setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
            if (refreshAllData) {
                refreshAllData();
            }

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error al actualizar pedido', description: error.message });
        }
    };
    
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Pedidos en Preparación</h1>
                    <p className="text-muted-foreground">Monitoriza los pedidos en tiempo real.</p>
                </div>
                <Button onClick={fetchActiveOrders} disabled={loading}><Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : 'hidden'}`} />Refrescar</Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center mt-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : orders.length === 0 ? (
                    <p className="col-span-full text-center text-muted-foreground mt-8">No hay pedidos en preparación.</p>
                ) : (
                    orders.map(order => (
                        <motion.div key={order.id} layout>
                            <Card className="bg-card flex flex-col h-full">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span>{order.customer_name || `Pedido ${order.order_code || ''}`}</span>
                                        <span className="text-sm font-normal text-muted-foreground">{formatInChileanTime(order.created_at, "HH:mm")}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <ul className="space-y-1 text-sm">
                                        {order.restaurant_order_items.map(item => (
                                            <li key={item.id} className="flex justify-between">
                                                <span>{item.quantity}x {item.restaurant_menu_items.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-2">
                                    <Button className="w-full" onClick={() => updateOrderStatus(order.id, 'completado')}>
                                        <CheckCircle className="mr-2 h-4 w-4"/>Completar Pedido
                                    </Button>
                                    <div className="w-full flex gap-2">
                                        <Button variant="outline" className="w-full" onClick={() => handlePrintTicket(order)}>
                                            <Printer className="mr-2 h-4 w-4"/>Descargar
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="w-full">
                                                    <XCircle className="mr-2 h-4 w-4"/>Cancelar
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. El pedido se marcará como cancelado permanentemente.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Volver</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => updateOrderStatus(order.id, 'cancelado')}>
                                                    Sí, cancelar pedido
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default ActiveOrders;