import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { User } from '../../App';
import DriverLayout from './DriverLayout';
import DriverHome from './DriverHome';
import VehicleManagement from './VehicleManagement';
import StationDetail from './StationDetail';
import BookingHistory from './BookingHistory';
import PaymentInvoices from './PaymentInvoices';
import SupportTickets from './SupportTickets';
import DriverProfile from './DriverProfile';

interface DriverDashboardProps {
  user: User;
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ user, onLogout }) => {
  return (
    <DriverLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/driver/vehicles" replace />} />
        <Route path="/vehicles" element={<VehicleManagement />} />
        <Route path="/stations" element={<DriverHome />} />
        <Route path="/station/:id" element={<StationDetail />} />
        <Route path="/bookings" element={<BookingHistory />} />
        <Route path="/payments" element={<PaymentInvoices />} />
        <Route path="/profile" element={<DriverProfile user={user} />} />
      </Routes>
    </DriverLayout>
  );
};

export default DriverDashboard;