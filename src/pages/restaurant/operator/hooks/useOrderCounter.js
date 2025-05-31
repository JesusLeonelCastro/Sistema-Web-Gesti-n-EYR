import useLocalStorage from '@/hooks/useLocalStorage';
import { useEffect } from 'react';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
};

const categoryPrefixes = {
  'Desayuno': 'DES',
  'Almuerzos': 'ALM',
  'Cena': 'CEN',
  'Especiales': 'ESP',
  // Other categories will use a generic prefix or none
};

const useOrderCounter = () => {
  const [dailyCounters, setDailyCounters] = useLocalStorage('restaurant_daily_order_counters', {});

  useEffect(() => {
    const todayString = getTodayDateString();
    if (!dailyCounters[todayString]) {
      const newCountersToday = {};
      Object.keys(categoryPrefixes).forEach(catKey => {
        newCountersToday[catKey] = 0;
      });
      newCountersToday['generic'] = 0; // For items not in main meal categories
      setDailyCounters(prev => ({ ...prev, [todayString]: newCountersToday }));
    }
  }, [dailyCounters, setDailyCounters]);

  const getNextOrderId = (categoryName) => {
    const todayString = getTodayDateString();
    let currentCountersToday = dailyCounters[todayString];

    if (!currentCountersToday) {
      currentCountersToday = {};
      Object.keys(categoryPrefixes).forEach(catKey => {
        currentCountersToday[catKey] = 0;
      });
      currentCountersToday['generic'] = 0;
    }
    
    let counterCategory = 'generic';
    if (categoryPrefixes[categoryName]) {
        counterCategory = categoryName;
    }

    const nextCount = (currentCountersToday[counterCategory] || 0) + 1;
    currentCountersToday[counterCategory] = nextCount;
    setDailyCounters(prev => ({...prev, [todayString]: currentCountersToday }));

    const prefix = categoryPrefixes[categoryName] || 'ORD';
    return `${prefix}-${todayString.substring(2)}-${nextCount.toString().padStart(3, '0')}`;
  };
  
  const getDisplayIdForOrder = (items) => {
    if (!items || items.length === 0) return getNextOrderId('generic');

    // Prioritize main meal categories for the display ID
    const mainMealPriority = ['Desayuno', 'Almuerzos', 'Cena', 'Especiales'];
    let primaryCategory = 'generic';

    for (const category of mainMealPriority) {
        if (items.some(item => item.category === category)) {
            primaryCategory = category;
            break;
        }
    }
    // If no main meal category found, use the category of the first item or generic
    if (primaryCategory === 'generic' && items[0]?.category) {
       if (categoryPrefixes[items[0].category]) {
         primaryCategory = items[0].category;
       }
    }
    
    return getNextOrderId(primaryCategory);
  };


  return { getDisplayIdForOrder };
};

export default useOrderCounter;