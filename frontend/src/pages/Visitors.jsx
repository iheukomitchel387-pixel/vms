import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { getUser, errMsg } from '../utils/helpers';

export default function Visitors() {
  const canEdit = getUser().role !== 'manager';
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/visitors', { params: { search: q } })
        .then((r) => setList(r.data))
        .catch((e) => setError(errMsg(e)));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <div className="page-head">
        <h2>Visitors</h2>
        <input style={{ maxWidth: 280, margin: 0 }} placeholder="Search by name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error && <div className="error">{error}</div>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Email</th><th>Company</th><th>ID type</th><th>Registered</th>{canEdit && <th></th>}</tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v._id}>
                <td>{v.name}</td><td>{v.phone}</td><td>{v.email || '—'}</td>
                <td>{v.company || '—'}</td><td>{v.idType || '—'}</td>
                <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                {canEdit && (
                  <td>
                    <button className="btn small" onClick={() => navigate('/check-in', { state: { visitor: v } })}>
                      New visit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p style={{ color: '#6b7280' }}>No visitors found.</p>}
      </div>
    </>
  );
}