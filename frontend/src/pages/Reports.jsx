import { useEffect, useState } from 'react';
import api from '../api/api';
import VisitTable from '../components/VisitTable';
import { errMsg, fmt } from '../utils/helpers';

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };

export default function Reports() {
  const [from, setFrom] = useState(iso(new Date()));
  const [to, setTo] = useState(iso(new Date()));
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');

  const generate = async (f = from, t = to) => {
    setError('');
    try {
      const { data } = await api.get('/visits/report', { params: { from: f, to: t } });
      setVisits(data.visits);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  useEffect(() => { generate(); }, []);

  const chip = (n) => {
    const f = daysAgo(n), t = iso(new Date());
    setFrom(f); setTo(t); generate(f, t);
  };

  const perDay = visits.reduce((acc, v) => {
    const d = new Date(v.createdAt).toLocaleDateString();
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const max = Math.max(1, ...Object.values(perDay));

  const exportCsv = () => {
    const head = ['Visitor', 'Company', 'Host', 'Purpose', 'Check-in', 'Check-out', 'Status'];
    const lines = visits.map((v) =>
      [v.visitor?.name, v.visitor?.company, v.host?.name, v.purpose, fmt(v.checkInTime), fmt(v.checkOutTime), v.status]
        .map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `visits-${from}-to-${to}.csv`;
    a.click();
  };

  return (
    <>
      <div className="page-head"><h2>Reports</h2></div>
      {error && <div className="error">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label>To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <button className="btn" style={{ marginBottom: 12 }} onClick={() => generate()}>Generate report</button>
          <button className="btn secondary" style={{ marginBottom: 12 }} onClick={() => chip(0)}>Today</button>
          <button className="btn secondary" style={{ marginBottom: 12 }} onClick={() => chip(7)}>Last 7 days</button>
          <button className="btn secondary" style={{ marginBottom: 12 }} onClick={() => chip(30)}>Last 30 days</button>
        </div>
      </div>

      <div className="grid2" style={{ marginBottom: 20 }}>
        <div className="card stat"><b>{visits.length}</b><span>Total visits in range</span></div>
        <div className="card">
          <strong>Visits per day</strong>
          {Object.entries(perDay).map(([d, n]) => (
            <div className="bar" key={d}>
              <span style={{ width: 90 }}>{d}</span>
              <i style={{ width: `${(n / max) * 200}px` }} /> {n}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="page-head">
          <h3 style={{ margin: 0 }}>Visits</h3>
          <button className="btn secondary small" onClick={exportCsv} disabled={!visits.length}>Export CSV</button>
        </div>
        <VisitTable visits={visits} />
      </div>
    </>
  );
}