import { logout, getStoredRole } from '../../services/authService'
import './StaffDashboard.css'

export default function StaffDashboard() {
  const role = getStoredRole()
  return (
    <div className="dash-page">
      <div className="dash-card">
        <h2>Staff Dashboard</h2>
        <p>Logged in as: {role}</p>
        <button onClick={() => { logout(); location.href = '/' }}>Logout</button>
      </div>
    </div>
  )
}
