import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function LoginPage() {
  const [email, setEmail] = useState('Buildcat');
  const [password, setPassword] = useState('buildcat');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20, border: '1px solid #ddd', borderRadius: 6 }}>
      <h2>Kirjaudu</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={submit}>
        <div style={{ marginBottom: 8 }}>
          <label>Username/email<br />
            <input value={email} onChange={e => setEmail(e.target.value)} />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
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
