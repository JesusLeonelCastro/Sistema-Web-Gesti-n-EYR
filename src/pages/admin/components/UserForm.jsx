import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';

const UserForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: 'operator',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'operator',
        password: '',
        confirmPassword: '',
      });
    } else {
      setFormData({
        name: '',
        username: '',
        email: '',
        role: 'operator',
        password: '',
        confirmPassword: '',
      });
    }
    setErrors({}); // Clear errors when form data changes
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleRoleChange = (value) => {
    setFormData(prev => ({ ...prev, role: value }));
     if (errors.role) {
        setErrors(prev => ({ ...prev, role: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "El nombre es obligatorio.";
    if (!formData.username.trim()) newErrors.username = "El nombre de usuario es obligatorio.";
    if (!formData.email.trim()) newErrors.email = "El correo electrónico es obligatorio.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Correo electrónico inválido.";
    
    if (!user) { 
        if (!formData.password) newErrors.password = "La contraseña es obligatoria.";
        else if (formData.password.length < 6) newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden.";
    } else if (formData.password) { 
        if (formData.password.length < 6) newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const userDataToSave = { ...formData };
      if (!user && !userDataToSave.password) {
        toast({ title: "Error", description: "La contraseña es obligatoria para nuevos usuarios.", variant: "destructive" });
        return;
      }
      if (user && !userDataToSave.password) { 
        delete userDataToSave.password;
      }
      delete userDataToSave.confirmPassword;
      onSave(userDataToSave);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name-form">Nombre Completo</Label>
        <Input id="name-form" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Ana López" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>
      <div>
        <Label htmlFor="username-form">Nombre de Usuario</Label>
        <Input id="username-form" name="username" value={formData.username} onChange={handleChange} placeholder="Ej: analopez" />
        {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
      </div>
      <div>
        <Label htmlFor="email-form">Correo Electrónico</Label>
        <Input id="email-form" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Ej: ana.lopez@ejemplo.com" />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
      </div>
      <div>
        <Label htmlFor="role-form">Rol</Label>
        <Select value={formData.role} onValueChange={handleRoleChange}>
          <SelectTrigger id="role-form">
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="operator">Operador</SelectItem>
            <SelectItem value="administrator">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="password-form">Contraseña {user ? '(Dejar en blanco para no cambiar)' : ''}</Label>
        <Input id="password-form" name="password" type="password" value={formData.password} onChange={handleChange} />
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
      </div>
      <div>
        <Label htmlFor="confirmPassword-form">Confirmar Contraseña</Label>
        <Input id="confirmPassword-form" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
        {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{user ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
      </DialogFooter>
    </form>
  );
};

export default UserForm;