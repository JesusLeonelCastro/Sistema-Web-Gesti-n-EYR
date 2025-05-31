import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Truck, AlertTriangle, Edit3, DollarSign } from 'lucide-react';
import { vehicleTypeIcons, formatDate, calculateStayDuration } from '@/lib/parkingUtils';
import EditEntryTimeForm from '@/pages/admin/components/EditEntryTimeForm';

const TrailerDetailsDialog = ({ isOpen, onOpenChange, trailer, onForceExit, onUpdateEntryTime, settings, getRateForVehicle }) => {
  const [isConfirmForceExitOpen, setIsConfirmForceExitOpen] = useState(false);
  const [isEditingEntryTime, setIsEditingEntryTime] = useState(false);

  if (!trailer) return null;

  const IconComponent = vehicleTypeIcons[trailer.vehicleType] || vehicleTypeIcons.Default;
  const currentRate = getRateForVehicle(trailer.vehicleType);


  const handleForceExitConfirm = () => {
    onForceExit(trailer);
    setIsConfirmForceExitOpen(false);
    onOpenChange(false); 
  };

  const handleSaveEntryTime = (newEntryTime) => {
    onUpdateEntryTime(trailer, newEntryTime);
    setIsEditingEntryTime(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setIsEditingEntryTime(false); 
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <Truck className="w-6 h-6 mr-2 text-primary" /> Detalles del Vehículo
          </DialogTitle>
          <DialogDescription>
            Información completa del vehículo estacionado.
          </DialogDescription>
        </DialogHeader>

        {isEditingEntryTime ? (
          <EditEntryTimeForm
            trailer={trailer}
            onSave={handleSaveEntryTime}
            onCancel={() => setIsEditingEntryTime(false)}
          />
        ) : (
          <div className="grid gap-3 py-4 text-sm">
            <div className="grid grid-cols-3 items-center gap-2">
              <span className="font-semibold text-muted-foreground col-span-1">Matrícula:</span>
              <span className="col-span-2 text-primary font-medium">{trailer.plate}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <span className="font-semibold text-muted-foreground col-span-1">Tipo:</span>
              <span className="col-span-2 flex items-center">
                <IconComponent className="w-4 h-4 mr-2 text-muted-foreground" />
                {trailer.vehicleType || 'N/A'}
              </span>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <span className="font-semibold text-muted-foreground col-span-1">País:</span>
              <span className="col-span-2">{trailer.country}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <span className="font-semibold text-muted-foreground col-span-1">Entrada:</span>
              <span className="col-span-2">{formatDate(trailer.entryTime)}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <span className="font-semibold text-muted-foreground col-span-1">Estadía Actual:</span>
              <span className="col-span-2">{calculateStayDuration(trailer.entryTime)}</span>
            </div>
             <div className="grid grid-cols-3 items-center gap-2">
              <span className="font-semibold text-muted-foreground col-span-1">Tarifa Aplicable:</span>
              <span className="col-span-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-1 text-muted-foreground" />
                {settings.currencySymbol}{currentRate}/día
              </span>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
              <span className="font-semibold text-muted-foreground col-span-1">Teléfono:</span>
              <span className="col-span-2">{trailer.driverPhone || 'N/A'}</span>
            </div>
            {trailer.description && (
              <div className="grid grid-cols-1 gap-1">
                <span className="font-semibold text-muted-foreground">Descripción:</span>
                <p className="text-foreground bg-muted/50 p-2 rounded-md whitespace-pre-wrap break-words">
                  {trailer.description}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="sm:justify-between gap-2 pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cerrar</Button>
          </DialogClose>
          <div className="flex gap-2">
            {!isEditingEntryTime && (
               <Button variant="secondary" onClick={() => setIsEditingEntryTime(true)} disabled={trailer.status !== 'parked'}>
                <Edit3 className="h-4 w-4 mr-2" /> Editar Entrada
              </Button>
            )}
             {!isEditingEntryTime && (
                <AlertDialog open={isConfirmForceExitOpen} onOpenChange={setIsConfirmForceExitOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      disabled={trailer.status !== 'parked'}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" /> Forzar Salida
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Confirmar Salida Forzada?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esto registrará la salida del vehículo <strong className="text-foreground">{trailer.plate}</strong> y calculará la tarifa según la tarifa de <strong className="text-foreground">{settings.currencySymbol}{currentRate}/día</strong>.
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleForceExitConfirm} className="bg-destructive hover:bg-destructive/90">
                        Confirmar Salida
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
             )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrailerDetailsDialog;