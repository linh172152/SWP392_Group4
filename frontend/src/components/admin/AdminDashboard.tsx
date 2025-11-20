import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import type { User } from '../../App';
import AdminLayout from './AdminLayout';
import StationManagement from './StationManagement';
import BatteryPricingManagement from './BatteryPricingManagement';
import AdminServicePackageManagement from './AdminServicePackageManagement';
import TopUpPackageManagement from './TopUpPackageManagement';
import UserManagement from './UserManagement';
import StaffManagement from './StaffManagement';
import ReportsAnalytics from './ReportsAnalytics';
import AdminSupportManagement from './AdminSupportManagement';
import AdminStaffScheduleManagement from './AdminStaffScheduleManagement';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/reports" replace />} />
        <Route path="/reports" element={<ReportsAnalytics />} />
        <Route path="/stations" element={<StationManagement />} />
        <Route path="/battery-pricing" element={<BatteryPricingManagement />} />
        <Route path="/service-packages" element={<AdminServicePackageManagement />} />
        <Route path="/topup-packages" element={<TopUpPackageManagement />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/employees" element={<StaffManagement />} />
        <Route path="/schedules" element={<AdminStaffScheduleManagement />} />
        <Route path="/support" element={<AdminSupportManagement />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;