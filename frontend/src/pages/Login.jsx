import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { errMsg } from '../utils/helpers';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>Visitor Management System</h2>
        {error && <div className="error">{error}</div>}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <input type="checkbox" checked={show} onChange={() => setShow(!show)} /> Show password
        </label>
        <button className="btn" style={{ width: '100%' }} type="submit">Log in</button>
      </form>
    </div>
  );
}