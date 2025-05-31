import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

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
    
    onSave(newEntryDateTime);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Editar Fecha y Hora de Entrada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Modifique la fecha y hora de ingreso para el vehículo <strong className="text-primary">{trailer.plate}</strong>.
        </p>
      </div>
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
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar Cambios</Button>
      </div>
    </form>
  );
};

export default EditEntryTimeForm;