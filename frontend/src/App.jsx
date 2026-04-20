import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import PrivateRoute from './components/common/PrivateRoute';
import RoleRoute from './components/common/RoleRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/Profile';

// Client Pages
import Schedule from './pages/client/Schedule';
import MyBookings from './pages/client/MyBookings';
import MyMemberships from './pages/client/MyMemberships';
import History from './pages/client/History';

// Trainer Pages
import TrainerSchedule from './pages/trainer/TrainerSchedule';
import ClassAttendance from './pages/trainer/ClassAttendance';
import MyClasses from './pages/trainer/MyClasses';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersList from './pages/admin/UsersList';
import TrainersList from './pages/admin/TrainersList';
import ScheduleManager from './pages/admin/ScheduleManager';
import MembershipTypesManager from './pages/admin/MembershipTypesManager';
import MembershipsManager from './pages/admin/MembershipsManager';
import Analytics from './pages/admin/Analytics';

const AppRoutes = () => {
  const { user } = useAuth();

  const getDefaultRoute = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'trainer': return '/trainer/schedule';
      case 'client': return '/schedule';
      default: return '/';
    }
  };

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to={getDefaultRoute()} /> : <Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={getDefaultRoute()} /> : <Register />} />

        {/* Protected Routes */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

        {/* Client Routes */}
        <Route path="/schedule" element={<RoleRoute allowedRoles={['client', 'admin', 'trainer']}><Schedule /></RoleRoute>} />
        <Route path="/my-bookings" element={<RoleRoute allowedRoles={['client']}><MyBookings /></RoleRoute>} />
        <Route path="/my-memberships" element={<RoleRoute allowedRoles={['client']}><MyMemberships /></RoleRoute>} />
        <Route path="/history" element={<RoleRoute allowedRoles={['client']}><History /></RoleRoute>} />

        {/* Trainer Routes */}
        <Route path="/trainer/schedule" element={<RoleRoute allowedRoles={['trainer', 'admin']}><TrainerSchedule /></RoleRoute>} />
        <Route path="/trainer/classes" element={<RoleRoute allowedRoles={['trainer', 'admin']}><ClassAttendance /></RoleRoute>} />
        <Route path="/trainer/my-classes" element={<RoleRoute allowedRoles={['trainer', 'admin']}><MyClasses /></RoleRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/users" element={<RoleRoute allowedRoles={['admin']}><UsersList /></RoleRoute>} />
        <Route path="/admin/trainers" element={<RoleRoute allowedRoles={['admin']}><TrainersList /></RoleRoute>} />
        <Route path="/admin/schedule" element={<RoleRoute allowedRoles={['admin']}><ScheduleManager /></RoleRoute>} />
        <Route path="/admin/membership-types" element={<RoleRoute allowedRoles={['admin']}><MembershipTypesManager /></RoleRoute>} />
        <Route path="/admin/memberships" element={<RoleRoute allowedRoles={['admin']}><MembershipsManager /></RoleRoute>} />
        <Route path="/admin/analytics" element={<RoleRoute allowedRoles={['admin']}><Analytics /></RoleRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
