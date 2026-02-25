import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Minus, X, Utensils, ShoppingCart } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import OrderTicketPDF from '@/components/restaurant/OrderTicketPDF';

const CartContent = ({
  cart,
  customerName,
  setCustomerName,
  orderNotes,
  setOrderNotes,
  total,
  handleUpdateQuantity,
  handleSubmitOrder,
  isSubmitting,
  closeCart,
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart /> Carrito</h2>
        {closeCart && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={closeCart}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <Input placeholder="Nombre del Cliente (Opcional)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
        <Textarea placeholder="Notas del pedido (ej. sin cebolla)..." value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={2} />
      </div>
      <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <Utensils className="h-10 w-10 mb-2"/>
            <p>El carrito está vacío</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex items-center gap-2 bg-secondary p-2 rounded-lg">
              <div className="flex-grow">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-primary">${(item.price_clp * item.quantity).toLocaleString('es-CL')}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4"/></Button>
                <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4"/></Button>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleUpdateQuantity(item.id, 0)}><X className="h-4 w-4"/></Button>
            </div>
          ))
        )}
      </div>
      {cart.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex justify-between font-bold text-lg mb-4">
            <span>Total:</span>
            <span>${total.toLocaleString('es-CL')}</span>
          </div>
          <Button className="w-full" size="lg" onClick={handleSubmitOrder} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Realizar Pedido y Descargar
          </Button>
        </div>
      )}
    </>
  );
};


const TakeOrder = () => {
    const { categories, menuItems, loading, refreshAllData } = useRestaurant();
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const handleAddToCart = (item) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prevCart.map(cartItem => 
                    cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const handleUpdateQuantity = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            setCart(prevCart => prevCart.filter(item => item.id !== itemId));
        } else {
            setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
        }
    };

    const total = cart.reduce((acc, item) => acc + item.price_clp * item.quantity, 0);
    const totalItemsInCart = cart.reduce((acc, item) => acc + item.quantity, 0);

    const getCategoryForOrder = () => {
        if (cart.length === 0) return 'General';
        const firstItemInCart = cart[0];
        const menuItem = menuItems.find(mi => mi.id === firstItemInCart.id);
        return menuItem?.restaurant_categories?.name || 'General';
    };

    const generateAndDownloadPdf = async (orderData) => {
        try {
          const blob = await pdf(<OrderTicketPDF order={orderData} />).toBlob();
          const fileName = `TICKET-PEDIDO-${orderData.order_code}.pdf`;
          saveAs(blob, fileName);
        } catch (error) {
          console.error("Error generating PDF:", error);
          toast({
            variant: "destructive",
            title: "Error al generar el PDF",
            description: "No se pudo crear el ticket en PDF.",
          });
        }
    };

    const handleSubmitOrder = async () => {
        if (cart.length === 0) {
            toast({ variant: "destructive", title: "El carrito está vacío." });
            return;
        }
        setIsSubmitting(true);
        try {
            const categoryName = getCategoryForOrder();
            
            const { data: orderCode, error: codeError } = await supabase.rpc('get_next_order_code', { p_category_name: categoryName });
            if (codeError) throw codeError;

            const { data: orderData, error: orderError } = await supabase.from('restaurant_orders').insert({
                customer_name: customerName,
                total_amount_clp: total,
                created_by: user.id,
                order_code: orderCode,
                status: 'en preparación',
                description: orderNotes,
            }).select('*, profiles(full_name)').single();
            if (orderError) throw orderError;

            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                unit_price_clp: item.price_clp,
                total_price_clp: item.price_clp * item.quantity
            }));
            const { error: itemsError } = await supabase.from('restaurant_order_items').insert(orderItems);
            if (itemsError) throw itemsError;
            
            const finalOrderDetails = { ...orderData, items: cart };
            await generateAndDownloadPdf(finalOrderDetails);

            toast({ 
                title: "Pedido realizado con éxito!",
                description: `Código de pedido: ${orderCode}. El ticket se ha descargado.`,
            });
            
            setCart([]);
            setCustomerName('');
            setOrderNotes('');
            setIsCartOpen(false);
            if (refreshAllData) {
                await refreshAllData();
            }

        } catch (error) {
            toast({ variant: "destructive", title: "Error al realizar el pedido", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <div className="relative h-full">
            <motion.div className="flex h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex-1 p-4 overflow-y-auto">
                    <header className="mb-4">
                        <h1 className="text-3xl font-bold text-foreground">Toma de Pedidos</h1>
                        <p className="text-muted-foreground">Selecciona los platos para añadir al pedido.</p>
                    </header>
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        <Button variant={!activeCategoryId ? 'default' : 'secondary'} onClick={() => setActiveCategoryId(null)}>Todos</Button>
                        {categories.map(cat => (
                            <Button key={cat.id} variant={activeCategoryId === cat.id ? 'default' : 'secondary'} onClick={() => setActiveCategoryId(cat.id)}>{cat.name}</Button>
                        ))}
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {menuItems.filter(item => !activeCategoryId || item.category_id === activeCategoryId).map(item => (
                                <motion.div key={item.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                    <Card className="h-full flex flex-col cursor-pointer p-3" onClick={() => handleAddToCart(item)}>
                                        <div className="flex-grow flex flex-col">
                                            <h4 className="font-semibold">{item.name}</h4>
                                            <p className="text-sm font-bold text-primary mt-auto pt-2">${item.price_clp.toLocaleString('es-CL')}</p>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="hidden lg:flex w-80 bg-card border-l border-border flex-col p-4">
                    <CartContent 
                        cart={cart}
                        customerName={customerName}
                        setCustomerName={setCustomerName}
                        orderNotes={orderNotes}
                        setOrderNotes={setOrderNotes}
                        total={total}
                        handleUpdateQuantity={handleUpdateQuantity}
                        handleSubmitOrder={handleSubmitOrder}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </motion.div>

            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                            onClick={() => setIsCartOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-full max-w-sm bg-card border-l border-border flex flex-col p-4 z-50 lg:hidden"
                        >
                            <CartContent 
                                cart={cart}
                                customerName={customerName}
                                setCustomerName={setCustomerName}
                                orderNotes={orderNotes}
                                setOrderNotes={setOrderNotes}
                                total={total}
                                handleUpdateQuantity={handleUpdateQuantity}
                                handleSubmitOrder={handleSubmitOrder}
                                isSubmitting={isSubmitting}
                                closeCart={() => setIsCartOpen(false)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="lg:hidden fixed bottom-6 right-6 z-30">
                <Button size="lg" className="rounded-full shadow-lg h-16 w-16" onClick={() => setIsCartOpen(true)}>
                    <ShoppingCart className="h-6 w-6" />
                    {totalItemsInCart > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                            {totalItemsInCart}
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default TakeOrder;