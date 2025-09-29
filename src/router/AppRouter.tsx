import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPageLayout from '../pages/Login/LoginPageLayout'
import LoginPage from '../pages/Login/LoginPage'
import UserDashboard from '../pages/User/UserDashboard'
import StaffDashboard from '../pages/Staff/StaffDashboard'
import AdminDashboard from '../pages/Admin/AdminDashboard'

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


