import { useState, useCallback, useEffect } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import useOrderCounter from '@/pages/restaurant/operator/hooks/useOrderCounter';
import { generateOrderTicketPDF } from '@/lib/pdfGenerator';
import { getCurrentUTCISOString } from '@/lib/parkingUtils'; // Changed to UTC

const defaultRestaurantSettings = {
  restaurantName: 'San Jose Restaurante',
  defaultTaxRate: 0,
  estimatedPreparationTime: 30,
  currencySymbol: 'Bs.',
};

const useCurrentOrder = () => {
  const [menuItems] = useLocalStorage('restaurant_menu_items', []);
  const [currentOrderItems, setCurrentOrderItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [, setOrdersHistory] = useLocalStorage('restaurant_orders_history', []);
  const [, setActiveOrders] = useLocalStorage('restaurant_active_orders', []);
  const [restaurantSettings] = useLocalStorage('restaurant_settings', defaultRestaurantSettings);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { getNextOrderId, resetDailyCounters } = useOrderCounter();

  const effectiveSettings = { ...defaultRestaurantSettings, ...restaurantSettings };

  const getCategoryForTicket = (items) => {
    if (!items || items.length === 0) return "OTROS";
    const mainCategories = ["Desayuno", "Almuerzos", "Cena"];
    for (const category of mainCategories) {
      if (items.some(item => item.category === category)) {
        return category;
      }
    }
    return items[0]?.category || "VARIOS";
  };

  const addItemToOrder = useCallback((itemData, quantity = 1) => {
    if (!itemData || !itemData.id) {
        console.error("Attempted to add invalid item to order:", itemData);
        return;
    }
    
    const itemToAdd = menuItems.find(menuItem => menuItem.id === itemData.id) || itemData;

    setCurrentOrderItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === itemToAdd.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === itemToAdd.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [...prevItems, { ...itemToAdd, quantity }];
      }
    });
  }, [menuItems]);
  
  const removeFromOrder = useCallback((itemId) => {
    setCurrentOrderItems(prevItems => {
        const itemToRemove = prevItems.find(item => item.id === itemId);
        if (itemToRemove && itemToRemove.quantity > 1) {
            return prevItems.map(item =>
                item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
            );
        } else {
            return prevItems.filter(item => item.id !== itemId);
        }
    });
  }, []);

  const deleteFromOrder = useCallback((itemId) => {
    setCurrentOrderItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);


  const updateItemQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      deleteFromOrder(itemId);
    } else {
      setCurrentOrderItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  }, [deleteFromOrder]);

  const calculateTotal = useCallback(() => {
    return currentOrderItems.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0);
  }, [currentOrderItems]);

  const clearOrder = useCallback(() => {
    setCurrentOrderItems([]);
    setCustomerName('');
    setOrderNotes('');
  }, []);

  const submitOrder = useCallback(() => {
    if (currentOrderItems.length === 0) {
      toast({
        title: 'Pedido Vacío',
        description: 'Agrega platillos antes de enviar el pedido.',
        variant: 'destructive',
      });
      return null;
    }

    const orderTimeISO = getCurrentUTCISOString(); // Changed to UTC
    const totalAmount = calculateTotal();
    const ticketCategory = getCategoryForTicket(currentOrderItems);
    const displayId = getNextOrderId(ticketCategory);

    const newOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      displayId,
      items: currentOrderItems,
      customerName: customerName.trim() || 'Cliente General',
      orderTime: orderTimeISO,
      totalAmount,
      status: 'pending',
      notes: orderNotes.trim(),
      operatorId: user?.id,
      operatorName: user?.name || user?.username || 'Sistema',
    };
    
    setActiveOrders(prevActiveOrders => [...prevActiveOrders, newOrder]);

    toast({
      title: 'Pedido Enviado',
      description: `El pedido ${newOrder.displayId} ha sido enviado y está pendiente. Generando ticket...`,
    });
    
    generateOrderTicketPDF(newOrder, effectiveSettings);
    
    clearOrder();
    return newOrder; 
  }, [currentOrderItems, customerName, orderNotes, calculateTotal, clearOrder, toast, user, getNextOrderId, setActiveOrders, getCategoryForTicket, effectiveSettings]);

  return {
    currentOrderItems,
    customerName,
    setCustomerName,
    orderNotes,
    setOrderNotes,
    addItemToOrder,
    removeFromOrder,
    deleteFromOrder,
    updateItemQuantity,
    totalAmount: calculateTotal(),
    submitOrder,
    resetDailyCounters,
    settings: effectiveSettings, 
  };
};

export default useCurrentOrder;