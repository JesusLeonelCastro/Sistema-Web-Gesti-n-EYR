import { Truck, Car, Package as PackageIcon } from 'lucide-react'; // Renamed Package to PackageIcon to avoid conflict

export const vehicleTypeIcons = {
    "Trailer": Truck,
    "Automovil": Car,
    "CamionSolo": Truck,
    "CamionAcoplado": PackageIcon,
    "Default": Truck
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }
  return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
};

export const calculateStayDuration = (entryTimeString, exitTimeString = null) => {
  const entryTime = new Date(entryTimeString);
  if (isNaN(entryTime.getTime())) return 'N/A';

  const exitTime = exitTimeString ? new Date(exitTimeString) : new Date();
  if (isNaN(exitTime.getTime())) return 'N/A';
  
  let diffMs = exitTime - entryTime;
  if (diffMs < 0) diffMs = 0; // Prevent negative duration

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  diffMs -= diffDays * (1000 * 60 * 60 * 24);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  diffMs -= diffHours * (1000 * 60 * 60);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  let durationString = "";
  if (diffDays > 0) durationString += `${diffDays}d `;
  if (diffHours > 0 || diffDays > 0) durationString += `${diffHours}h `;
  durationString += `${diffMinutes}m`;
  return durationString.trim();
};