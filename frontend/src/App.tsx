import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { XCircle } from 'lucide-react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import GoogleCallback from './components/GoogleCallback';
import DriverDashboard from './components/driver/DriverDashboard';
import StaffDashboard from './components/staff/StaffDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import PaymentSuccess from './components/PaymentSuccess';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'driver' | 'staff' | 'admin';
  avatar?: string;
  department?: string;
  position?: string;
  stationId?: string; // For staff - which station they work at
  permissions?: string[]; // For future granular permissions
}

const PaymentErrorPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass-card border-0 shadow-xl max-w-md w-full">
        <CardContent className="p-8 text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Thanh toán thất bại</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Có lỗi xảy ra trong quá trình thanh toán
          </p>
          <Button onClick={() => navigate('/driver/wallet')} variant="outline">
            Quay lại ví
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('ev_swap_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ev_swap_user', JSON.stringify(userData));
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ev_swap_user');
  };

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20 transition-all duration-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Q0EzQUYiIGZpbGwtb3BhY2l0eT0iMC4wNyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40 dark:opacity-20"></div>
          <div className="relative z-10">
            <Routes>
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to={`/${user.role}`} replace />
              ) : (
                <LandingPage onAuth={openAuth} />
              )
            } 
          />
          <Route 
            path="/auth/callback" 
            element={<GoogleCallback onLogin={handleLogin} />} 
          />
          <Route 
            path="/auth/error" 
            element={<GoogleCallback onLogin={handleLogin} />} 
          />
          <Route 
            path="/payment/success" 
            element={<PaymentSuccess />} 
          />
          <Route 
            path="/payment/error" 
            element={<PaymentErrorPage />} 
          />
          <Route 
            path="/driver/*" 
            element={
              user?.role === 'driver' ? (
                <DriverDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/staff/*" 
            element={
              user?.role === 'staff' ? (
                <StaffDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              user?.role === 'admin' ? (
                <AdminDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          {/* Catch-all route for unmatched paths */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />}
          />
            </Routes>

            {showAuth && (
              <AuthModal
                mode={authMode}
                onClose={() => setShowAuth(false)}
                onLogin={handleLogin}
                onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              />
            )}
          </div>
        </div>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;