import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'framer-motion';
import { Search, XCircle, Utensils } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { menuCategories } from '@/pages/restaurant/admin/RestaurantMenuManagementPage';

const MenuItemSelection = ({ onAddToOrder }) => {
  const [menuItems] = useLocalStorage('restaurant_menu_items', []);
  const [settings] = useLocalStorage('restaurant_settings', { currencySymbol: 'Bs.' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(menuCategories[0]?.id || 'all');

  const itemsByCategory = useMemo(() => {
    const grouped = menuItems.reduce((acc, item) => {
      const category = item.category || 'Otros';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
    
    const sortedGrouped = {};
    menuCategories.forEach(cat => {
      if (grouped[cat.id]) sortedGrouped[cat.id] = grouped[cat.id];
    });
    Object.keys(grouped).forEach(catId => {
      if (!sortedGrouped[catId]) sortedGrouped[catId] = grouped[catId];
    });
    return sortedGrouped;
  }, [menuItems]);

  const filteredMenuItemsForTab = useMemo(() => {
    const itemsToFilter = activeTab === 'all' ? menuItems : itemsByCategory[activeTab] || [];
    if (!searchTerm) return itemsToFilter;
    return itemsToFilter.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menuItems, itemsByCategory, activeTab, searchTerm]);

  return (
    <Card className="lg:col-span-2 shadow-xl flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Utensils className="w-7 h-7 mr-3 text-teal-500" />
          Seleccionar Ítems del Menú
        </CardTitle>
        <div className="relative flex-grow mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Buscar por nombre en categoría actual..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 focus:bg-background w-full"
          />
          {searchTerm && (
            <Button variant="ghost" size="icon" onClick={() => setSearchTerm('')} title="Limpiar búsqueda" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8">
              <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 mb-2">
            <TabsTrigger value="all" className="text-xs sm:text-sm">Todos</TabsTrigger>
            {menuCategories.map(cat => (
              itemsByCategory[cat.id] && itemsByCategory[cat.id].length > 0 && (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs sm:text-sm">
                  <cat.icon className="w-3 h-3 mr-1 hidden sm:inline-block" />
                  {cat.name}
                </TabsTrigger>
              )
            ))}
          </TabsList>
          <div className="flex-grow overflow-y-auto">
            {activeTab === 'all' ? (
              Object.entries(itemsByCategory).map(([category, items]) => {
                const filteredCategoryItems = items.filter(item => 
                  !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                if (filteredCategoryItems.length === 0) return null;
                const categoryDetails = menuCategories.find(c => c.id === category) || { name: category, icon: Utensils };
                return (
                  <div key={category} className="mb-4">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <categoryDetails.icon className="w-5 h-5 mr-2 text-primary" />
                      {categoryDetails.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {filteredCategoryItems.map(item => (
                        <motion.div key={item.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                          <Card className="cursor-pointer hover:border-primary transition-colors h-full flex flex-col" onClick={() => onAddToOrder(item)}>
                            <CardHeader className="pb-1 pt-2 px-3">
                              <CardTitle className="text-sm">{item.name}</CardTitle>
                              {item.description && <p className="text-xs truncate text-muted-foreground">{item.description}</p>}
                            </CardHeader>
                            <CardContent className="pt-0 mt-auto px-3 pb-2">
                              <p className="text-xs font-semibold">{settings.currencySymbol} {item.price.toFixed(2)}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              filteredMenuItemsForTab.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredMenuItemsForTab.map(item => (
                    <motion.div key={item.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                      <Card className="cursor-pointer hover:border-primary transition-colors h-full flex flex-col" onClick={() => onAddToOrder(item)}>
                        <CardHeader className="pb-1 pt-2 px-3">
                          <CardTitle className="text-sm">{item.name}</CardTitle>
                           {item.description && <p className="text-xs truncate text-muted-foreground">{item.description}</p>}
                        </CardHeader>
                        <CardContent className="pt-0 mt-auto px-3 pb-2">
                          <p className="text-xs font-semibold">{settings.currencySymbol} {item.price.toFixed(2)}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">
                  {searchTerm ? 'No se encontraron ítems.' : `No hay ítems en la categoría ${activeTab}.`}
                </p>
              )
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MenuItemSelection;