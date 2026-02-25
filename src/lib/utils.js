
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { intervalToDuration, parseISO, differenceInDays, differenceInHours } from 'date-fns';

const CHILE_TIMEZONE = 'America/Santiago';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getChileanTime() {
  return new Date();
}

export function formatInChileanTime(date, formatString) {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  const options = { timeZone: CHILE_TIMEZONE, hour12: false };

  const formatParts = formatString.split(/[\s,]+/);

  if (formatParts.some(p => p.includes('dd'))) options.day = '2-digit';
  if (formatParts.some(p => p.includes('MM'))) options.month = '2-digit';
  if (formatParts.some(p => p.includes('yyyy'))) options.year = 'numeric';
  else if (formatParts.some(p => p.includes('yy'))) options.year = '2-digit';
  
  if (formatParts.some(p => p.includes('HH'))) options.hour = '2-digit';
  if (formatParts.some(p => p.includes('mm'))) options.minute = '2-digit';
  if (formatParts.some(p => p.includes('ss'))) options.second = '2-digit';

  if (formatString === "dd 'de' LLLL 'de' yyyy, HH:mm") {
     const day = new Intl.DateTimeFormat('es-CL', { day: 'numeric', timeZone: CHILE_TIMEZONE }).format(dateObj);
     const month = new Intl.DateTimeFormat('es-CL', { month: 'long', timeZone: CHILE_TIMEZONE }).format(dateObj);
     const year = new Intl.DateTimeFormat('es-CL', { year: 'numeric', timeZone: CHILE_TIMEZONE }).format(dateObj);
     const time = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: CHILE_TIMEZONE }).format(dateObj);
     return `${day} de ${month} de ${year}, ${time}`;
  }
  
  return new Intl.DateTimeFormat('es-CL', options).format(dateObj).replace(/\//g, '/');
}

export function calculateStayDuration(entryAt, exitAt) {
  if (!entryAt) return { formatted: 'N/A', isUnder8Hours: false, duration: {} };
  
  const entryDate = typeof entryAt === 'string' ? parseISO(entryAt) : entryAt;
  const endDate = exitAt ? (typeof exitAt === 'string' ? parseISO(exitAt) : exitAt) : new Date();

  if (entryDate > endDate) return { formatted: 'Fecha futura', isUnder8Hours: false, duration: {} };

  // Calculate total hours for the 8-hour check
  const totalHours = differenceInHours(endDate, entryDate);
  const isUnder8Hours = totalHours < 8;

  // For durations less than a month, intervalToDuration is fine.
  if (differenceInDays(endDate, entryDate) < 30) {
      const duration = intervalToDuration({ start: entryDate, end: endDate });
      const parts = [];
      if (duration.days && duration.days > 0) parts.push(`${duration.days}d`);
      if (duration.hours && duration.hours > 0) parts.push(`${duration.hours}h`);
      if (duration.minutes && duration.minutes > 0) parts.push(`${duration.minutes}m`);
      
      if (parts.length === 0 && duration.seconds && duration.seconds >= 0) {
        parts.push(`${duration.seconds}s`);
      }
      
      const formatted = parts.length > 0 ? parts.join(' ') : 'Ahora';
      return { formatted, isUnder8Hours, duration };
  }

  // For longer durations, calculate total days first for simplicity and accuracy.
  const totalDays = differenceInDays(endDate, entryDate);
  const duration = intervalToDuration({ start: entryDate, end: endDate });

  const parts = [];
  if (totalDays > 0) parts.push(`${totalDays}d`);
  if (duration.hours && duration.hours > 0) parts.push(`${duration.hours}h`);
  if (duration.minutes && duration.minutes > 0) parts.push(`${duration.minutes}m`);

  const formatted = parts.length > 0 ? parts.join(' ') : 'Ahora';
  // Include totalDays in the returned duration object for custom formatting
  return { formatted, isUnder8Hours, duration: { ...duration, totalDays } };
}

export function calculateGarageRate(entryAt, exitAt, settings, vehicleType) {
  if (!settings) return 0;
  
  const entryDate = typeof entryAt === 'string' ? parseISO(entryAt) : entryAt;
  const exitDate = exitAt ? (typeof exitAt === 'string' ? parseISO(exitAt) : exitAt) : new Date();
  
  if (!entryDate) return 0;

  // Calculate duration in hours for the rate check
  const totalHours = differenceInHours(exitDate, entryDate);
  
  // Rate Under 8 Hours Logic
  if (totalHours < 8) {
      return settings.rate_under_8_hours_clp || 0;
  }

  // Standard Rate Logic (Day based + Grace Period)
  const graceHours = settings.grace_period_hours || 0;
  const diffMilliseconds = exitDate - entryDate;
  const diffTotalHours = diffMilliseconds / (1000 * 60 * 60);

  let calculatedDays;
  if (diffTotalHours <= 24) {
      calculatedDays = 1;
  } else {
      const fullDays = Math.floor(diffTotalHours / 24);
      const remainingHours = diffTotalHours % 24;
      if (remainingHours > graceHours) {
          calculatedDays = fullDays + 1;
      } else {
          calculatedDays = fullDays;
      }
  }

  let rate = 0;
  const type = vehicleType?.toLowerCase() || '';
  
  if (type.includes('trailer')) rate = settings.trailer_rate_clp;
  else if (type.includes('camión solo')) rate = settings.truck_rate_clp;
  else if (type.includes('camión acoplado')) rate = settings.articulated_truck_rate_clp;
  else if (type.includes('automóvil') || type.includes('automovil') || type.includes('auto')) rate = settings.car_rate_clp;
  else rate = settings.car_rate_clp; // Default

  return calculatedDays * rate;
}
