import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { User, FileText } from 'lucide-react';

const VehicleDetailsDialog = ({ stay, isOpen, onOpenChange }) => {
  if (!stay) return null;

  const { driver_name, notes } = stay.garage_vehicles;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalles del Vehículo: {stay.garage_vehicles.license_plate}</DialogTitle>
          <DialogDescription>Información adicional registrada para este vehículo.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary rounded-full mt-1">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Nombre del Conductor</h4>
              <p className="text-muted-foreground">{driver_name || 'No registrado'}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary rounded-full mt-1">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Notas / Descripción</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{notes || 'Sin notas adicionales.'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleDetailsDialog;