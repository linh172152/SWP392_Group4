import { logout, getStoredRole } from '../../services/authService'
import './UserDashboard.css'

export default function UserDashboard() {
  const role = getStoredRole()
  return (
    <div className="dash-page">
      <div className="dash-card">
        <h2>User Dashboard</h2>
        <p>Logged in as: {role}</p>
        <button onClick={() => { logout(); location.href = '/' }}>Logout</button>
      </div>
    </div>
  )
}


