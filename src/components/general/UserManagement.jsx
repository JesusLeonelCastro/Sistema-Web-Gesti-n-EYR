import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, UserPlus, Edit, Trash2, User, Mail, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const userSchema = z.object({
  full_name: z.string().min(3, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(['administrador', 'operador'], { required_error: "Debe seleccionar un rol." }),
});

const editUserSchema = z.object({
  full_name: z.string().min(3, "El nombre es muy corto"),
  role: z.enum(['administrador', 'operador'], { required_error: "Debe seleccionar un rol." }),
});

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 30;

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", email: "", password: "", role: "operador" },
  });

  const editForm = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: { full_name: "", role: "operador" },
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role');
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error al cargar usuarios", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return users.slice(startIndex, startIndex + rowsPerPage);
  }, [users, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(users.length / rowsPerPage);

  const handleCreateUser = async (values) => {
    setIsSubmitting(true);
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            role: values.role
          }
        }
      });

      if (signUpError) {
        throw new Error(`Error de autenticación: ${signUpError.message}`);
      }
      
      if (!user) {
        throw new Error("No se pudo crear el usuario en el sistema de autenticación.");
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          role: values.role,
          email: values.email
        })
        .eq('id', user.id);

      if (profileError) {
        throw new Error(`Error al crear el perfil: ${profileError.message}`);
      }
      
      toast({ title: "Usuario Creado", description: "El nuevo usuario ha sido creado exitosamente." });
      fetchUsers();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Error al crear usuario", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (values) => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          role: values.role
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast({ title: "Usuario Actualizado", description: "Los datos del usuario han sido actualizados." });
      fetchUsers();
      setIsEditOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error al actualizar", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: selectedUser.id },
      });

      if (error) throw new Error(`Error en la función del servidor: ${error.message}`);
      if (data.error) throw new Error(`Error al eliminar usuario: ${data.error}`);

      toast({ title: "Usuario Eliminado", description: "El usuario ha sido eliminado del sistema." });
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    editForm.reset({ full_name: user.full_name, role: user.role });
    setIsEditOpen(true);
  };

  return (
    <motion.div
      className="p-4 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Lista de usuarios del sistema.</p>
        </div>
        {/* Botón "Crear Usuario" eliminado */}
      </header>

      <Card>
        <CardHeader><CardTitle>Lista de Usuarios</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><User className="inline-block mr-2 h-4 w-4" />Nombre</TableHead>
                <TableHead><Mail className="inline-block mr-2 h-4 w-4" />Email</TableHead>
                <TableHead><Shield className="inline-block mr-2 h-4 w-4" />Rol</TableHead>
                {/* Columna de Acciones eliminada */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
              ) : paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  {/* Celdas de Acciones eliminadas */}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {paginatedUsers.length} de {users.length} usuarios.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" /> Anterior
                      </Button>
                      <span className="text-sm">Página {currentPage} de {totalPages}</span>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                        Siguiente <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de Edición eliminado */}
    </motion.div>
  );
};

export default UserManagement;