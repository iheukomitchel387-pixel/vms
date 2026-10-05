import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../api/api';
import { errMsg } from '../utils/helpers';

const empty = { name: '', phone: '', email: '', company: '', idType: 'National ID', idNumber: '' };

export default function CheckIn() {
  const { state } = useLocation();
  const [form, setForm] = useState(empty);
  const [visitorId, setVisitorId] = useState(null);
  const [users, setUsers] = useState([]);
  const [hostId, setHostId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [walkIn, setWalkIn] = useState(true);
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pick = (v) => {
    setVisitorId(v._id);
    setForm({
      name: v.name || '', phone: v.phone || '', email: v.email || '',
      company: v.company || '', idType: v.idType || 'National ID', idNumber: v.idNumber || '',
    });
    setMatches([]);
  };

  const clear = () => { setVisitorId(null); setForm(empty); };

  useEffect(() => {
    api.get('/auth/users').then((r) => setUsers(r.data)).catch((e) => setError(errMsg(e)));
    if (state?.visitor) pick(state.visitor);
  }, []);

  const find = async () => {
    if (!search.trim()) return;
    setError('');
    try {
      const { data } = await api.get('/visitors', { params: { search } });
      setMatches(data.slice(0, 5));
      if (!data.length) setError('No visitor found. Fill in the form to register a new one.');
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!hostId) return setError('Please choose a host');
    setLoading(true);
    try {
      let vid = visitorId;
      if (!vid) {
        const { data } = await api.post('/visitors', form);
        vid = data._id;
      }
      const { data: visit } = await api.post('/visits', { visitor: vid, host: hostId, purpose, walkIn });
      setDone({ visit, host: users.find((u) => u._id === hostId) });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const v = done.visit;
    return (
      <div className="card badge-card">
        <h2>Request sent to host</h2>
        <h3>{form.name}</h3>
        <p>{form.company}</p>
        <p>Host: {done.host?.name}</p>
        <p>Purpose: {purpose}</p>
        <p style={{ color: v.hostEmailSent ? '#166534' : '#b91c1c' }}>
          {v.hostEmailSent
            ? `${done.host?.name} has been emailed to accept or decline.`
            : 'The host could not be emailed. Use "Check in anyway" on the dashboard if they approve in person.'}
        </p>
        <p>
          {walkIn
            ? 'Once the host accepts, the visitor is checked in and receives their QR pass by email.'
            : 'After the host accepts, check the visitor in from the dashboard when they arrive.'}
        </p>
        <div className="row no-print" style={{ justifyContent: 'center' }}>
          <Link className="btn" to="/dashboard">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head"><h2>Check in a visitor</h2></div>
      {error && <div className="error">{error}</div>}

      <form onSubmit={submit}>
        <div className="grid2">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Visitor details</h3>

            <label>Find returning visitor by name or phone</label>
            <div className="row">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), find())} />
              <button type="button" className="btn secondary" style={{ marginBottom: 12 }} onClick={find}>Find</button>
            </div>
            {matches.map((m) => (
              <div key={m._id} className="match" onClick={() => pick(m)}>
                {m.name} · {m.phone} {m.company && `· ${m.company}`}
              </div>
            ))}
            {visitorId && (
              <p style={{ fontSize: 13 }}>
                Returning visitor selected.{' '}
                <button type="button" className="btn secondary small" onClick={clear}>Clear</button>
              </p>
            )}

            <label>Full name *</label>
            <input required value={form.name} onChange={set('name')} disabled={!!visitorId} />
            <label>Phone *</label>
            <input required value={form.phone} onChange={set('phone')} disabled={!!visitorId} />
            <label>Email *</label>
            <input required type="email" value={form.email} onChange={set('email')} disabled={!!visitorId} />
            <label>Company</label>
            <input value={form.company} onChange={set('company')} disabled={!!visitorId} />
            <label>ID type</label>
            <select value={form.idType} onChange={set('idType')} disabled={!!visitorId}>
              <option>National ID</option>
              <option>Driver's License</option>
              <option>Passport</option>
              <option>Other</option>
            </select>
            <label>ID number</label>
            <input value={form.idNumber} onChange={set('idNumber')} disabled={!!visitorId} />
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Visit details</h3>
            <label>Host *</label>
            <select required value={hostId} onChange={(e) => setHostId(e.target.value)}>
              <option value="">Select staff member</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
            <label>Purpose of visit *</label>
            <input required value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" checked={walkIn} onChange={() => setWalkIn(!walkIn)} />
              Visitor is here now (check in when the host accepts)
            </label>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
          <Link className="btn secondary" to="/dashboard">Cancel</Link>
          <button className="btn" disabled={loading}>{loading ? 'Saving...' : 'Request host approval'}</button>
        </div>
      </form>
    </>
  );
}