import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sun, Moon, UserCircle, Clock, Menu } from 'lucide-react';

const Header = ({ toggleTheme, currentTheme, userName, onMenuClick }) => {
  const [chileanTime, setChileanTime] = useState('');

  useEffect(() => {
    const updateChileanTime = () => {
      const options = {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const timeString = new Intl.DateTimeFormat('es-CL', options).format(new Date());
      setChileanTime(timeString);
    };

    updateChileanTime();
    const timerId = setInterval(updateChileanTime, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <motion.header 
      className="bg-card border-b border-border p-4 flex justify-between items-center sticky top-0 z-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick}
          className="lg:hidden text-muted-foreground"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
         <div className="hidden sm:flex items-center gap-2 font-mono text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{chileanTime}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Sun className={`h-5 w-5 transition-colors ${currentTheme === 'light' ? 'text-amber-500' : 'text-muted-foreground'}`} />
          <Switch
            id="theme-mode"
            checked={currentTheme === 'dark'}
            onCheckedChange={toggleTheme}
            aria-label="Toggle theme"
          />
          <Moon className={`h-5 w-5 transition-colors ${currentTheme === 'dark' ? 'text-cyan-400' : 'text-muted-foreground'}`} />
        </div>

        <div className="flex items-center gap-3">
           <UserCircle className="h-7 w-7 text-muted-foreground" />
           <div className="text-sm hidden md:block">
             <p className="font-semibold text-foreground">{userName}</p>
             <p className="text-xs text-muted-foreground">En línea</p>
           </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;