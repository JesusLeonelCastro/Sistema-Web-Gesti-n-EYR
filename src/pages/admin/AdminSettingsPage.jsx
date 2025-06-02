
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { motion } from 'framer-motion';
import { Settings, DollarSign, ParkingSquare, Save, AlertCircle, XCircle, Truck, Car, PackagePlus as PackageIcon, DownloadCloud } from 'lucide-react'; // Renamed Package to PackageIcon
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

const vehicleTypes = [
  { id: 'Trailer', name: 'Tráiler', icon: Truck },
  { id: 'Automovil', name: 'Automóvil', icon: Car },
  { id: 'CamionSolo', name: 'Camión Solo', icon: Truck },
  { id: 'CamionAcoplado', name: 'Camión Acoplado', icon: PackageIcon },
];

const AdminSettingsPageForm = ({ tempSettings, errors, handleChange, handleVehicleRateChange }) => {
 return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="dailyRate" className="flex items-center text-base">
            <DollarSign className="w-5 h-5 mr-2 text-muted-foreground" />
            Tarifa Diaria General
          </Label>
          <Input 
            id="dailyRate" 
            name="dailyRate"
            type="number" 
            value={tempSettings.dailyRate} 
            onChange={handleChange} 
            placeholder="Ej: 50" 
            min="0.01"
            step="0.01"
            className={`text-lg ${errors.dailyRate ? 'border-destructive focus:ring-destructive' : ''}`}
          />
          {errors.dailyRate && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.dailyRate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalSpots" className="flex items-center text-base">
            <ParkingSquare className="w-5 h-5 mr-2 text-muted-foreground" />
            Número Total de Espacios
          </Label>
          <Input 
            id="totalSpots" 
            name="totalSpots"
            type="number" 
            value={tempSettings.totalSpots} 
            onChange={handleChange} 
            placeholder="Ej: 100" 
            min="1"
            step="1"
            className={`text-lg ${errors.totalSpots ? 'border-destructive focus:ring-destructive' : ''}`}
          />
          {errors.totalSpots && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.totalSpots}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currencySymbol" className="flex items-center text-base">
          <DollarSign className="w-5 h-5 mr-2 text-muted-foreground" />
          Símbolo de Moneda
        </Label>
        <Input 
          id="currencySymbol" 
          name="currencySymbol"
          type="text" 
          value={tempSettings.currencySymbol} 
          onChange={handleChange} 
          placeholder="Ej: Bs." 
          maxLength="5"
          className={`text-lg w-full md:w-1/2 ${errors.currencySymbol ? 'border-destructive focus:ring-destructive' : ''}`}
        />
        {errors.currencySymbol && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.currencySymbol}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="parkingName" className="flex items-center text-base">
          <ParkingSquare className="w-5 h-5 mr-2 text-muted-foreground" />
          Nombre del Estacionamiento
        </Label>
        <Input 
          id="parkingName" 
          name="parkingName"
          type="text" 
          value={tempSettings.parkingName || ''} 
          onChange={handleChange} 
          placeholder="Ej: San Jose Parking" 
          className={`text-lg ${errors.parkingName ? 'border-destructive focus:ring-destructive' : ''}`}
        />
        {errors.parkingName && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.parkingName}</p>}
      </div>


      <div className="space-y-4 pt-4 border-t">
          <h3 className="text-xl font-semibold flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-primary" />
              Tarifas Específicas por Tipo de Vehículo
          </h3>
          <p className="text-sm text-muted-foreground">
              Define tarifas diarias específicas para cada tipo de vehículo. Si se deja vacío, se usará la Tarifa Diaria General.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {vehicleTypes.map(vt => {
                  const Icon = vt.icon;
                  return (
                      <div key={vt.id} className="space-y-1">
                          <Label htmlFor={`vehicleRate_${vt.id}`} className="flex items-center text-base">
                              <Icon className="w-5 h-5 mr-2 text-muted-foreground" />
                              Tarifa {vt.name} ({tempSettings.currencySymbol})
                          </Label>
                          <Input
                              id={`vehicleRate_${vt.id}`}
                              name={`vehicleRate_${vt.id}`}
                              type="number"
                              value={tempSettings.vehicleTypeRates?.[vt.id] ?? ''}
                              onChange={(e) => handleVehicleRateChange(vt.id, e.target.value)}
                              placeholder={`Ej: 60 (Opcional)`}
                              min="0"
                              step="0.01"
                              className={`text-lg ${errors[`vehicleRate_${vt.id}`] ? 'border-destructive focus:ring-destructive' : ''}`}
                          />
                          {errors[`vehicleRate_${vt.id}`] && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors[`vehicleRate_${vt.id}`]}</p>}
                      </div>
                  );
              })}
          </div>
      </div>
    </>
 );
};


const AdminSettingsPage = () => {
  const defaultSettings = {
    dailyRate: 50, 
    totalSpots: 50,
    currencySymbol: 'Bs.',
    parkingName: 'San Jose Parking',
    vehicleTypeRates: vehicleTypes.reduce((acc, type) => {
      acc[type.id] = ''; 
      return acc;
    }, {}),
  };
  const [settings, setSettings] = useLocalStorage('parking_settings', defaultSettings);
  const [tempSettings, setTempSettings] = useState(settings);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const currentVehicleTypeRates = settings.vehicleTypeRates || {};
    const completeVehicleTypeRates = vehicleTypes.reduce((acc, type) => {
      acc[type.id] = currentVehicleTypeRates[type.id] === undefined ? '' : currentVehicleTypeRates[type.id];
      return acc;
    }, {});
    setTempSettings({ ...defaultSettings, ...settings, vehicleTypeRates: completeVehicleTypeRates });
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'dailyRate' || name === 'totalSpots') {
      processedValue = value === '' ? '' : Number(value);
       if (isNaN(processedValue) || processedValue < 0) {
         processedValue = tempSettings[name] > 0 ? tempSettings[name] : 0; 
       }
    }
    setTempSettings(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: null}));
    }
  };

  const handleVehicleRateChange = (vehicleTypeId, value) => {
    const processedValue = value === '' ? '' : Number(value);
    if (value !== '' && (isNaN(processedValue) || processedValue < 0)) {
      return;
    }
    setTempSettings(prev => ({
      ...prev,
      vehicleTypeRates: {
        ...prev.vehicleTypeRates,
        [vehicleTypeId]: processedValue,
      }
    }));
    if (errors[`vehicleRate_${vehicleTypeId}`]) {
      setErrors(prev => ({...prev, [`vehicleRate_${vehicleTypeId}`]: null}));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (tempSettings.dailyRate === '' || Number(tempSettings.dailyRate) <= 0 || typeof Number(tempSettings.dailyRate) !== 'number' || isNaN(Number(tempSettings.dailyRate))) {
      newErrors.dailyRate = "La tarifa diaria general debe ser un número positivo.";
    }
    if (tempSettings.totalSpots === '' || Number(tempSettings.totalSpots) <= 0 || typeof Number(tempSettings.totalSpots) !== 'number' || isNaN(Number(tempSettings.totalSpots))) {
      newErrors.totalSpots = "El número total de espacios debe ser un número positivo.";
    }
    if (!tempSettings.currencySymbol.trim()) {
        newErrors.currencySymbol = "El símbolo de moneda es obligatorio.";
    } else if (tempSettings.currencySymbol.length > 5) {
        newErrors.currencySymbol = "El símbolo de moneda no debe exceder los 5 caracteres.";
    }
    if (!tempSettings.parkingName || !tempSettings.parkingName.trim()) {
      newErrors.parkingName = "El nombre del estacionamiento es obligatorio.";
    }


    vehicleTypes.forEach(vt => {
      const rate = tempSettings.vehicleTypeRates[vt.id];
      if (rate !== '' && (isNaN(Number(rate)) || Number(rate) < 0)) {
        newErrors[`vehicleRate_${vt.id}`] = `La tarifa para ${vt.name} debe ser un número positivo o dejarse vacía.`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: 'Error de Validación',
        description: 'Por favor, corrige los campos marcados.',
        variant: 'destructive',
      });
      return;
    }
    
    const finalVehicleTypeRates = { ...tempSettings.vehicleTypeRates };
    for (const typeId in finalVehicleTypeRates) {
        if (finalVehicleTypeRates[typeId] === '' || finalVehicleTypeRates[typeId] === null) {
            finalVehicleTypeRates[typeId] = ''; 
        } else {
            finalVehicleTypeRates[typeId] = Number(finalVehicleTypeRates[typeId]);
        }
    }

    setSettings({
        dailyRate: Number(tempSettings.dailyRate),
        totalSpots: Number(tempSettings.totalSpots),
        currencySymbol: tempSettings.currencySymbol.trim(),
        parkingName: tempSettings.parkingName.trim(),
        vehicleTypeRates: finalVehicleTypeRates,
    });
    toast({
      title: 'Configuración Guardada',
      description: 'Los ajustes del estacionamiento han sido actualizados.',
    });
  };
  
  const handleResetData = () => {
    localStorage.removeItem('parked_trailers');
    localStorage.removeItem('trailer_history');
    localStorage.removeItem('parking_settings'); 
    
    const freshDefaultSettings = {
        dailyRate: 50,
        totalSpots: 50,
        currencySymbol: 'Bs.',
        parkingName: 'San Jose Parking',
        vehicleTypeRates: vehicleTypes.reduce((acc, type) => {
          acc[type.id] = '';
          return acc;
        }, {}),
    };
    setSettings(freshDefaultSettings); 
    setTempSettings(freshDefaultSettings);
    
    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Datos Reiniciados',
      description: 'El historial de vehículos, vehículos estacionados y configuración han sido reiniciados a los valores por defecto.',
      variant: 'default',
    });
  };

  const handleExportData = () => {
    const parkingData = {
      parking_settings: JSON.parse(localStorage.getItem('parking_settings') || '{}'),
      parked_trailers: JSON.parse(localStorage.getItem('parked_trailers') || '[]'),
      trailer_history: JSON.parse(localStorage.getItem('trailer_history') || '[]'),
      users: JSON.parse(localStorage.getItem('users') || '[]'),
    };

    const jsonString = JSON.stringify(parkingData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parking_data_export_supabase.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Datos Exportados',
      description: 'Los datos del sistema de estacionamiento han sido exportados en formato JSON.',
    });
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <Settings className="w-8 h-8 mr-3 text-primary" />
            Configuración del Estacionamiento
          </CardTitle>
          <CardDescription className="text-lg">
            Ajusta los parámetros generales y tarifas del sistema de estacionamiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <AdminSettingsPageForm 
                tempSettings={tempSettings}
                errors={errors}
                handleChange={handleChange}
                handleVehicleRateChange={handleVehicleRateChange}
            />
            <CardFooter className="pt-8 pb-0 px-0 flex flex-col sm:flex-row justify-between gap-4">
              <Button type="submit" className="w-full sm:w-auto text-base py-3">
                <Save className="w-5 h-5 mr-2" /> Guardar Configuración
              </Button>
              <Button type="button" variant="outline" onClick={handleExportData} className="w-full sm:w-auto text-base py-3">
                <DownloadCloud className="w-5 h-5 mr-2" /> Exportar Datos para Supabase
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-3xl mx-auto shadow-xl border-destructive/50 mt-12">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center text-destructive">
            <AlertCircle className="w-7 h-7 mr-3" />
            Zona de Peligro
          </CardTitle>
          <CardDescription className="text-destructive/90">
            Las acciones en esta sección son irreversibles y pueden causar pérdida de datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-base text-foreground">Reiniciar Datos del Estacionamiento</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Esto borrará todos los vehículos estacionados, el historial de movimientos y las configuraciones del estacionamiento. 
                Los datos de usuarios y del sistema de restaurante no se verán afectados.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <XCircle className="w-4 h-4 mr-2" /> Reiniciar Datos del Estacionamiento
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente todos los datos del módulo de estacionamiento, incluyendo vehículos actuales, historial y configuraciones. 
                      Los datos de usuarios y del sistema de restaurante no se verán afectados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      Sí, reiniciar datos del estacionamiento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminSettingsPage;
