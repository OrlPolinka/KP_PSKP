import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Sidebar from './components/Layout/Sidebar';
import PrivateRoute from './components/common/PrivateRoute';
import RoleRoute from './components/common/RoleRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/Profile';
import Chat from './pages/Chat';

// Client Pages
import Schedule from './pages/client/Schedule';
import MyBookings from './pages/client/MyBookings';
import MyMemberships from './pages/client/MyMemberships';
import History from './pages/client/History';
import Trainers from './pages/client/Trainers';
import TrainerProfile from './pages/client/TrainerProfile';
import DanceStyles from './pages/client/DanceStyles';
import TrainingInfo from './pages/client/TrainingInfo';
import MyBookingsQR from './pages/client/MyBookingsQR';
import QRCodesPage from './pages/client/QRCodesPage';

// Trainer Pages
import TrainerSchedule from './pages/trainer/TrainerSchedule';
import ClassAttendance from './pages/trainer/ClassAttendance';
import TrainerProfileEdit from './pages/trainer/TrainerProfileEdit';
import QRScannerPage from './pages/trainer/QRScannerPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersList from './pages/admin/UsersList';
import TrainersList from './pages/admin/TrainersList';
import ScheduleManager from './pages/admin/ScheduleManager';
import MembershipTypesManager from './pages/admin/MembershipTypesManager';
import MembershipsManager from './pages/admin/MembershipsManager';
import Analytics from './pages/admin/Analytics';
import DanceStylesManager from './pages/admin/DanceStylesManager';
import TrainingInfoManager from './pages/admin/TrainingInfoManager';

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
      {user && <Sidebar />}
      <div className={`main-content ${user ? '' : 'no-sidebar'}`}>
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
          <Route path="/my-qr-codes" element={<RoleRoute allowedRoles={['client']}><MyBookingsQR /></RoleRoute>} />
          <Route path="/qr-codes" element={<RoleRoute allowedRoles={['client']}><QRCodesPage /></RoleRoute>} />
          <Route path="/my-memberships" element={<RoleRoute allowedRoles={['client']}><MyMemberships /></RoleRoute>} />
          <Route path="/history" element={<RoleRoute allowedRoles={['client']}><History /></RoleRoute>} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/trainers/:id" element={<TrainerProfile />} />
          <Route path="/dance-styles" element={<RoleRoute allowedRoles={['client']}><DanceStyles /></RoleRoute>} />
          <Route path="/training-info" element={<RoleRoute allowedRoles={['client']}><TrainingInfo /></RoleRoute>} />

          {/* Trainer Routes */}
          <Route path="/trainer/schedule" element={<RoleRoute allowedRoles={['trainer', 'admin']}><TrainerSchedule /></RoleRoute>} />
          <Route path="/trainer/classes" element={<RoleRoute allowedRoles={['trainer', 'admin']}><ClassAttendance /></RoleRoute>} />
          <Route path="/trainer/profile" element={<RoleRoute allowedRoles={['trainer']}><TrainerProfileEdit /></RoleRoute>} />
          <Route path="/trainer/qr-scanner" element={<RoleRoute allowedRoles={['trainer', 'admin']}><QRScannerPage /></RoleRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>} />
          <Route path="/admin/users" element={<RoleRoute allowedRoles={['admin']}><UsersList /></RoleRoute>} />
          <Route path="/admin/trainers" element={<RoleRoute allowedRoles={['admin']}><TrainersList /></RoleRoute>} />
          <Route path="/admin/schedule" element={<RoleRoute allowedRoles={['admin']}><ScheduleManager /></RoleRoute>} />
          <Route path="/admin/membership-types" element={<RoleRoute allowedRoles={['admin']}><MembershipTypesManager /></RoleRoute>} />
          <Route path="/admin/memberships" element={<RoleRoute allowedRoles={['admin']}><MembershipsManager /></RoleRoute>} />
          <Route path="/admin/analytics" element={<RoleRoute allowedRoles={['admin']}><Analytics /></RoleRoute>} />
          <Route path="/admin/dance-styles" element={<RoleRoute allowedRoles={['admin']}><DanceStylesManager /></RoleRoute>} />
          <Route path="/admin/training-info" element={<RoleRoute allowedRoles={['admin']}><TrainingInfoManager /></RoleRoute>} />

          {/* Chat */}
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/chat/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppRoutes />
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
