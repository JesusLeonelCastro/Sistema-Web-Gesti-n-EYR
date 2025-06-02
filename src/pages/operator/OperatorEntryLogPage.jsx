import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Truck, CalendarPlus, Flag, AlertCircle, Phone, FileText, Car, Package, ParkingSquare, Users2, CheckSquare } from 'lucide-react';
import { generateEntryTicketPDF } from '@/lib/pdfGenerator';
import { getCurrentUTCISOString, formatDate } from '@/lib/parkingUtils';

const countryOptions = [
  { value: "Bolivia", label: "Bolivia" },
  { value: "Peru", label: "Perú" },
  { value: "Chile", label: "Chile" },
  { value: "Argentina", label: "Argentina" },
  { value: "Brasil", label: "Brasil" },
  { value: "Paraguay", label: "Paraguay" },
  { value: "Uruguay", label: "Uruguay" },
  { value: "Otro", label: "Otro" },
];

const vehicleTypeOptions = [
    { value: "Trailer", label: "Tráiler", icon: Truck },
    { value: "Automovil", label: "Automóvil", icon: Car },
    { value: "CamionSolo", label: "Camión Solo", icon: Truck },
    { value: "CamionAcoplado", label: "Camión Acoplado", icon: Package },
];

const OperatorEntryLogPage = () => {
  const [plate, setPlate] = useState('');
  const [country, setCountry] = useState('');
  const [vehicleType, setVehicleType] = useState('Trailer');
  const [driverPhone, setDriverPhone] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const { user } = useAuth();
  const [parkedTrailers, setParkedTrailers] = useLocalStorage('parked_trailers', []);
  const [trailerHistory, setTrailerHistory] = useLocalStorage('trailer_history', []);
  const [settings] = useLocalStorage('parking_settings', { dailyRate: 50, totalSpots: 50, currencySymbol: 'Bs.', parkingName: 'San Jose Parking' });
  const { toast } = useToast();

  const currentlyParkedCount = useMemo(() => {
    return parkedTrailers.filter(t => t.status === 'parked').length;
  }, [parkedTrailers]);

  const availableSpots = useMemo(() => {
    return settings.totalSpots - currentlyParkedCount;
  }, [settings.totalSpots, currentlyParkedCount]);

  const validatePlateFormat = (plateValue) => {
    if (!plateValue.trim()) return "La matrícula es obligatoria.";
    if (plateValue.length < 3 || plateValue.length > 10) return "La matrícula debe tener entre 3 y 10 caracteres.";
    if (!/^[A-Z0-9]+$/.test(plateValue)) return "La matrícula solo puede contener letras mayúsculas y números.";
    return "";
  };

  const validate = () => {
    const newErrors = {};
    const plateError = validatePlateFormat(plate);
    if (plateError) newErrors.plate = plateError;

    if (!country) newErrors.country = "El país de origen es obligatorio.";
    if (!vehicleType) newErrors.vehicleType = "El tipo de vehículo es obligatorio.";
    
    if (driverPhone.trim() && !/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(driverPhone)) {
        newErrors.driverPhone = "El formato del teléfono no es válido.";
    }
    if (description.length > 200) {
        newErrors.description = "La descripción no debe exceder los 200 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: 'Error de Validación',
        description: 'Por favor, corrige los campos marcados.',
        variant: 'destructive',
      });
      return;
    }

    if (availableSpots <= 0) {
        toast({
            title: 'Capacidad Llena',
            description: 'El estacionamiento ha alcanzado su capacidad máxima. No se pueden registrar más entradas.',
            variant: 'destructive',
        });
        return;
    }

    const isAlreadyParked = parkedTrailers.find(
      (trailer) => trailer.plate === plate.toUpperCase() && trailer.status === 'parked'
    );

    if (isAlreadyParked) {
      setErrors(prev => ({ ...prev, plate: `El vehículo con matrícula ${plate.toUpperCase()} ya se encuentra estacionado.` }));
      toast({
        title: 'Registro Duplicado',
        description: `El vehículo con matrícula ${plate.toUpperCase()} ya está registrado como estacionado.`,
        variant: 'destructive',
      });
      return;
    }
    
    setErrors({});

    const entryTimeISO = getCurrentUTCISOString(); // Changed to UTC
    const newVehicleEntry = {
      id: `vehicle-${Date.now()}-${plate.toUpperCase()}`,
      plate: plate.toUpperCase(),
      country,
      vehicleType,
      driverPhone: driverPhone.trim() || null,
      description: description.trim() || null,
      entryTime: entryTimeISO,
      status: 'parked',
      entryOperatorId: user?.id,
      entryOperatorName: user?.name || user?.username || 'Sistema',
    };

    setParkedTrailers([...parkedTrailers, newVehicleEntry]);
    setTrailerHistory([...trailerHistory, { ...newVehicleEntry, type: 'entry' }]);

    toast({
      title: 'Entrada Registrada Exitosamente',
      description: `Vehículo ${plate.toUpperCase()} (${vehicleType}) de ${country} ingresó a las ${formatDate(entryTimeISO, true)}.`, // formatDate will convert to Chile time for display
    });

    generateEntryTicketPDF(newVehicleEntry, settings);

    setPlate('');
    setCountry('');
    setVehicleType('Trailer');
    setDriverPhone('');
    setDescription('');
    setErrors({});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium !text-primary">Vehículos Estacionados</CardTitle>
            <Users2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentlyParkedCount}</div>
            <p className="text-xs text-primary/80">Actualmente en el garaje.</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium !text-green-600">Espacios Disponibles</CardTitle>
            <CheckSquare className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${availableSpots > 0 ? 'text-green-600' : 'text-red-600'}`}>{availableSpots > 0 ? availableSpots : 'Lleno'}</div>
            <p className="text-xs text-green-600/80">Para nuevos vehículos.</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium !text-secondary">Capacidad Total</CardTitle>
            <ParkingSquare className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{settings.totalSpots}</div>
            <p className="text-xs text-secondary/80">Espacios en total.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <CalendarPlus className="w-8 h-8 mr-3 text-secondary" />
            Registrar Entrada de Vehículo
          </CardTitle>
          <CardDescription className="text-lg">
            Completa los datos del vehículo que ingresa al estacionamiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label htmlFor="plate" className="flex items-center"><Truck className="w-4 h-4 mr-2 text-primary" />Matrícula <span className="text-destructive ml-1">*</span></Label>
                <Input id="plate" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="EJ: AB123CD" className={errors.plate ? 'border-destructive' : ''} />
                {errors.plate && <p className="text-xs text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.plate}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="country" className="flex items-center"><Flag className="w-4 h-4 mr-2 text-primary" />País de Origen <span className="text-destructive ml-1">*</span></Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className={`w-full ${errors.country ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-xs text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.country}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <Label htmlFor="vehicleType" className="flex items-center"><Package className="w-4 h-4 mr-2 text-primary" />Tipo de Vehículo <span className="text-destructive ml-1">*</span></Label>
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger className={`w-full ${errors.vehicleType ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Selecciona tipo de vehículo" />
                    </SelectTrigger>
                    <SelectContent>
                        {vehicleTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center">
                                <option.icon className="w-4 h-4 mr-2" />
                                {option.label}
                            </span>
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    {errors.vehicleType && <p className="text-xs text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.vehicleType}</p>}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="driverPhone" className="flex items-center"><Phone className="w-4 h-4 mr-2 text-primary" />Teléfono Conductor (Opcional)</Label>
                    <Input id="driverPhone" type="tel" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="EJ: +591 71234567" className={errors.driverPhone ? 'border-destructive' : ''} />
                    {errors.driverPhone && <p className="text-xs text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.driverPhone}</p>}
                </div>
            </div>

            <div className="space-y-1">
                <Label htmlFor="description" className="flex items-center"><FileText className="w-4 h-4 mr-2 text-primary" />Descripción (Opcional)</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="EJ: Carga frágil, contenedor azul, etc." className={errors.description ? 'border-destructive' : ''} rows={3}/>
                {errors.description && <p className="text-xs text-destructive mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{errors.description}</p>}
            </div>

            <CardFooter className="pt-6 px-0">
              <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-green-600 hover:opacity-90 transition-opacity text-base py-3" disabled={availableSpots <= 0}>
                <CalendarPlus className="w-5 h-5 mr-2" /> {availableSpots <= 0 ? 'Estacionamiento Lleno' : 'Registrar Entrada y Generar Ticket'}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OperatorEntryLogPage;