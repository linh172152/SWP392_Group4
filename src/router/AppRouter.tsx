import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPageLayout from '../pages/Login/LoginPageLayout'
import LoginPage from '../components/Login/LoginPage'
import UserDashboard from '../components/User/UserDashboard'
import StaffDashboard from '../components/Staff/StaffDashboard'
import AdminDashboard from '../components/Admin/AdminDashboard'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LoginPageLayout />}>
          <Route path="/" element={<LoginPage />} />
        </Route>
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}


