import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Truck, Search, XCircle, CalendarMinus, AlertCircle, Info, DollarSign, Clock } from 'lucide-react';
import { formatDate, calculateStayDuration, getCurrentUTCISOString } from '@/lib/parkingUtils';
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

const OperatorExitLogPage = () => {
  const [plateToSearch, setPlateToSearch] = useState('');
  const [foundVehicle, setFoundVehicle] = useState(null);
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [calculatedDuration, setCalculatedDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { user } = useAuth();
  const [parkedTrailers, setParkedTrailers] = useLocalStorage('parked_trailers', []);
  const [trailerHistory, setTrailerHistory] = useLocalStorage('trailer_history', []);
  const [settings] = useLocalStorage('parking_settings', { dailyRate: 50, currencySymbol: 'Bs.', vehicleTypeRates: {} });
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const getRateForVehicle = (vehicleType) => {
    const specificRate = settings.vehicleTypeRates?.[vehicleType];
    if (specificRate !== undefined && specificRate !== null && specificRate !== '' && !isNaN(Number(specificRate)) && Number(specificRate) > 0) {
        return Number(specificRate);
    }
    return settings.dailyRate;
  };

  const calculateFee = (entryTime, exitTime, vehicleType) => {
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    if (isNaN(entry.getTime()) || isNaN(exit.getTime())) return 0;

    let diffMs = exit - entry;
    if (diffMs < 0) diffMs = 0;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.ceil(hours / 24); 
    
    const rate = getRateForVehicle(vehicleType);
    return Math.max(1, days) * rate; 
  };
  
  const handleSearch = () => {
    setError('');
    setFoundVehicle(null);
    setCalculatedFee(0);
    setCalculatedDuration('');

    if (!plateToSearch.trim()) {
      setError("Por favor, ingresa una matrícula para buscar.");
      return;
    }

    const vehicle = parkedTrailers.find(
      (v) => v.plate.toUpperCase() === plateToSearch.toUpperCase() && v.status === 'parked'
    );

    if (vehicle) {
      setFoundVehicle(vehicle);
      const now = getCurrentUTCISOString(); // Changed to UTC
      const fee = calculateFee(vehicle.entryTime, now, vehicle.vehicleType);
      const duration = calculateStayDuration(vehicle.entryTime, now);
      setCalculatedFee(fee);
      setCalculatedDuration(duration);
    } else {
      setError(`Vehículo con matrícula ${plateToSearch.toUpperCase()} no encontrado o ya salió.`);
      toast({
        title: 'Búsqueda Fallida',
        description: `Vehículo con matrícula ${plateToSearch.toUpperCase()} no encontrado entre los estacionados.`,
        variant: 'destructive',
      });
    }
  };
  
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const plateFromQuery = queryParams.get('plate');
    if (plateFromQuery) {
      setPlateToSearch(plateFromQuery.toUpperCase());
      setTimeout(() => { // Ensure state is set before trying to use it
        const vehicle = parkedTrailers.find(
          (v) => v.plate.toUpperCase() === plateFromQuery.toUpperCase() && v.status === 'parked'
        );
        if (vehicle) {
          setFoundVehicle(vehicle);
          const now = getCurrentUTCISOString(); // Changed to UTC
          const fee = calculateFee(vehicle.entryTime, now, vehicle.vehicleType);
          const duration = calculateStayDuration(vehicle.entryTime, now);
          setCalculatedFee(fee);
          setCalculatedDuration(duration);
        } else {
          setError(`Vehículo con matrícula ${plateFromQuery.toUpperCase()} no encontrado o ya salió.`);
        }
      }, 100); // Small delay to allow state update
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]); // Removed parkedTrailers from deps to avoid re-triggering search on every parkedTrailers change


  const handleRegisterExit = () => {
    if (!foundVehicle) return;

    const exitTimeISO = getCurrentUTCISOString(); // Changed to UTC
    const finalFee = calculateFee(foundVehicle.entryTime, exitTimeISO, foundVehicle.vehicleType);
    const finalDuration = calculateStayDuration(foundVehicle.entryTime, exitTimeISO);

    const updatedVehicle = {
      ...foundVehicle,
      exitTime: exitTimeISO,
      status: 'exited',
      fee: finalFee, // Use calculatedFee if it's already set and reliable
      calculatedFee: finalFee, // Store the calculated fee at exit
      durationDays: Math.ceil( (new Date(exitTimeISO) - new Date(foundVehicle.entryTime)) / (1000 * 60 * 60 * 24) ),
      notes: (foundVehicle.notes || '') + (notes ? ` Salida: ${notes}` : ''),
      exitOperatorId: user?.id,
      exitOperatorName: user?.name || user?.username || 'Sistema',
    };

    setParkedTrailers(parkedTrailers.filter(v => v.id !== foundVehicle.id));
    
    const historyIndex = trailerHistory.findIndex(item => item.id === foundVehicle.id && item.type === 'entry');
    if (historyIndex !== -1) {
        const updatedHistory = [...trailerHistory];
        updatedHistory[historyIndex] = { ...updatedVehicle, type: 'exit' }; 
        setTrailerHistory(updatedHistory);
    } else {
        setTrailerHistory([...trailerHistory, { ...updatedVehicle, type: 'exit' }]);
    }


    toast({
      title: 'Salida Registrada Exitosamente',
      description: `Vehículo ${foundVehicle.plate} salió. Tarifa: ${settings.currencySymbol} ${finalFee.toFixed(2)}. Duración: ${finalDuration}.`,
    });

    setFoundVehicle(null);
    setPlateToSearch('');
    setCalculatedFee(0);
    setCalculatedDuration('');
    setNotes('');
    setError('');
    navigate('/operator/exit-log'); 
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <CalendarMinus className="w-8 h-8 mr-3 text-red-500" />
            Registrar Salida de Vehículo
          </CardTitle>
          <CardDescription className="text-lg">
            Busca el vehículo por matrícula para registrar su salida y calcular la tarifa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end space-x-2">
            <div className="flex-grow space-y-1">
              <Label htmlFor="plateSearch" className="flex items-center"><Truck className="w-4 h-4 mr-2 text-primary"/>Matrícula a Buscar</Label>
              <Input
                id="plateSearch"
                value={plateToSearch}
                onChange={(e) => setPlateToSearch(e.target.value.toUpperCase())}
                placeholder="EJ: AB123CD"
                className={error ? 'border-destructive' : ''}
              />
            </div>
            <Button onClick={handleSearch} className="bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-opacity">
              <Search className="w-4 h-4 mr-2" /> Buscar
            </Button>
          </div>
          {error && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{error}</p>}

          {foundVehicle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="p-4 border rounded-lg bg-muted/30 space-y-4"
            >
              <h3 className="text-xl font-semibold text-primary">Vehículo Encontrado</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><strong className="text-muted-foreground">Matrícula:</strong> {foundVehicle.plate}</p>
                <p><strong className="text-muted-foreground">Tipo:</strong> {foundVehicle.vehicleType}</p>
                <p><strong className="text-muted-foreground">País:</strong> {foundVehicle.country}</p>
                <p><strong className="text-muted-foreground">Entrada:</strong> {formatDate(foundVehicle.entryTime)}</p>
                <p><strong className="text-muted-foreground">Registrado por:</strong> {foundVehicle.entryOperatorName || 'N/A'}</p>
                {foundVehicle.driverPhone && <p><strong className="text-muted-foreground">Tel. Conductor:</strong> {foundVehicle.driverPhone}</p>}
                {foundVehicle.description && <p className="col-span-full"><strong className="text-muted-foreground">Descripción:</strong> {foundVehicle.description}</p>}
              </div>
              
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center text-lg font-semibold">
                    <Clock className="w-5 h-5 mr-2 text-green-500"/>
                    Estadía Estimada: <span className="ml-1 text-green-600">{calculatedDuration || 'Calculando...'}</span>
                </div>
                <div className="flex items-center text-xl font-bold">
                    <DollarSign className="w-6 h-6 mr-1 text-green-500"/>
                    Tarifa Estimada a Pagar: 
                    <span className="ml-2 text-green-600">{settings.currencySymbol} {calculatedFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes" className="flex items-center"><Info className="w-4 h-4 mr-2 text-primary"/>Notas Adicionales (Opcional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="EJ: Pagó con descuento, observación especial, etc." rows={2}/>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90 transition-opacity text-base py-3 mt-2">
                    <CalendarMinus className="w-5 h-5 mr-2" /> Registrar Salida
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Salida del Vehículo</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de registrar la salida del vehículo <strong className="text-primary">{foundVehicle.plate}</strong>?
                      <br />
                      Hora de entrada: {formatDate(foundVehicle.entryTime)}.
                      <br />
                      Estadía calculada: <strong>{calculatedDuration}</strong>.
                      <br />
                      Monto a pagar: <strong className="text-lg">{settings.currencySymbol} {calculatedFee.toFixed(2)}</strong>.
                      <br />
                      Esta acción no se puede deshacer fácilmente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegisterExit} className="bg-red-500 hover:bg-red-600">
                      Sí, Registrar Salida
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

            </motion.div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
            {foundVehicle && (
                <Button variant="ghost" onClick={() => { setFoundVehicle(null); setPlateToSearch(''); setError(''); setCalculatedFee(0); setCalculatedDuration(''); navigate('/operator/exit-log'); }} className="text-muted-foreground">
                <XCircle className="w-4 h-4 mr-2"/> Limpiar
                </Button>
            )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default OperatorExitLogPage;