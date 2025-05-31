import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';

// Parking System Pages
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage';
import AdminParkedTrailersPage from '@/pages/admin/AdminParkedTrailersPage';
import AdminHistoryPage from '@/pages/admin/AdminHistoryPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';

import OperatorEntryLogPage from '@/pages/operator/OperatorEntryLogPage';
import OperatorExitLogPage from '@/pages/operator/OperatorExitLogPage';
import OperatorActiveTrailersPage from '@/pages/operator/OperatorActiveTrailersPage';

// Restaurant System Pages
import RestaurantDashboardPage from '@/pages/restaurant/RestaurantDashboardPage';
import RestaurantAdminOverviewPage from '@/pages/restaurant/admin/RestaurantAdminOverviewPage';
import RestaurantMenuManagementPage from '@/pages/restaurant/admin/RestaurantMenuManagementPage';
import RestaurantAdminOrdersPage from '@/pages/restaurant/admin/RestaurantAdminOrdersPage';
import RestaurantAdminSettingsPage from '@/pages/restaurant/admin/RestaurantAdminSettingsPage';

import RestaurantOrderTakingPage from '@/pages/restaurant/operator/RestaurantOrderTakingPage';
import RestaurantActiveOrdersPage from '@/pages/restaurant/operator/RestaurantActiveOrdersPage';

import NotFoundPage from '@/pages/NotFoundPage';
import { Toaster } from '@/components/ui/toaster';


const AppRoutes = () => {
  const { user, activeSystem } = useAuth();

  const getDefaultRedirectPath = () => {
    if (!user) return "/login";
    
    if (activeSystem === 'parking') {
      if (user.role === 'administrator') return "/admin/overview";
      if (user.role === 'operator') return "/operator/entry-log";
      return "/dashboard";
    } else if (activeSystem === 'restaurant') {
      if (user.role === 'administrator') return "/restaurant/admin/overview";
      if (user.role === 'operator') return "/restaurant/operator/orders";
      return "/restaurant/dashboard";
    }
    return "/dashboard"; // Fallback
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Navigate to={getDefaultRedirectPath()} replace />
            </ProtectedRoute>
          } 
        />
        
        {/* Parking Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Restaurant Dashboard */}
         <Route 
          path="/restaurant/dashboard" 
          element={
            <ProtectedRoute>
              <RestaurantDashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Admin Parking Routes */}
        <Route path="/admin/overview" element={<ProtectedRoute allowedRoles={['administrator']}><AdminOverviewPage /></ProtectedRoute>} />
        <Route path="/admin/parked-trailers" element={<ProtectedRoute allowedRoles={['administrator']}><AdminParkedTrailersPage /></ProtectedRoute>} />
        <Route path="/admin/history" element={<ProtectedRoute allowedRoles={['administrator']}><AdminHistoryPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['administrator']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['administrator']}><AdminReportsPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['administrator']}><AdminSettingsPage /></ProtectedRoute>} />

        {/* Operator Parking Routes */}
        <Route path="/operator/entry-log" element={<ProtectedRoute allowedRoles={['operator', 'administrator']}><OperatorEntryLogPage /></ProtectedRoute>} />
        <Route path="/operator/exit-log" element={<ProtectedRoute allowedRoles={['operator', 'administrator']}><OperatorExitLogPage /></ProtectedRoute>} />
        <Route path="/operator/active-trailers" element={<ProtectedRoute allowedRoles={['operator', 'administrator']}><OperatorActiveTrailersPage /></ProtectedRoute>} />
        
        {/* Admin Restaurant Routes */}
        <Route path="/restaurant/admin/overview" element={<ProtectedRoute allowedRoles={['administrator']}><RestaurantAdminOverviewPage /></ProtectedRoute>} />
        <Route path="/restaurant/admin/menu" element={<ProtectedRoute allowedRoles={['administrator']}><RestaurantMenuManagementPage /></ProtectedRoute>} />
        <Route path="/restaurant/admin/orders" element={<ProtectedRoute allowedRoles={['administrator']}><RestaurantAdminOrdersPage /></ProtectedRoute>} />
        <Route path="/restaurant/admin/settings" element={<ProtectedRoute allowedRoles={['administrator']}><RestaurantAdminSettingsPage /></ProtectedRoute>} />


        {/* Operator Restaurant Routes */}
        <Route path="/restaurant/operator/orders" element={<ProtectedRoute allowedRoles={['operator', 'administrator']}><RestaurantOrderTakingPage /></ProtectedRoute>} />
        <Route path="/restaurant/operator/active-orders" element={<ProtectedRoute allowedRoles={['operator', 'administrator']}><RestaurantActiveOrdersPage /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
          <AppRoutes />
          <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;