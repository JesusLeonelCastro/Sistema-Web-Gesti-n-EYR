import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from 'framer-motion';
import { Users, UserPlus, Search, XCircle } from 'lucide-react';
import UserForm from './components/UserForm'; 
import UserTable from './components/UserTable';

const AdminUsersPage = () => {
  const { users: systemUsers, addUser, updateUser, deleteUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const filteredUsers = systemUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNewUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleSaveUser = (userData) => {
    let success = false;
    if (editingUser) {
      success = updateUser(editingUser.id, userData);
    } else {
      success = addUser(userData);
    }
    if (success) {
        setIsFormOpen(false);
        setEditingUser(null);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-card/80 backdrop-blur-md shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl flex items-center">
                <Users className="w-8 h-8 mr-3 text-yellow-500" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription className="text-lg">
                Administra los usuarios de ambos sistemas (Garaje y Restaurante).
              </CardDescription>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNewUser}>
                  <UserPlus className="mr-2 h-4 w-4" /> Agregar Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] bg-card/90 backdrop-blur-lg">
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? 'Modifica los detalles del usuario.' : 'Completa el formulario para crear un nuevo usuario.'}
                  </DialogDescription>
                </DialogHeader>
                <UserForm 
                  user={editingUser} 
                  onSave={handleSaveUser} 
                  onCancel={handleCloseForm} 
                />
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
                placeholder="Buscar usuarios..."
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

          <UserTable
            users={filteredUsers}
            onEditUser={handleEditUser}
            onDeleteUser={deleteUser}
            searchTerm={searchTerm}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminUsersPage;