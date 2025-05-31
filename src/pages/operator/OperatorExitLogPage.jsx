import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { LogOut, Truck, CalendarDays, Clock, DollarSign, AlertTriangle, Info, Search, XCircle, Package, Car } from 'lucide-react';
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

const vehicleTypeIcons = {
  "Trailer": Truck,
  "Automovil": Car,
  "CamionSolo": Truck,
  "CamionAcoplado": Package,
  "Default": Truck
};

const OperatorExitLogPage = () => {
  const [parkedTrailers, setParkedTrailers] = useLocalStorage('parked_trailers', []);
  const [trailerHistory, setTrailerHistory] = useLocalStorage('trailer_history', []);
  const [settings] = useLocalStorage('parking_settings', { dailyRate: 50, totalSpots: 50, currencySymbol: 'Bs.', vehicleTypeRates: {} });
  
  const [plate, setPlate] = useState('');
  const [foundTrailer, setFoundTrailer] = useState(null);
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [stayDuration, setStayDuration] = useState('');
  const [exitTime, setExitTime] = useState(new Date());
  const [error, setError] = useState('');

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const plateFromQuery = queryParams.get('plate');
    if (plateFromQuery) {
      setPlate(plateFromQuery);
      handleSearchPlate(plateFromQuery);
    }
  }, [location.search, parkedTrailers]);

  useEffect(() => {
    let timer;
    if (foundTrailer) {
      timer = setInterval(() => {
        setExitTime(new Date());
        calculateFeeAndDuration(foundTrailer, new Date());
      }, 60000); // Update every minute
    }
    return () => clearInterval(timer);
  }, [foundTrailer, settings]);

  const getRateForVehicle = (vehicleType) => {
    const specificRate = settings.vehicleTypeRates?.[vehicleType];
    if (specificRate !== undefined && specificRate !== null && specificRate !== '' && !isNaN(Number(specificRate)) && Number(specificRate) > 0) {
      return Number(specificRate);
    }
    return settings.dailyRate; // Fallback to general daily rate
  };

  const calculateFeeAndDuration = (trailer, currentExitTime) => {
    if (!trailer || !trailer.entryTime) return;
    const entry = new Date(trailer.entryTime);
    const exit = currentExitTime;
    
    let diffMs = exit - entry;
    if (diffMs < 0) diffMs = 0; // Prevent negative duration if clock is off

    const diffDaysTotal = diffMs / (1000 * 60 * 60 * 24);
    const billableDays = Math.ceil(diffDaysTotal); // Any part of a day counts as a full day

    const rate = getRateForVehicle(trailer.vehicleType);
    const fee = billableDays * rate;
    setCalculatedFee(fee);

    const displayDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    diffMs -= displayDays * (1000 * 60 * 60 * 24);
    const displayHours = Math.floor(diffMs / (1000 * 60 * 60));
    diffMs -= displayHours * (1000 * 60 * 60);
    const displayMinutes = Math.floor(diffMs / (1000 * 60));
    
    let durationStr = "";
    if (displayDays > 0) durationStr += `${displayDays}d `;
    if (displayHours > 0 || displayDays > 0) durationStr += `${displayHours}h `;
    durationStr += `${displayMinutes}m`;
    setStayDuration(durationStr.trim());
  };

  const handleSearchPlate = (searchPlate = plate) => {
    setError('');
    setFoundTrailer(null);
    setCalculatedFee(0);
    setStayDuration('');

    if (!searchPlate.trim()) {
      setError('Por favor, ingresa una matrícula.');
      return;
    }
    const trailer = parkedTrailers.find(t => t.plate.toLowerCase() === searchPlate.trim().toLowerCase() && t.status === 'parked');
    if (trailer) {
      setFoundTrailer(trailer);
      const currentExit = new Date();
      setExitTime(currentExit);
      calculateFeeAndDuration(trailer, currentExit);
    } else {
      setError(`Vehículo con matrícula "${searchPlate}" no encontrado o ya ha salido.`);
      toast({
        title: 'Vehículo no Encontrado',
        description: `No se encontró ningún vehículo activo con la matrícula ${searchPlate}.`,
        variant: 'destructive',
      });
    }
  };

  const handleRegisterExit = () => {
    if (!foundTrailer) return;

    const finalExitTime = new Date(); // Use current time for final registration
    calculateFeeAndDuration(foundTrailer, finalExitTime); // Recalculate with final time

    const updatedTrailer = {
      ...foundTrailer,
      status: 'exited',
      exitTime: finalExitTime.toISOString(),
      durationDays: Math.ceil((finalExitTime - new Date(foundTrailer.entryTime)) / (1000 * 60 * 60 * 24)),
      fee: calculatedFee, // Use the state variable which is updated by calculateFeeAndDuration
      forcedExit: false,
    };

    setParkedTrailers(prev => prev.filter(t => t.id !== foundTrailer.id));
    setTrailerHistory(prev => [...prev, { ...updatedTrailer, type: 'exit' }]);

    toast({
      title: 'Salida Registrada Exitosamente',
      description: `Vehículo ${foundTrailer.plate} ha salido. Tarifa: ${settings.currencySymbol}${calculatedFee.toFixed(2)}.`,
      variant: 'default',
    });
    navigate('/operator/active-trailers');
  };

  const formatDate = (date) => {
    return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const Icon = foundTrailer ? (vehicleTypeIcons[foundTrailer.vehicleType] || vehicleTypeIcons.Default) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <LogOut className="w-8 h-8 mr-3 text-primary" />
            Registrar Salida de Vehículo
          </CardTitle>
          <CardDescription className="text-lg">
            Busca el vehículo por matrícula para registrar su salida y calcular la tarifa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-3">
            <div className="flex-grow">
              <Label htmlFor="plate" className="text-base">Matrícula del Vehículo</Label>
              <div className="relative">
                <Input
                  id="plate"
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="Ej: ABC-123"
                  className="text-lg mt-1 pr-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchPlate()}
                />
                {plate && (
                    <Button variant="ghost" size="icon" onClick={() => {setPlate(''); setFoundTrailer(null); setError('');}} title="Limpiar matrícula" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8">
                        <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                )}
              </div>
            </div>
            <Button onClick={() => handleSearchPlate()} className="text-base py-3 px-6">
              <Search className="w-5 h-5 mr-2" /> Buscar
            </Button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-md bg-destructive/10 text-destructive flex items-center gap-2">
              <AlertTriangle size={18} /> {error}
            </motion.div>
          )}

          {foundTrailer && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-4 border-t border-border/50">
              <h3 className="text-xl font-semibold text-primary flex items-center">
                {Icon && <Icon className="w-6 h-6 mr-2" />}
                Detalles del Vehículo Encontrado
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><strong>Matrícula:</strong> {foundTrailer.plate}</div>
                <div><strong>País:</strong> {foundTrailer.country}</div>
                <div><strong>Tipo:</strong> {foundTrailer.vehicleType || 'N/A'}</div>
                <div><strong>Teléfono Conductor:</strong> {foundTrailer.driverPhone || 'N/A'}</div>
                <div className="col-span-full"><strong>Descripción:</strong> {foundTrailer.description || 'N/A'}</div>
                <div>
                  <CalendarDays className="inline-block mr-1.5 h-4 w-4 text-muted-foreground" />
                  <strong>Entrada:</strong> {formatDate(new Date(foundTrailer.entryTime))}
                </div>
                <div>
                  <Clock className="inline-block mr-1.5 h-4 w-4 text-muted-foreground" />
                  <strong>Salida Actual:</strong> {formatDate(exitTime)}
                </div>
                <div className="col-span-full mt-2">
                  <Info className="inline-block mr-1.5 h-4 w-4 text-muted-foreground" />
                  <strong>Tiempo de Estadía:</strong> <span className="font-semibold">{stayDuration}</span>
                </div>
                <div className="col-span-full">
                  <DollarSign className="inline-block mr-1.5 h-4 w-4 text-muted-foreground" />
                  <strong>Tarifa Calculada:</strong> <span className="font-semibold text-lg text-green-500">{settings.currencySymbol}{calculatedFee.toFixed(2)}</span>
                   <span className="text-xs text-muted-foreground ml-1">(Tarifa aplicada: {settings.currencySymbol}{getRateForVehicle(foundTrailer.vehicleType)}/día)</span>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
        <CardFooter>
          {foundTrailer && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full text-lg py-6" disabled={!foundTrailer}>
                  <LogOut className="w-5 h-5 mr-2" /> Registrar Salida
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Salida</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de registrar la salida del vehículo <strong className="text-foreground">{foundTrailer?.plate}</strong>?
                    La tarifa calculada es de <strong className="text-foreground">{settings.currencySymbol}{calculatedFee.toFixed(2)}</strong>.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRegisterExit}>Confirmar Salida</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default OperatorExitLogPage;