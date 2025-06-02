import useLocalStorage from '@/hooks/useLocalStorage';
import { useEffect, useCallback } from 'react';

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
};

const useOrderCounter = () => {
  const [dailyCounters, setDailyCounters] = useLocalStorage('restaurant_daily_order_counters', {});

  const resetDailyCounters = useCallback(() => {
    const todayString = getTodayDateString();
    const newCountersToday = {};
    Object.keys(categoryPrefixes).forEach(catKey => {
      newCountersToday[catKey] = 0;
    });
    newCountersToday['generic'] = 0;
    setDailyCounters({ [todayString]: newCountersToday });
  }, [setDailyCounters]);

  useEffect(() => {
    const todayString = getTodayDateString();
    if (!dailyCounters || !dailyCounters[todayString]) {
      resetDailyCounters();
    }
  }, [dailyCounters, resetDailyCounters]);

  const getNextOrderId = useCallback((categoryName) => {
    const todayString = getTodayDateString();
    let currentCountersToday = dailyCounters[todayString];

    if (!currentCountersToday) {
      resetDailyCounters();
      currentCountersToday = dailyCounters[todayString] || { generic: 0 }; 
      Object.keys(categoryPrefixes).forEach(catKey => {
        if(!currentCountersToday[catKey]) currentCountersToday[catKey] = 0;
      });
    }
    
    let counterCategoryKey = 'generic';
    if (categoryPrefixes[categoryName]) {
        counterCategoryKey = categoryName;
    }

    const nextCount = (currentCountersToday[counterCategoryKey] || 0) + 1;
    
    const updatedCountersForToday = {
      ...currentCountersToday,
      [counterCategoryKey]: nextCount,
    };

    setDailyCounters(prev => ({...prev, [todayString]: updatedCountersForToday }));

    const prefix = categoryPrefixes[categoryName] || 'ORD';
    return `${prefix}-${todayString.substring(2)}-${nextCount.toString().padStart(3, '0')}`;
  }, [dailyCounters, setDailyCounters, resetDailyCounters]);
  
  const getDisplayIdForOrder = useCallback((items) => {
    if (!items || items.length === 0) return getNextOrderId('generic');

    const mainMealPriority = ['Desayuno', 'Almuerzos', 'Cena', 'Especiales'];
    let primaryCategory = 'generic';

    for (const category of mainMealPriority) {
        if (items.some(item => item.category === category)) {
            primaryCategory = category;
            break;
        }
    }
    if (primaryCategory === 'generic' && items[0]?.category) {
       if (categoryPrefixes[items[0].category]) {
         primaryCategory = items[0].category;
       }
    }
    
    return getNextOrderId(primaryCategory);
  }, [getNextOrderId]);


  return { getNextOrderId, getDisplayIdForOrder, resetDailyCounters };
};

export default useOrderCounter;