import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getUser, logout } from '../utils/helpers';

const OFFICE = ['admin', 'receptionist', 'security', 'manager'];
const ALL = [...OFFICE, 'employee'];
const NAV = [
  { to: '/dashboard', label: 'Dashboard', roles: ALL },
  { to: '/check-in', label: 'Check In', roles: ['admin', 'receptionist', 'security'] },
  { to: '/scan', label: 'Scan Badge', roles: ['admin', 'receptionist', 'security'] },
  { to: '/on-site', label: 'On Site', roles: OFFICE },
  { to: '/visitors', label: 'Visitors', roles: OFFICE },
  { to: '/history', label: 'Visit History', roles: OFFICE },
  { to: '/reports', label: 'Reports', roles: ['admin', 'manager'] },
  { to: '/staff', label: 'Staff', roles: ['admin'] },
];

export default function Layout() {
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>VMS</h1>
        {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
          <NavLink key={n.to} to={n.to}>{n.label}</NavLink>
        ))}
      </aside>
      <div className="main">
        <div className="topbar">
          <span>
            {user.name} · {user.role}
            {['manager', 'employee'].includes(user.role) && ' (view only)'}
          </span>
          <button className="btn secondary small" onClick={handleLogout}>Log out</button>
        </div>
        <div className="content"><Outlet /></div>
      </div>
    </div>
  );
}