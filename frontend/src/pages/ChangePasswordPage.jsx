import { useState } from 'react';
import api from '../api';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Täytä kaikki kentät');
      return;
    }

    if (newPassword.length < 8) {
      setError('Uuden salasanan tulee olla vähintään 8 merkkiä');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Uusi salasana ja vahvistus eivät täsmää');
      return;
    }

    try {
      setSaving(true);
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Salasana vaihdettu onnistuneesti');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Salasanan vaihto epäonnistui');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="change-password-page-card">
      <h2>Vaihda salasana</h2>
      {error && <div className="change-password-page-error">{error}</div>}
      {success && <div className="change-password-page-success">{success}</div>}

      <form onSubmit={submit}>
        <div className="change-password-page-field">
          <label>Nykyinen salasana<br />
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        </div>

        <div className="change-password-page-field">
          <label>Uusi salasana<br />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        </div>

        <div className="change-password-page-field">
          <label>Vahvista uusi salasana<br />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        </div>

        <div>
          <button type="submit" disabled={saving}>
            {saving ? 'Tallennetaan...' : 'Vaihda salasana'}
          </button>
        </div>
      </form>
    </div>
  );
}
