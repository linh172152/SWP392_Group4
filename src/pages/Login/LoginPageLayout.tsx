import { Outlet } from 'react-router-dom'
import './LoginPageLayout.css'

export default function LoginPageLayout() {
  return (
    <div className="auth-wrapper">
      <Outlet />
    </div>
  )
}


