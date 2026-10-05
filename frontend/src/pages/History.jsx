import { useEffect, useState } from 'react';
import api from '../api/api';
import VisitTable from '../components/VisitTable';
import { errMsg, filterVisits } from '../utils/helpers';

export default function History() {
  const [visits, setVisits] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/visits', { params: status ? { status } : {} })
      .then((r) => setVisits(r.data))
      .catch((e) => setError(errMsg(e)));
  }, [status]);

  return (
    <>
      <div className="page-head"><h2>Visit history</h2></div>
      {error && <div className="error">{error}</div>}
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <select style={{ maxWidth: 200, margin: 0 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pre-registered">Pre-registered</option>
            <option value="checked-in">Checked in</option>
            <option value="checked-out">Checked out</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input style={{ maxWidth: 260, margin: 0 }} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <VisitTable visits={filterVisits(visits, q)} />
      </div>
    </>
  );
}