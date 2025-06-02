
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'; // Removed DialogClose as it's handled by onOpenChange
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Truck, AlertTriangle, Edit3, DollarSign, X } from 'lucide-react';
import { vehicleTypeIcons, formatDate, calculateStayDuration } from '@/lib/parkingUtils';


const TrailerDetailsDialog = ({ 
  isOpen, 
  onOpenChange, 
  trailer, 
  onForceExitRequest, 
  onEditRequest, 
  settings, 
  getRateForVehicle 
}) => {
  
  const currentRate = useCallback(() => {
    if (!trailer || typeof getRateForVehicle !== 'function') {
      return settings?.dailyRate || 0; // Ensure settings and dailyRate exist
    }
    return getRateForVehicle(trailer.vehicleType);
  }, [trailer, getRateForVehicle, settings?.dailyRate]);

  if (!trailer) return null; // Early return for when trailer is not available

  const IconComponent = vehicleTypeIcons[trailer.vehicleType] || vehicleTypeIcons.Default;


  const handleEditClick = () => {
    if (typeof onEditRequest === 'function') {
      onEditRequest(trailer);
    }
  };

  const handleForceExitClick = () => {
    if (typeof onForceExitRequest === 'function') {
      onForceExitRequest(trailer);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <Truck className="w-6 h-6 mr-2 text-primary" /> Detalles del Vehículo
          </DialogTitle>
          <DialogDescription>
            Información completa del vehículo estacionado.
          </DialogDescription>
        </DialogHeader>
        
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
              {settings?.currencySymbol || '$'}{currentRate()}/día
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

        <DialogFooter className="sm:justify-between gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2"/> Cerrar
          </Button>
          <div className="flex gap-2">
              <Button variant="secondary" onClick={handleEditClick} disabled={trailer.status !== 'parked'}>
              <Edit3 className="h-4 w-4 mr-2" /> Editar Entrada
            </Button>
              <Button 
                  variant="destructive" 
                  onClick={handleForceExitClick}
                  disabled={trailer.status !== 'parked'}
              >
                  <AlertTriangle className="h-4 w-4 mr-2" /> Forzar Salida
              </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrailerDetailsDialog;
