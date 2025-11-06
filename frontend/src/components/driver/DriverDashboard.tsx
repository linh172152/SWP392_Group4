import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { User } from '../../App';
import DriverLayout from './DriverLayout';
import DriverHome from './StationFinding';
import VehicleManagement from './VehicleManagement';
import StationDetail from './StationDetail';
import BookingHistory from './BookingHistory';
import BookingForm from './BookingForm';
import PaymentInvoices from './PaymentInvoices';
import ServicePackages from './ServicePackages';
import SupportTickets from './SupportTickets';
import DriverProfile from './DriverProfile';
import BookBatteryPage from './BookBatteryPage';
import Wallet from './Wallet';

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
        <Route path="/station/:id/book-battery" element={<BookBatteryPage />} />
        <Route path="/booking/:stationId" element={<BookingForm />} />
        <Route path="/bookings" element={<BookingHistory />} />
        <Route path="/payments" element={<PaymentInvoices />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/subscriptions" element={<ServicePackages />} />
        <Route path="/profile" element={<DriverProfile user={user} />} />
      </Routes>
    </DriverLayout>
  );
};

export default DriverDashboard;