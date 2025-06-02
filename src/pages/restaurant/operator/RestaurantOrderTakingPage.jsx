
import React from 'react';
import { motion } from 'framer-motion';
import useCurrentOrder from './hooks/useCurrentOrder';
import MenuItemSelection from './components/MenuItemSelection';
import CurrentOrderPanel from './components/CurrentOrderPanel';
import useLocalStorage from '@/hooks/useLocalStorage';

const RestaurantOrderTakingPage = () => {
  const currentOrderProps = useCurrentOrder();
  const [menuItems] = useLocalStorage('restaurant_menu_items', []);


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }} 
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full"
    >
      <MenuItemSelection 
        menuItems={menuItems} 
        onAddToOrder={(item) => currentOrderProps.addItemToOrder(item)} 
        settings={currentOrderProps.settings}
      />
      <CurrentOrderPanel {...currentOrderProps} />
    </motion.div>
  );
};

export default RestaurantOrderTakingPage;
