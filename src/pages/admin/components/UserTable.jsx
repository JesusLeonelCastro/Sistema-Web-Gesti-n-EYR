import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { motion } from 'framer-motion';
import { Edit3, Trash2, Shield, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const UserTable = ({ users, onEditUser, onDeleteUser, searchTerm }) => {
  const [userToDelete, setUserToDelete] = useState(null);
  const { user: currentUser } = useAuth();


  const confirmDeleteUser = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'administrator') return <Shield className="w-5 h-5 text-primary" />;
    if (role === 'operator') return <Briefcase className="w-5 h-5 text-secondary" />;
    return null;
  };

  if (users.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-center text-muted-foreground py-8"
      >
        {searchTerm ? `No se encontraron usuarios que coincidan con "${searchTerm}".` : "No hay usuarios registrados."}
      </motion.p>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden sm:table-cell">Usuario</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <motion.tr
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-primary/5"
            >
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="hidden sm:table-cell">{user.username}</TableCell>
              <TableCell className="hidden md:table-cell">{user.email}</TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  {getRoleIcon(user.role)}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => onEditUser(user)} title="Editar Usuario">
                  <Edit3 className="h-4 w-4 text-blue-500" />
                </Button>
                <AlertDialog open={!!userToDelete && userToDelete.id === user.id} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)} title="Eliminar Usuario" disabled={currentUser?.id === user.id}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que quieres eliminar al usuario "{userToDelete?.name}"? Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
};

export default UserTable;