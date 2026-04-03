import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-page-card">
      <h2>Kirjaudu</h2>
      {error && <div className="login-page-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="login-page-field">
          <label>Username/email<br />
            <input value={email} onChange={e => setEmail(e.target.value)} />
          </label>
        </div>

        <div className="login-page-field">
          <label>Salasana<br />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </label>
        </div>

        <div>
          <button type="submit">Kirjaudu</button>
        </div>
      </form>
    </div>
  );
}
