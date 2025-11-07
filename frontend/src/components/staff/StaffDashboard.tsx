import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { User } from '../../App';
import StaffLayout from './StaffLayout';
import StaffHome from './StaffHome';
import BatteryInventory from './BatteryInventory';
import SwapTransactions from './SwapTransactions';
import PersonalProfile from './PersonalProfile';

interface StaffDashboardProps {
  user: User;
  onLogout: () => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onLogout }) => {
  return (
    <StaffLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/staff/home" replace />} />
        <Route path="/home" element={<StaffHome />} />
        <Route path="/inventory" element={<BatteryInventory />} />
        <Route path="/transactions" element={<SwapTransactions />} />
        <Route path="/profile" element={<PersonalProfile />} />
      </Routes>
    </StaffLayout>
  );
};

export default StaffDashboard;