export const GARAGE_ORDER_STATUSES = {
  ACTIVE: 'activo',
  COMPLETED: 'completado',
};

export const RESTAURANT_ORDER_STATUSES = {
  
  IN_PROGRESS: 'en preparación',
  READY_FOR_PICKUP: 'listo para servir',
  COMPLETED: 'completado',
  CANCELLED: 'cancelado',
};

export const RESTAURANT_ORDER_STATUS_CLASSES = {

  'en preparación': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'listo para servir': 'bg-green-500/10 text-green-500 border-green-500/20',
  'completado': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  'cancelado': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export const RESTAURANT_ORDER_STATUS_OPTIONS = [

  'en preparación',
  'listo para servir',
  'completado',
  'cancelado',
];

export const PAYMENT_METHODS = {
  CASH: 'efectivo',
  TRANSFER: 'transferencia',
  DEBIT: 'debito',
  CREDIT: 'credito',
};

export const PAYMENT_METHOD_OPTIONS = ['efectivo', 'transferencia', 'debito', 'credito'];

export const SOUTH_AMERICAN_COUNTRIES = [
  'Argentina',
  'Bolivia',
  'Brasil',
  'Chile',
  'Perú',
  'Colombia',
  'Ecuador',
  'Paraguay',
];

export const VEHICLE_TYPES = [
  'Automóvil',
  'Trailer',
  'Camión Solo',
  'Camión Acoplado',
];