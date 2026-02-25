
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useProfile } from '@/contexts/ProfileContext';
import { Menu } from 'lucide-react';
import { RestaurantProvider } from '@/contexts/RestaurantContext';

import GarageSummary from '@/components/garage/GarageSummary';
import ParkedVehicles from '@/components/garage/ParkedVehicles';
import GarageHistory from '@/components/garage/GarageHistory';
import RegisterEntry from '@/components/garage/RegisterEntry';
import RegisterExit from '@/components/garage/RegisterExit';
import ActiveVehicles from '@/components/garage/ActiveVehicles';
import GeneralSettings from '@/components/general/GeneralSettings';
import UserManagement from '@/components/general/UserManagement';

import RestaurantSummary from '@/components/restaurant/RestaurantSummary';
import MenuManagement from '@/components/restaurant/MenuManagement';
import OrderHistory from '@/components/restaurant/OrderHistory';
import TakeOrder from '@/components/restaurant/TakeOrder';
import ActiveOrders from '@/components/restaurant/ActiveOrders';


const moduleComponents = {
  'garage-summary': GarageSummary,
  'parked-vehicles': ParkedVehicles,
  'garage-history': GarageHistory,
  'register-entry': RegisterEntry,
  'register-exit': RegisterExit,
  'active-vehicles': ActiveVehicles,
  
  'restaurant-summary': RestaurantSummary,
  'menu-management': MenuManagement,
  'order-history': OrderHistory,
  'take-orders': TakeOrder,
  'active-orders': ActiveOrders,

  'general-settings': GeneralSettings,
  'users': UserManagement,
};

const Dashboard = ({ toggleTheme, currentTheme, initialModule }) => {
  const { profile } = useProfile();
  const [activeModule, setActiveModule] = useState('');
  const [activeModuleData, setActiveModuleData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      if (initialModule) {
        setActiveModule(initialModule);
      } else {
        const defaultModule = profile.role === 'administrador' ? 'garage-summary' : 'register-entry';
        setActiveModule(defaultModule);
      }
    }
  }, [profile, initialModule]);
  

  const handleSetActiveModule = (module, data = null) => {
    setActiveModule(module);
    setActiveModuleData(data);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }

  const ActiveModuleComponent = moduleComponents[activeModule] || (() => <div className="p-4">Cargando módulo...</div>);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Sistema Integrado San José</title>
        <meta name="description" content="Panel de control del sistema integrado de gestión de garaje y restaurante San José" />
      </Helmet>
      
      <RestaurantProvider>
        <div className="flex h-screen bg-background">
          <Sidebar 
            activeModule={activeModule} 
            setActiveModule={handleSetActiveModule}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              toggleTheme={toggleTheme} 
              currentTheme={currentTheme}
              userName={profile?.full_name || 'Usuario'}
              onMenuClick={() => setSidebarOpen(true)}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
              <ActiveModuleComponent setActiveModule={handleSetActiveModule} activeModuleData={activeModuleData} />
            </main>
          </div>
        </div>
      </RestaurantProvider>
    </>
  );
};

export default Dashboard;
