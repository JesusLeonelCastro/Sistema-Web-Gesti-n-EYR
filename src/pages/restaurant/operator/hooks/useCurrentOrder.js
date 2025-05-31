import { useState, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { generateOrderTicketPDF } from '@/lib/pdfGenerator';
import useOrderCounter from './useOrderCounter';


const useCurrentOrder = () => {
  const [currentOrderItems, setCurrentOrderItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  const [activeOrders, setActiveOrders] = useLocalStorage('restaurant_active_orders', []);
  const [settings] = useLocalStorage('restaurant_settings', { currencySymbol: 'Bs.', restaurantName: 'San Jose Restaurante' });
  const { user } = useAuth();
  const { toast } = useToast();
  const { getDisplayIdForOrder } = useOrderCounter();

  const addToOrder = (item) => {
    setCurrentOrderItems(prevOrder => {
      const existingItem = prevOrder.find(oi => oi.id === item.id);
      if (existingItem) {
        return prevOrder.map(oi => oi.id === item.id ? { ...oi, quantity: oi.quantity + 1 } : oi);
      }
      return [...prevOrder, { ...item, quantity: 1 }];
    });
  };

  const removeFromOrder = (itemId) => {
    setCurrentOrderItems(prevOrder => {
      const existingItem = prevOrder.find(oi => oi.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevOrder.map(oi => oi.id === itemId ? { ...oi, quantity: oi.quantity - 1 } : oi);
      }
      return prevOrder.filter(oi => oi.id !== itemId);
    });
  };

  const deleteFromOrder = (itemId) => {
    setCurrentOrderItems(prevOrder => prevOrder.filter(oi => oi.id !== itemId));
  };

  const totalAmount = useMemo(() => {
    return currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [currentOrderItems]);

  const resetCurrentOrder = () => {
    setCurrentOrderItems([]);
    setCustomerName('');
    setOrderNotes('');
  };

  const submitOrder = () => {
    if (currentOrderItems.length === 0) {
      toast({ title: "Pedido Vacío", description: "Agrega ítems al pedido.", variant: "destructive" });
      return false;
    }

    const displayId = getDisplayIdForOrder(currentOrderItems);
    
    const newOrder = {
      id: `order-sys-${Date.now()}-${Math.random().toString(36).substr(2,5)}`, // System internal ID
      displayId: displayId, // User-facing sequential ID
      items: currentOrderItems,
      totalAmount,
      customerName: customerName.trim() || 'Cliente General',
      orderTime: new Date().toISOString(),
      status: 'pending', 
      operatorId: user?.id,
      operatorName: user?.name || user?.username,
      notes: orderNotes.trim(),
    };
    
    toast({ title: "Pago Simulado Exitoso", description: `Pedido ${newOrder.displayId} pagado. Generando ticket...` });
    generateOrderTicketPDF(newOrder, settings); 

    setActiveOrders(prev => [...prev, newOrder]); 
    
    resetCurrentOrder();
    toast({ title: "Pedido Registrado", description: `Pedido ${newOrder.displayId} enviado a preparación.` });
    return true;
  };

  return {
    currentOrderItems,
    customerName,
    setCustomerName,
    orderNotes,
    setOrderNotes,
    addToOrder,
    removeFromOrder,
    deleteFromOrder,
    totalAmount,
    submitOrder,
    resetCurrentOrder,
    settings, // Expose settings for currency symbol etc.
  };
};

export default useCurrentOrder;