import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(null);

const INITIAL_USERS = [
  { id: '1', username: 'adminpark', password: 'password123', role: 'administrator', name: 'Admin General', email: 'admin@sanjose.com' },
  { id: '2', username: 'operador01', password: 'opPassword', role: 'operator', name: 'Operador General 1', email: 'op01@sanjose.com' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage('sanjose_user', null);
  const [users, setUsers] = useLocalStorage('sanjose_users', INITIAL_USERS);
  const [activeSystem, setActiveSystem] = useLocalStorage('sanjose_active_system', 'parking'); // 'parking' or 'restaurant'
  const navigate = useNavigate();
  const { toast } = useToast();

  const login = async (username, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const foundUser = users.find(
          (u) => u.username === username && u.password === password
        );

        if (foundUser) {
          setUser({ id: foundUser.id, username: foundUser.username, role: foundUser.role, name: foundUser.name, email: foundUser.email });
          toast({
            title: 'Inicio de Sesión Exitoso',
            description: `Bienvenido de nuevo, ${foundUser.name || foundUser.username}!`,
            variant: 'default',
            duration: 3000,
          });
          resolve(foundUser);
        } else {
          toast({
            title: 'Error de Inicio de Sesión',
            description: 'Nombre de usuario o contraseña incorrectos.',
            variant: 'destructive',
            duration: 3000,
          });
          resolve(null);
        }
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    // setActiveSystem('parking'); // Optionally reset active system on logout
    toast({
      title: 'Sesión Cerrada',
      description: 'Has cerrado sesión exitosamente.',
      variant: 'default',
      duration: 3000,
    });
    navigate('/login');
  };

  const addUser = (newUser) => {
    const usernameExists = users.some(u => u.username === newUser.username);
    const emailExists = users.some(u => u.email === newUser.email);

    if (usernameExists) {
      toast({
        title: 'Error al agregar usuario',
        description: 'El nombre de usuario ya existe.',
        variant: 'destructive',
      });
      return false;
    }
    if (emailExists) {
      toast({
        title: 'Error al agregar usuario',
        description: 'El correo electrónico ya está registrado.',
        variant: 'destructive',
      });
      return false;
    }

    setUsers(prevUsers => [...prevUsers, { ...newUser, id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }]);
    toast({
      title: 'Usuario Agregado',
      description: `El usuario ${newUser.name} ha sido agregado.`,
    });
    return true;
  };

  const updateUser = (userId, updatedUserData) => {
    const usernameExists = users.some(u => u.username === updatedUserData.username && u.id !== userId);
    const emailExists = users.some(u => u.email === updatedUserData.email && u.id !== userId);

    if (usernameExists) {
      toast({
        title: 'Error al actualizar usuario',
        description: 'El nombre de usuario ya está en uso por otro usuario.',
        variant: 'destructive',
      });
      return false;
    }
    if (emailExists) {
      toast({
        title: 'Error al actualizar usuario',
        description: 'El correo electrónico ya está en uso por otro usuario.',
        variant: 'destructive',
      });
      return false;
    }

    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updatedUserData } : u));
    toast({
      title: 'Usuario Actualizado',
      description: `El usuario ${updatedUserData.name} ha sido actualizado.`,
    });
    return true;
  };

  const deleteUser = (userId) => {
    if (user?.id === userId) {
      toast({
        title: 'Error al eliminar usuario',
        description: 'No puedes eliminar tu propia cuenta.',
        variant: 'destructive',
      });
      return false;
    }
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    toast({
      title: 'Usuario Eliminado',
      description: `El usuario ha sido eliminado.`,
    });
    return true;
  };

  const switchSystem = (system) => {
    setActiveSystem(system);
    // Navigate to the default page of the new system
    if (system === 'parking') {
      if (user?.role === 'administrator') navigate('/admin/overview');
      else if (user?.role === 'operator') navigate('/operator/entry-log');
      else navigate('/dashboard');
    } else if (system === 'restaurant') {
      if (user?.role === 'administrator') navigate('/restaurant/admin/overview');
      else if (user?.role === 'operator') navigate('/restaurant/operator/orders');
      else navigate('/restaurant/dashboard');
    }
  };

  const value = {
    user,
    users,
    activeSystem,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    switchSystem,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'administrator',
    isOperator: user?.role === 'operator',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};