import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { isWithinInterval, parseISO } from 'date-fns';

const RestaurantContext = createContext();

export const useRestaurant = () => {
  return useContext(RestaurantContext);
};

export const RestaurantProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allOrderItems, setAllOrderItems] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const calculateSummaryData = useCallback((orders, orderItems, menu, dateRange) => {
    const { from, to } = dateRange;

    const filteredOrders = from && to 
      ? orders.filter(o => isWithinInterval(parseISO(o.created_at), { start: from, end: to }))
      : [];
    
    const filteredOrderIds = new Set(filteredOrders.map(o => o.id));
    const relevantOrderItems = orderItems.filter(item => filteredOrderIds.has(item.order_id));

    const periodSales = filteredOrders
      .filter(o => o.status === 'completado')
      .reduce((sum, o) => sum + (o.total_amount_clp || 0), 0);

    const activeOrders = allOrders.filter(o => o.status === 'en preparación').length;
    const periodOrdersCount = filteredOrders.length;
    
    // Chart Data
    const salesByCategory = relevantOrderItems.reduce((acc, item) => {
      const menuItem = menu.find(mi => mi.id === item.menu_item_id);
      const categoryName = menuItem?.restaurant_categories?.name || 'Sin Categoría';
      acc[categoryName] = (acc[categoryName] || 0) + item.total_price_clp;
      return acc;
    }, {});
    const salesByCategoryChartData = Object.keys(salesByCategory).map(name => ({ name, value: salesByCategory[name] }));

    const salesByDay = filteredOrders
      .filter(o => o.status === 'completado')
      .reduce((acc, order) => {
        const day = parseISO(order.created_at).toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + order.total_amount_clp;
        return acc;
      }, {});

    const salesByDayChartData = Object.keys(salesByDay).sort().map(day => ({
        name: new Date(day).toLocaleDateString('es-CL', { timeZone: 'UTC', day: '2-digit', month: 'short' }),
        value: salesByDay[day]
    }));


    setSummaryData({
      periodSales,
      activeOrders,
      menuItemCount: menu.length,
      periodOrdersCount,
      salesByCategoryChartData,
      salesByDayChartData
    });
  }, [allOrders]);

  const refreshAllData = useCallback(async () => {
    try {
        const [categoriesRes, menuItemsRes, ordersRes, orderItemsRes] = await Promise.all([
          supabase.from('restaurant_categories').select('*').order('name'),
          supabase.from('restaurant_menu_items').select('*, restaurant_categories(name)').order('name'),
          supabase.from('restaurant_orders').select('*').order('created_at', { ascending: false }),
          supabase.from('restaurant_order_items').select('*')
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (menuItemsRes.error) throw menuItemsRes.error;
        if (ordersRes.error) throw ordersRes.error;
        if (orderItemsRes.error) throw orderItemsRes.error;

        setCategories(categoriesRes.data || []);
        setMenuItems(menuItemsRes.data || []);
        setAllOrders(ordersRes.data || []);
        setAllOrderItems(orderItemsRes.data || []);

    } catch(e){
        toast({ variant: 'destructive', title: 'Error al cargar datos', description: e.message });
        setSummaryData({ periodSales: 0, activeOrders: 0, menuItemCount: 0, periodOrdersCount: 0, salesByCategoryChartData: [], salesByDayChartData: [] });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    refreshAllData();

    const channel = supabase
      .channel('restaurant-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_orders' },
        () => refreshAllData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_order_items' },
        () => refreshAllData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_menu_items' },
        () => refreshAllData()
      )
       .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_categories' },
        () => refreshAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAllData]);

  const value = {
    categories,
    menuItems,
    summaryData,
    loading,
    allOrders,
    allOrderItems,
    calculateSummaryData,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};