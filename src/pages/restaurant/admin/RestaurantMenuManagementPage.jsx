import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from 'framer-motion';
import { Utensils, PlusCircle, Edit, Trash2, DollarSign, Search, XCircle, Coffee, Sun, Moon as MoonIcon, Sparkles, GlassWater, PlusSquare } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/components/ui/use-toast';

export const menuCategories = [
  { id: 'Desayuno', name: 'Desayuno', icon: Coffee },
  { id: 'Almuerzos', name: 'Almuerzos', icon: Sun },
  { id: 'Cena', name: 'Cena', icon: MoonIcon },
  { id: 'Especiales', name: 'Especiales', icon: Sparkles },
  { id: 'Bebidas', name: 'Bebidas', icon: GlassWater },
  { id: 'Adicionales', name: 'Adicionales', icon: PlusSquare },
  { id: 'Otros', name: 'Otros', icon: Utensils },
];

const MenuItemForm = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: item?.id || `item-${Date.now()}`,
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || '',
    category: item?.category || menuCategories[0].id, // Default to first category
  });
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
    if (errors.category) setErrors(prev => ({ ...prev, category: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "El nombre es obligatorio.";
    if (!formData.category.trim()) newErrors.category = "La categoría es obligatoria.";
    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "El precio debe ser un número positivo.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({ ...formData, price: Number(formData.price) });
    } else {
      toast({ title: "Error de validación", description: "Por favor, corrige los campos.", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="itemName">Nombre del Platillo/Ítem</Label>
        <Input id="itemName" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Lomo Saltado, Gaseosa 500ml" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>
      <div>
        <Label htmlFor="itemCategory">Categoría</Label>
        <Select value={formData.category} onValueChange={handleCategoryChange}>
          <SelectTrigger id="itemCategory">
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {menuCategories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center">
                  <cat.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
      </div>
      <div>
        <Label htmlFor="itemPrice">Precio (Bs.)</Label>
        <Input id="itemPrice" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Ej: 35.50" step="0.01" />
        {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
      </div>
      <div>
        <Label htmlFor="itemDescription">Descripción (Opcional)</Label>
        <Textarea id="itemDescription" name="description" value={formData.description} onChange={handleChange} placeholder="Ingredientes, detalles..." />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{item ? 'Guardar Cambios' : 'Agregar Ítem'}</Button>
      </DialogFooter>
    </form>
  );
};

const RestaurantMenuManagementPage = () => {
  const [menuItems, setMenuItems] = useLocalStorage('restaurant_menu_items', []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleSaveItem = (itemData) => {
    if (editingItem) {
      setMenuItems(prev => prev.map(item => item.id === itemData.id ? itemData : item));
      toast({ title: "Ítem Actualizado", description: `${itemData.name} ha sido modificado.` });
    } else {
      setMenuItems(prev => [...prev, itemData]);
      toast({ title: "Ítem Agregado", description: `${itemData.name} ha sido agregado al menú.` });
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    toast({ title: "Ítem Eliminado", description: "El ítem ha sido eliminado del menú.", variant: "destructive" });
  };
  
  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a,b) => menuCategories.findIndex(c => c.id === a.category) - menuCategories.findIndex(c => c.id === b.category) || a.name.localeCompare(b.name));

  const getCategoryIcon = (categoryId) => {
    const category = menuCategories.find(cat => cat.id === categoryId);
    return category ? category.icon : Utensils;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl flex items-center">
                <Utensils className="w-8 h-8 mr-3 text-lime-500" />
                Gestión de Menú
              </CardTitle>
              <CardDescription className="text-lg">
                Administra los platillos, bebidas y adicionales del restaurante.
              </CardDescription>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNewItem}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Agregar Ítem al Menú
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-lg">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Editar Ítem' : 'Agregar Nuevo Ítem'}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Modifica los detalles del ítem.' : 'Completa el formulario para añadir un nuevo ítem al menú.'}
                  </DialogDescription>
                </DialogHeader>
                <MenuItemForm item={editingItem} onSave={handleSaveItem} onCancel={() => setIsFormOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar ítems por nombre, categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50 focus:bg-background"
              />
              {searchTerm && (
                <Button variant="ghost" size="icon" onClick={() => setSearchTerm('')} title="Limpiar búsqueda" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8">
                  <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => {
                  const CategoryIcon = getCategoryIcon(item.category);
                  return (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-primary/5"
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CategoryIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                        {item.category}
                      </div>
                    </TableCell>
                    <TableCell className="text-right"><DollarSign className="inline w-4 h-4 mr-1 text-muted-foreground" />{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)} title="Editar">
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} title="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
             <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-center text-muted-foreground py-10"
              >
                {searchTerm ? `No se encontraron ítems que coincidan con "${searchTerm}".` : "No hay ítems en el menú. ¡Agrega algunos!"}
              </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RestaurantMenuManagementPage;