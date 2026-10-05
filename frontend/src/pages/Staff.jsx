import { useEffect, useState } from 'react';
import api from '../api/api';
import { errMsg, getUser } from '../utils/helpers';

const blank = { name: '', email: '', password: '', role: 'receptionist' };
const HELP = {
  admin: 'Full access, including creating staff accounts and reports.',
  receptionist: 'Registers visitors and checks them in and out.',
  security: 'Same as receptionist: registers and checks visitors in and out.',
  manager: 'View only: dashboard, visitors and reports. Cannot check anyone in or out.',
  employee: 'Can be chosen as a host and receives visitor requests by email. If they log in, they only see their own visitors.',
};

export default function Staff() {
  const me = getUser();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const load = () => api.get('/auth/users').then((r) => setUsers(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', form);
      setOpen(false);
      setForm(blank);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This cannot be undone.`)) return;
    setError('');
    try {
      await api.delete(`/auth/users/${u._id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <div className="page-head">
        <h2>Staff</h2>
        <button className="btn" onClick={() => { setError(''); setOpen(true); }}>+ Add staff</button>
      </div>
      {!open && error && <div className="error">{error}</div>}

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="badge checked-out">{u.role}</span></td>
                <td>
                  {u._id !== me.id && (
                    <button className="btn secondary small" onClick={() => remove(u)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-bg">
          <form className="card modal" onSubmit={save}>
            <h3 style={{ marginTop: 0 }}>Add staff</h3>
            {error && <div className="error">{error}</div>}
            <label>Full name</label>
            <input required value={form.name} onChange={set('name')} />
            <label>Email</label>
            <input required type="email" value={form.email} onChange={set('email')} />
            <label>Password (min 6 characters)</label>
            <input required type="password" value={form.password} onChange={set('password')} />
            <label>Role</label>
            <select value={form.role} onChange={set('role')}>
              <option value="admin">Admin</option>
              <option value="receptionist">Receptionist</option>
              <option value="security">Security</option>
              <option value="manager">Manager</option>
              <option value="employee">Regular employee</option>
            </select>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>{HELP[form.role]}</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn">Create account</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}