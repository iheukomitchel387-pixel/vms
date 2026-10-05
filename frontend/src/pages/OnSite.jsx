import { useEffect, useState } from 'react';
import api from '../api/api';
import VisitTable from '../components/VisitTable';
import { getUser, errMsg, filterVisits } from '../utils/helpers';

export default function OnSite() {
  const canEdit = getUser().role !== 'manager';
  const [visits, setVisits] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [, tick] = useState(0);

  const load = () =>
    api.get('/visits?status=checked-in').then((r) => setVisits(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
    const t = setInterval(() => tick((n) => n + 1), 60000); // refresh durations every minute
    return () => clearInterval(t);
  }, []);

  const checkOut = async (id) => {
    try {
      await api.patch(`/visits/${id}/check-out`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <div className="page-head">
        <h2>On site now: {visits.length}</h2>
        <input style={{ maxWidth: 260, margin: 0 }} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error && <div className="error">{error}</div>}
      <div className="card">
        <VisitTable visits={filterVisits(visits, q)} onCheckOut={canEdit ? checkOut : null} showDuration />
      </div>
    </>
  );
}