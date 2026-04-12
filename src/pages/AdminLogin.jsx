import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Design Tokens ───────────────────────────────────────── */
const T = {
  bg:        '#050505',
  green:     '#00ff00',
  greenDim:  '#00cc00',
  red:       '#ff0000',
  redDim:    '#cc0000',
  redGlow:   'rgba(255,0,0,0.35)',
  gray:      '#333',
  grayLight: '#888',
};

const API = import.meta.env.VITE_API_URL;

/* ── Styles ──────────────────────────────────────────────── */
const S = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: T.bg,
    fontFamily: '"Fira Code", monospace',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    border: `1px solid ${T.red}55`,
    background: 'rgba(255,0,0,0.03)',
    padding: '40px 36px',
    boxShadow: `0 0 24px ${T.redGlow}, inset 0 0 24px rgba(255,0,0,0.04)`,
  },
  badge: {
    display: 'inline-block',
    background: T.red,
    color: '#000',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    padding: '2px 8px',
    marginBottom: '16px',
  },
  title: {
    color: T.red,
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    margin: '0 0 4px',
    textShadow: `0 0 14px ${T.red}`,
  },
  subtitle: {
    color: T.grayLight,
    fontSize: '12px',
    letterSpacing: '0.12em',
    margin: '0 0 32px',
  },
  label: {
    display: 'block',
    color: T.red,
    fontSize: '11px',
    letterSpacing: '0.15em',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    background: 'rgba(255,0,0,0.04)',
    border: `1px solid ${T.red}44`,
    color: T.green,
    fontFamily: '"Fira Code", monospace',
    fontSize: '14px',
    padding: '10px 14px',
    outline: 'none',
    marginBottom: '20px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  inputFocus: {
    borderColor: T.red,
    boxShadow: `0 0 10px ${T.redGlow}`,
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    border: `1px solid ${T.red}`,
    color: T.red,
    fontFamily: '"Fira Code", monospace',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    cursor: 'pointer',
    transition: 'background 0.2s, box-shadow 0.2s, color 0.2s',
    textTransform: 'uppercase',
  },
  btnHover: {
    background: T.red,
    color: '#000',
    boxShadow: `0 0 18px ${T.redGlow}`,
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    color: T.red,
    fontSize: '12px',
    letterSpacing: '0.08em',
    marginTop: '16px',
    padding: '10px 14px',
    border: `1px solid ${T.red}44`,
    background: 'rgba(255,0,0,0.06)',
  },
  divider: {
    borderTop: `1px solid ${T.red}22`,
    margin: '28px 0 20px',
  },
  footer: {
    color: T.grayLight,
    fontSize: '11px',
    letterSpacing: '0.1em',
    textAlign: 'center',
  },
};

/* ── Component ───────────────────────────────────────────── */
export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [btnHover, setBtnHover] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [dots, setDots] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (localStorage.getItem('vanish_admin_token')) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  // Animated dots for loading
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(id);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
        setLoading(false);
        return;
      }

      localStorage.setItem('vanish_admin_token', data.token);
      navigate('/admin/dashboard');
    } catch {
      setError('NETWORK ERROR — Could not reach the server.');
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    ...S.input,
    ...(focusField === field ? S.inputFocus : {}),
  });

  return (
    <div style={S.wrapper}>
      <div style={S.card}>
        {/* Badge */}
        <span style={S.badge}>⚠ RESTRICTED ACCESS</span>

        {/* Title */}
        <h1 style={S.title}>ADMIN TERMINAL</h1>
        <p style={S.subtitle}>// VANISH-E SYSTEM CONTROL — AUTHORISED PERSONNEL ONLY</p>

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off">
          <label htmlFor="admin-username" style={S.label}>IDENTIFIER</label>
          <input
            id="admin-username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onFocus={() => setFocusField('user')}
            onBlur={() => setFocusField(null)}
            style={inputStyle('user')}
            placeholder="admin"
            spellCheck={false}
            autoComplete="off"
            disabled={loading}
            required
          />

          <label htmlFor="admin-password" style={S.label}>PASSPHRASE</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={() => setFocusField('pass')}
            onBlur={() => setFocusField(null)}
            style={inputStyle('pass')}
            placeholder="••••••••••••"
            autoComplete="current-password"
            disabled={loading}
            required
          />

          <button
            id="admin-login-btn"
            type="submit"
            disabled={loading}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              ...S.btn,
              ...(btnHover && !loading ? S.btnHover : {}),
              ...(loading ? S.btnDisabled : {}),
            }}
          >
            {loading ? `AUTHENTICATING${dots}` : '⟶  AUTHENTICATE'}
          </button>
        </form>

        {/* Error output */}
        {error && (
          <div id="admin-error-msg" style={S.error}>
            <span style={{ color: T.red }}>ERR &gt;</span> {error}
          </div>
        )}

        <div style={S.divider} />
        <p style={S.footer}>
          VANISH-E v1.0 &nbsp;|&nbsp; ADMIN MODULE &nbsp;|&nbsp; SESSION ENCRYPTED
        </p>
      </div>
    </div>
  );
}
