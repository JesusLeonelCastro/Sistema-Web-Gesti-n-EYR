import { Truck, Car, Package as PackageIcon } from 'lucide-react';

export const vehicleTypeIcons = {
    "Trailer": Truck,
    "Automovil": Car,
    "CamionSolo": Truck,
    "CamionAcoplado": PackageIcon,
    "Default": Truck
};

export const getCurrentUTCISOString = () => {
  return new Date().toISOString();
};

export const formatDate = (dateString, shortTime = false) => {
  if (!dateString) return 'N/A';
  
  let date;
  date = new Date(dateString);

  if (isNaN(date.getTime())) {
    // Fallback for dates that might be stored in a different, non-ISO format locally
    // This might happen if a date was stored using new Date().toString() directly
    // It's less likely with our current setup but good for robustness
    const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (parts) {
      date = new Date(Date.UTC(parts[1], parts[2] - 1, parts[3], parts[4], parts[5], parts[6]));
    } else if (new Date(dateString.replace(/-/g, '/')).getTime()) { // Try replacing hyphens for broader compatibility
        date = new Date(dateString.replace(/-/g, '/'));
    } else {
        return 'Fecha inválida';
    }
  }
  
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  const optionsDate = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'America/Santiago',
  };

  const optionsTime = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  };
  
  const formattedDate = date.toLocaleDateString('es-CL', optionsDate);
  const formattedTime = date.toLocaleTimeString('es-CL', optionsTime);

  return shortTime ? `${formattedDate} ${formattedTime}` : `${formattedDate} ${formattedTime}`;
};


export const calculateStayDuration = (entryTimeString, exitTimeString = null) => {
  const entryTime = new Date(entryTimeString);
  if (isNaN(entryTime.getTime())) return 'N/A';

  const exitTime = exitTimeString ? new Date(exitTimeString) : new Date(getCurrentUTCISOString()); 
  if (isNaN(exitTime.getTime())) return 'N/A';
  
  let diffMs = exitTime - entryTime;
  if (diffMs < 0) diffMs = 0; // Should not happen if entryTime is always in the past

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  diffMs -= diffDays * (1000 * 60 * 60 * 24);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  diffMs -= diffHours * (1000 * 60 * 60);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  let durationString = "";
  if (diffDays > 0) durationString += `${diffDays}d `;
  if (diffHours > 0 || diffDays > 0) durationString += `${diffHours}h `;
  durationString += `${diffMinutes}m`;
  return durationString.trim() || "0m"; // Return "0m" if duration is less than a minute
};