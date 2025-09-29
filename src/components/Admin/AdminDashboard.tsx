import { logout, getStoredRole } from '../../services/authService'
import '../User/UserDashboard.css'

export default function AdminDashboard() {
  const role = getStoredRole()
  return (
    <div className="dash-page">
      <div className="dash-card">
        <h2>Admin Dashboard</h2>
        <p>Logged in as: {role}</p>
        <button onClick={() => { logout(); location.href = '/' }}>Logout</button>
      </div>
    </div>
  )
}


