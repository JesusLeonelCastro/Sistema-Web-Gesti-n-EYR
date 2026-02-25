import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { user, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Profile not found or error fetching profile, logging out:', error.message);
          setProfile(null);
          await logout();
        } else {
          setProfile(data);
        }
      } catch (e) {
        console.error('Unexpected error fetching profile, logging out:', e);
        setProfile(null);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, logout]);

  const value = useMemo(() => ({
    profile,
    loading: authLoading || loading,
  }), [profile, authLoading, loading]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};