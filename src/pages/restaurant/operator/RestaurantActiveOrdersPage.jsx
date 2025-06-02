import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { ListChecks, AlertTriangle } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/components/ui/use-toast';
import { formatDate, getCurrentUTCISOString } from '@/lib/parkingUtils';
import { generateOrderTicketPDF } from '@/lib/pdfGenerator';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const ORDER_AUTO_COMPLETE_MINUTES = 30;

const RestaurantActiveOrdersPage = () => {
  const [activeOrders, setActiveOrders] = useLocalStorage('restaurant_active_orders', []);
  const [ordersHistory, setOrdersHistory] = useLocalStorage('restaurant_orders_history', []);
  const [settings] = useLocalStorage('restaurant_settings', { currencySymbol: 'Bs.', restaurantName: 'San Jose Restaurante' });
  const { toast } = useToast();
  const [timeNow, setTimeNow] = useState(new Date(getCurrentUTCISOString()).getTime()); // Changed to UTC

  useEffect(() => {
    const timer = setInterval(() => setTimeNow(new Date(getCurrentUTCISOString()).getTime()), 60000); // Changed to UTC
    return () => clearInterval(timer);
  }, []);

  const updateOrderStatus = (orderId, newStatus) => {
    const orderToUpdate = activeOrders.find(order => order.id === orderId);
    if (!orderToUpdate) return;

    const updatedOrder = { ...orderToUpdate, status: newStatus, lastUpdateTime: getCurrentUTCISOString() }; // Changed to UTC

    if (newStatus === 'completed' || newStatus === 'cancelled') {
      setOrdersHistory(prev => {
        const existingIndex = prev.findIndex(o => o.id === orderId);
        if (existingIndex > -1) {
          const updatedHistory = [...prev];
          updatedHistory[existingIndex] = { ...updatedOrder, completionTime: getCurrentUTCISOString() }; // Changed to UTC
          return updatedHistory;
        }
        return [...prev, { ...updatedOrder, completionTime: getCurrentUTCISOString() }]; // Changed to UTC
      });
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      toast({ title: `Pedido ${newStatus === 'completed' ? 'Completado' : 'Cancelado'}`, description: `El pedido ${orderToUpdate.displayId} ha sido marcado como ${newStatus}.`});
    } else {
      setActiveOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
      toast({ title: "Estado Actualizado", description: `El pedido ${orderToUpdate.displayId} ahora está: ${newStatus}.`});
    }
  };
  
  const orderStatusOptions = [
    { value: "pending", label: "Pendiente" },
    { value: "completed", label: "Completado" },
  ];

  const handleReprintTicket = (order) => {
    generateOrderTicketPDF(order, settings);
    toast({ title: "Ticket Reimpreso", description: `Se ha generado el ticket para el pedido ${order.displayId}.` });
  };

  const checkAndAutoCompleteOrder = (order) => {
    const orderTime = new Date(order.orderTime).getTime();
    const minutesPassed = (timeNow - orderTime) / (1000 * 60);
    if (order.status === 'pending' && minutesPassed > ORDER_AUTO_COMPLETE_MINUTES) {
      return true; 
    }
    return false;
  };


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <ListChecks className="w-8 h-8 mr-3 text-cyan-500" />
            Pedidos Activos
          </CardTitle>
          <CardDescription className="text-lg">
            Gestiona los pedidos pendientes. Los pedidos se marcarán como "Completado" automáticamente después de {ORDER_AUTO_COMPLETE_MINUTES} minutos si no se actualizan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOrders.sort((a,b) => new Date(a.orderTime) - new Date(b.orderTime)).map((order, index) => {
                const currentStatusInfo = orderStatusOptions.find(opt => opt.value === order.status);
                const isOverdue = checkAndAutoCompleteOrder(order);
                return (
                <motion.div 
                  key={order.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className={`h-full flex flex-col ${isOverdue ? 'border-yellow-500 border-2' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Pedido #{order.displayId}</CardTitle>
                          <CardDescription className="text-xs">
                            {order.customerName || 'Cliente General'} - {formatDate(order.orderTime, true)}
                          </CardDescription>
                        </div>
                         <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            order.status === 'pending' ? (isOverdue ? 'bg-yellow-200 text-yellow-800' : 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200') :
                            order.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                            {currentStatusInfo ? currentStatusInfo.label : order.status}
                        </span>
                      </div>
                      {isOverdue && (
                        <div className="mt-1 text-xs text-yellow-600 flex items-center">
                            <AlertTriangle size={14} className="mr-1" /> Este pedido ha excedido los {ORDER_AUTO_COMPLETE_MINUTES} min.
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2 flex-grow">
                      <div className="max-h-32 overflow-y-auto text-sm pr-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span>{item.name} (x{item.quantity})</span>
                            <span>{settings.currencySymbol} {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <p className="font-bold text-right border-t pt-2">Total: {settings.currencySymbol} {order.totalAmount.toFixed(2)}</p>
                      {order.notes && <p className="text-xs text-muted-foreground pt-1 border-t">Notas: {order.notes}</p>}
                    </CardContent>
                    <CardContent className="pt-2 mt-auto space-y-2">
                      <Select 
                        value={order.status} 
                        onValueChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Cambiar estado..." />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatusOptions.map(statusOpt => (
                            <SelectItem key={statusOpt.value} value={statusOpt.value}>
                              {statusOpt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => handleReprintTicket(order)}>
                        <Printer className="mr-2 h-4 w-4" /> Reimprimir Ticket
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )})}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No hay pedidos activos en este momento.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RestaurantActiveOrdersPage;