import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import type { User } from '../../App';
import AdminLayout from './AdminLayout';
import AdminHome from './AdminHome';
import StationManagement from './StationManagement';
import BatteryCoordination from './BatteryCoordination';
import UserManagement from './UserManagement';
import StaffManagement from './StaffManagement';
import ReportsAnalytics from './ReportsAnalytics';
import AISuggestions from './AISuggestions';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/home" replace />} />
        <Route path="/home" element={<AdminHome />} />
        <Route path="/stations" element={<StationManagement />} />
        <Route path="/coordination" element={<BatteryCoordination />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/employees" element={<StaffManagement />} />
        <Route path="/reports" element={<ReportsAnalytics />} />
        <Route path="/ai-suggestions" element={<AISuggestions />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;