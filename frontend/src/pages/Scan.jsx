import { useEffect, useRef, useState } from 'react';
import api from '../api/api';
import StatusBadge from '../components/StatusBadge';
import { errMsg, fmt } from '../utils/helpers';

export default function Scan() {
  const [code, setCode] = useState('');
  const [visit, setVisit] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const input = useRef();

  useEffect(() => { input.current?.focus(); }, [visit]);

  const verify = async (e) => {
    e.preventDefault();
    setError(''); setMsg(''); setVisit(null);
    try {
      const { data } = await api.post('/visits/scan', { code });
      setVisit(data);
    } catch (err) {
      setError(errMsg(err));
    }
    setCode('');
  };

  const checkOut = async () => {
    try {
      const { data } = await api.patch(`/visits/${visit._id}/check-out`);
      setVisit({ ...visit, status: data.status, checkOutTime: data.checkOutTime });
      setMsg('Visitor checked out');
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <div className="page-head"><h2>Scan visitor QR code</h2></div>
      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={verify}>
          <label>Scan the QR code, or paste its text, then press Enter</label>
          <input ref={input} value={code} onChange={(e) => setCode(e.target.value)} />
        </form>
        {error && <div className="error">{error}</div>}
        {msg && <p style={{ color: '#166534' }}>{msg}</p>}

        {visit && (
          <div>
            <h3 style={{ marginBottom: 4 }}>{visit.visitor?.name}</h3>
            <p style={{ margin: '4px 0' }}>{visit.visitor?.company}</p>
            <p style={{ margin: '4px 0' }}>Badge: <b>{visit.badgeNumber}</b></p>
            <p style={{ margin: '4px 0' }}>Host: {visit.host?.name}</p>
            <p style={{ margin: '4px 0' }}>Purpose: {visit.purpose}</p>
            <p style={{ margin: '4px 0' }}>In: {fmt(visit.checkInTime)} · Out: {fmt(visit.checkOutTime)}</p>
            <p><StatusBadge status={visit.status} /></p>
            {visit.status === 'checked-in' && (
              <button className="btn" onClick={checkOut}>Check out</button>
            )}
          </div>
        )}
      </div>
    </>
  );
}