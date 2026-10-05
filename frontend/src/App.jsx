import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import Scan from './pages/Scan';
import OnSite from './pages/OnSite';
import Visitors from './pages/Visitors';
import History from './pages/History';
import Reports from './pages/Reports';
import Staff from './pages/Staff';
import { getUser } from './utils/helpers';

const OFFICE = ['admin', 'receptionist', 'security', 'manager'];
const FRONT_DESK = ['admin', 'receptionist', 'security'];

function Protected() {
  return localStorage.getItem('token') && getUser() ? <Layout /> : <Navigate to="/" replace />;
}

function Guard({ roles, children }) {
  return roles.includes(getUser()?.role) ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Protected />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/check-in" element={<Guard roles={FRONT_DESK}><CheckIn /></Guard>} />
          <Route path="/scan" element={<Guard roles={FRONT_DESK}><Scan /></Guard>} />
          <Route path="/on-site" element={<Guard roles={OFFICE}><OnSite /></Guard>} />
          <Route path="/visitors" element={<Guard roles={OFFICE}><Visitors /></Guard>} />
          <Route path="/history" element={<Guard roles={OFFICE}><History /></Guard>} />
          <Route path="/reports" element={<Guard roles={['admin', 'manager']}><Reports /></Guard>} />
          <Route path="/staff" element={<Guard roles={['admin']}><Staff /></Guard>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}