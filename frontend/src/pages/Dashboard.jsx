import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import VisitTable from '../components/VisitTable';
import { getUser, errMsg, filterVisits } from '../utils/helpers';

export default function Dashboard() {
  const role = getUser().role;
  const canEdit = ['admin', 'receptionist', 'security'].includes(role);
  const isEmployee = role === 'employee';
  const [stats, setStats] = useState({ onSite: 0, today: 0, total: 0 });
  const [visits, setVisits] = useState([]);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [s, t] = await Promise.all([api.get('/visits/stats'), api.get('/visits/today')]);
      setStats(s.data);
      setVisits(t.data.visits);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000); // pick up host responses automatically
    return () => clearInterval(timer);
  }, []);

  const checkOut = async (id) => {
    try {
      await api.patch(`/visits/${id}/check-out`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const checkIn = async (id) => {
    try {
      await api.patch(`/visits/${id}/check-in`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const rows = filterVisits(visits.filter((v) => tab === 'all' || v.status === tab), q);

  return (
    <>
      <div className="page-head">
        <h2>{isEmployee ? 'My visitors' : 'Dashboard'}</h2>
        {canEdit && <Link className="btn" to="/check-in">+ New check-in</Link>}
      </div>
      {error && <div className="error">{error}</div>}

      <div className="stats">
        <div className="card stat"><b>{stats.onSite}</b><span>On site now</span></div>
        <div className="card stat"><b>{stats.today}</b><span>Visitors today</span></div>
        <div className="card stat"><b>{stats.total}</b><span>Total visits</span></div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Today's visitors</h3>
        <div className="tabs">
          {['all', 'pre-registered', 'checked-in', 'checked-out', 'cancelled'].map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
          ))}
          <input style={{ maxWidth: 260, margin: '0 0 0 auto' }} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <VisitTable
          visits={rows}
          onCheckOut={canEdit ? checkOut : null}
          onCheckIn={canEdit ? checkIn : null}
        />
      </div>
    </>
  );
}