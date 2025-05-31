import React from 'react';
import { motion } from 'framer-motion';
import useCurrentOrder from './hooks/useCurrentOrder';
import MenuItemSelection from './components/MenuItemSelection';
import CurrentOrderPanel from './components/CurrentOrderPanel';

const RestaurantOrderTakingPage = () => {
  const currentOrderProps = useCurrentOrder();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }} 
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full"
    >
      <MenuItemSelection onAddToOrder={currentOrderProps.addToOrder} />
      <CurrentOrderPanel {...currentOrderProps} />
    </motion.div>
  );
};

export default RestaurantOrderTakingPage;