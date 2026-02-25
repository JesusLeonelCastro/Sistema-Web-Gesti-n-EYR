import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, Loader2, Utensils, Tag, Soup } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
});

const menuItemSchema = z.object({
  category_id: z.string().uuid("Debe seleccionar una categoría."),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  price_clp: z.preprocess(
    (val) => (val === "" ? undefined : parseInt(String(val), 10)),
    z.number({ required_error: "El precio es requerido."}).positive("El precio debe ser un número positivo.")
  ),
});

const MenuManagement = () => {
  const { toast } = useToast();
  const { categories, menuItems, loading, refreshAllData } = useRestaurant();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryForm = useForm({ resolver: zodResolver(categorySchema) });
  const menuItemForm = useForm({ resolver: zodResolver(menuItemSchema) });

  const handleOpenCategoryModal = (category = null) => {
    setEditingCategory(category);
    categoryForm.reset(category || { name: '', description: '' });
    setIsCategoryModalOpen(true);
  };

  const handleOpenMenuItemModal = (menuItem = null) => {
    setEditingMenuItem(menuItem);
    const defaultValues = { name: '', description: '', price_clp: undefined, category_id: '' };
    menuItemForm.reset(menuItem ? { ...menuItem } : defaultValues);
    setIsMenuItemModalOpen(true);
  };
  
  const handleOpenNewMenuItemInCategory = (categoryId) => {
    setEditingMenuItem(null);
    menuItemForm.reset({
      name: '',
      description: '',
      price_clp: undefined,
      category_id: categoryId,
    });
    setIsMenuItemModalOpen(true);
  };

  const handleCategorySubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const { error } = editingCategory
        ? await supabase.from('restaurant_categories').update(values).eq('id', editingCategory.id)
        : await supabase.from('restaurant_categories').insert(values);
      if (error) throw error;
      toast({ title: `Categoría ${editingCategory ? 'actualizada' : 'creada'} con éxito.` });
      await refreshAllData();
      setIsCategoryModalOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al guardar categoría', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMenuItemSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const upsertData = { ...values };
      const { error } = editingMenuItem
        ? await supabase.from('restaurant_menu_items').update(upsertData).eq('id', editingMenuItem.id)
        : await supabase.from('restaurant_menu_items').insert(upsertData);
      if (error) throw error;
      toast({ title: `Plato ${editingMenuItem ? 'actualizado' : 'creado'} con éxito.` });
      await refreshAllData();
      setIsMenuItemModalOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al guardar plato', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteCategory = async (categoryId) => {
    try {
      const { error } = await supabase.from('restaurant_categories').delete().eq('id', categoryId);
      if (error) throw error;
      toast({ title: 'Categoría eliminada con éxito.' });
      await refreshAllData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al eliminar categoría', description: "Asegúrate que no tenga platos asociados." });
    }
  };

  const handleDeleteMenuItem = async (menuItemId) => {
    try {
      const { error } = await supabase.from('restaurant_menu_items').delete().eq('id', menuItemId);
      if (error) throw error;
      toast({ title: 'Plato eliminado con éxito.' });
      await refreshAllData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al eliminar plato', description: error.message });
    }
  };

  const MenuItemCard = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative overflow-hidden rounded-lg shadow-md group h-full"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent z-0"></div>
        <div className="p-4 flex flex-col justify-between h-full bg-card/80 backdrop-blur-sm relative">
          <div className="flex-grow">
            <h4 className="font-bold text-lg text-foreground">{item.name}</h4>
            <p className="text-sm text-muted-foreground mt-1 h-10 overflow-hidden">{item.description}</p>
          </div>
          <div className="flex justify-between items-end mt-4">
            <p className="text-2xl font-black text-primary">${item.price_clp.toLocaleString('es-CL')}</p>
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-1"
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 hover:bg-background" onClick={() => handleOpenMenuItemModal(item)}><Edit className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 hover:bg-background text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>¿Seguro que quieres eliminar "{item.name}"?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteMenuItem(item.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  };


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Menú</h1>
          <p className="text-muted-foreground">Administra las categorías y platos de tu restaurante.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenCategoryModal()}><Tag className="mr-2 h-4 w-4" />Añadir Categoría</Button>
          <Button onClick={() => handleOpenMenuItemModal()}><Utensils className="mr-2 h-4 w-4" />Añadir Plato</Button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          {categories.map(category => (
            <motion.div key={category.id} layout>
              <Card className="bg-gradient-to-br from-card to-secondary/50 overflow-hidden">
                <CardHeader className="flex flex-row justify-between items-center bg-black/5 p-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenCategoryModal(category)} className="bg-background/70"><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Seguro que quieres eliminar "{category.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer y eliminará la categoría. Asegúrate que no contenga platos.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCategory(category.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {menuItems.filter(item => item.category_id === category.id).map(item => (
                        <MenuItemCard key={item.id} item={item} />
                      ))}
                    </AnimatePresence>
                     <motion.button 
                        layout
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenNewMenuItemInCategory(category.id)}
                        className="border-2 border-dashed border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-primary/10 hover:border-primary hover:text-primary transition-colors min-h-[160px]">
                        <PlusCircle className="h-8 w-8 mb-2"/>
                        <span className="text-sm font-semibold">Añadir Plato</span>
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar' : 'Nueva'} Categoría</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
              <FormField control={categoryForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={categoryForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMenuItemModalOpen} onOpenChange={setIsMenuItemModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMenuItem ? 'Editar Plato' : 'Nuevo Plato'}</DialogTitle>
          </DialogHeader>
          <Form {...menuItemForm}>
            <form onSubmit={menuItemForm.handleSubmit(handleMenuItemSubmit)} className="space-y-4">
              <FormField control={menuItemForm.control} name="category_id" render={({ field }) => (
                <FormItem><FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una categoría" /></SelectTrigger></FormControl>
                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={menuItemForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nombre del Plato</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={menuItemForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={menuItemForm.control} name="price_clp" render={({ field }) => (
                <FormItem><FormLabel>Precio (CLP)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MenuManagement;