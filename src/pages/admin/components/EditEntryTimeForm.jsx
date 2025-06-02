
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'; // Added Dialog components
import { X } from 'lucide-react';

const EditEntryTimeForm = ({ trailer, onSave, onCancel }) => {
  const { toast } = useToast();
  
  const initialDate = new Date(trailer.entryTime);
  const localDate = new Date(initialDate.getTime() - initialDate.getTimezoneOffset() * 60000);
  const [entryDate, setEntryDate] = useState(localDate.toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState(localDate.toTimeString().split(' ')[0].substring(0, 5));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!entryDate || !entryTime) {
      toast({
        title: "Error de Validación",
        description: "La fecha y hora de entrada no pueden estar vacías.",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = entryTime.split(':');
    const newEntryDateTime = new Date(entryDate);
    newEntryDateTime.setHours(parseInt(hours, 10));
    newEntryDateTime.setMinutes(parseInt(minutes, 10));
    newEntryDateTime.setSeconds(0);
    newEntryDateTime.setMilliseconds(0);

    if (isNaN(newEntryDateTime.getTime())) {
        toast({
            title: "Error de Fecha",
            description: "La fecha y hora ingresadas no son válidas.",
            variant: "destructive",
        });
        return;
    }
    
    onSave(trailer.id, newEntryDateTime);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar Fecha y Hora de Entrada</DialogTitle>
        <DialogDescription>
          Modifique la fecha y hora de ingreso para el vehículo <strong className="text-primary">{trailer.plate}</strong>.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="entryDate">Fecha de Entrada</Label>
            <Input
              id="entryDate"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="entryTime">Hora de Entrada</Label>
            <Input
              id="entryTime"
              type="time"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2"/> Cancelar
          </Button>
          <Button type="submit">Guardar Cambios</Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default EditEntryTimeForm;
