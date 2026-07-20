import { useState } from 'react';
import * as api from '../api';

export default function PasscodeGate({ onLogin }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.login(passcode.trim());
      if (data?.token) onLogin(data.token);
      else setError('Wrong passcode.');
    } catch (e) {
      setError(e.message || 'Wrong passcode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gate">
      <div className="gate-box">
        <h1>Moving Sale Tracker</h1>
        <p>Enter the shared passcode to continue.</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label htmlFor="pc">Passcode</label>
            <input
              id="pc"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••"
              autoFocus
              autoComplete="current-password"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading || !passcode.trim()}>
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
