import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Design Tokens ───────────────────────────────────────── */
const T = {
  bg:        '#050505',
  green:     '#00ff00',
  greenDim:  '#00cc00',
  red:       '#ff0000',
  redDim:    '#cc0000',
  redGlow:   'rgba(255,0,0,0.35)',
  greenGlow: 'rgba(0,255,0,0.35)',
  gray:      '#333',
  grayLight: '#888',
};

const API = import.meta.env.VITE_API_URL;

/* ── Styles ──────────────────────────────────────────────── */
const S = {
  wrapper: {
    minHeight: '100vh',
    background: T.bg,
    fontFamily: '"Fira Code", monospace',
    color: T.green,
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 28px',
    borderBottom: `1px solid ${T.red}44`,
    background: 'rgba(255,0,0,0.03)',
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  badge: {
    background: T.red,
    color: '#000',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    padding: '2px 8px',
  },
  siteName: {
    color: T.green,
    fontSize: '14px',
    letterSpacing: '0.15em',
    fontWeight: 700,
  },
  logoutBtn: {
    background: 'transparent',
    border: `1px solid ${T.red}55`,
    color: T.red,
    fontFamily: '"Fira Code", monospace',
    fontSize: '11px',
    letterSpacing: '0.15em',
    padding: '5px 14px',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
  },
  label: {
    color: T.red,
    fontSize: '11px',
    letterSpacing: '0.25em',
    marginBottom: '12px',
    textAlign: 'center',
  },
  vaultBlock: {
    textAlign: 'center',
    border: `1px solid ${T.red}55`,
    background: 'rgba(255,0,0,0.04)',
    padding: '48px 60px',
    boxShadow: `0 0 40px ${T.redGlow}, inset 0 0 30px rgba(255,0,0,0.05)`,
    marginBottom: '40px',
    position: 'relative',
  },
  countLabel: {
    color: T.grayLight,
    fontSize: '12px',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    marginBottom: '20px',
    display: 'block',
  },
  count: {
    fontSize: '88px',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-2px',
    color: T.green,
    textShadow: `0 0 30px ${T.greenGlow}, 0 0 60px rgba(0,255,0,0.2)`,
    display: 'block',
    transition: 'color 0.4s',
  },
  countLoading: {
    color: T.grayLight,
    textShadow: 'none',
  },
  tagline: {
    color: T.red,
    fontSize: '13px',
    letterSpacing: '0.2em',
    marginTop: '20px',
    textShadow: `0 0 10px ${T.red}`,
    display: 'block',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    width: '100%',
    maxWidth: '560px',
    marginBottom: '28px',
  },
  metaCard: {
    border: `1px solid ${T.green}22`,
    background: 'rgba(0,255,0,0.03)',
    padding: '18px 22px',
  },
  metaCardTitle: {
    color: T.grayLight,
    fontSize: '10px',
    letterSpacing: '0.2em',
    display: 'block',
    marginBottom: '6px',
  },
  metaCardValue: {
    color: T.green,
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  refreshBtn: {
    background: 'transparent',
    border: `1px solid ${T.green}55`,
    color: T.green,
    fontFamily: '"Fira Code", monospace',
    fontSize: '12px',
    letterSpacing: '0.15em',
    padding: '9px 24px',
    cursor: 'pointer',
    transition: 'background 0.2s, box-shadow 0.2s',
    marginBottom: '32px',
  },
  errorBox: {
    color: T.red,
    fontSize: '12px',
    letterSpacing: '0.08em',
    padding: '12px 20px',
    border: `1px solid ${T.red}44`,
    background: 'rgba(255,0,0,0.06)',
    marginBottom: '24px',
    textAlign: 'center',
  },
  statusBar: {
    borderTop: `1px solid ${T.red}22`,
    padding: '10px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: T.grayLight,
    letterSpacing: '0.1em',
  },
  statusDot: (connected) => ({
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: connected ? T.green : T.red,
    boxShadow: connected ? `0 0 6px ${T.greenGlow}` : `0 0 6px ${T.redGlow}`,
    marginRight: '6px',
    verticalAlign: 'middle',
  }),
  nukeBtn: {
    background: 'transparent',
    border: '2px solid #ff0000',
    color: '#ff0000',
    fontFamily: '"Fira Code", monospace',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.25em',
    padding: '13px 36px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    animation: 'neonPulse 1.2s ease-in-out infinite',
    position: 'relative',
    marginBottom: '28px',
  },
  vaultSterilized: {
    position: 'fixed',
    top: '28px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#0a0000',
    border: '2px solid #ff0000',
    color: '#ff0000',
    fontFamily: '"Fira Code", monospace',
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '0.35em',
    padding: '14px 40px',
    boxShadow: '0 0 40px rgba(255,0,0,0.6), 0 0 80px rgba(255,0,0,0.25)',
    zIndex: 9999,
    animation: 'glitchReveal 0.08s steps(1) infinite',
    whiteSpace: 'nowrap',
  },
};

/* ── Helpers ─────────────────────────────────────────────── */
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/* ── Component ───────────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();

  // ── core telemetry ──
  const [count, setCount]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [lastFetch, setLastFetch] = useState(null);
  const [uptime,  setUptime]  = useState(0);

  // ── recent drops with purge tracking ──
  const [currentRecentDrops,  setCurrentRecentDrops]  = useState([]);
  const [previousRecentDrops, setPreviousRecentDrops] = useState([]);
  const [purgedItems,  setPurgedItems]  = useState([]); // items playing exit animation
  // ref so fetchTelemetry closure always sees fresh value without re-subscribing
  const currentDropsRef = useRef([]);

  // ── UI ──
  const [refreshHover, setRefreshHover] = useState(false);
  const [logoutHover,  setLogoutHover]  = useState(false);
  const [nukeHover,    setNukeHover]    = useState(false);
  const [purging,      setPurging]      = useState(false);
  const [nukeNotif,    setNukeNotif]    = useState(false);

  // ── inject keyframes once ──
  useEffect(() => {
    const id = 'vanish-admin-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes purgeGlitch {
        0%   { opacity: 1;   transform: translateX(0)    skewX(0deg);   filter: brightness(1); }
        15%  { opacity: 0.9; transform: translateX(-6px) skewX(-4deg);  filter: brightness(2) hue-rotate(20deg); }
        30%  { opacity: 0.6; transform: translateX(4px)  skewX(3deg);   filter: brightness(3); }
        50%  { opacity: 0.8; transform: translateX(-3px) skewX(-2deg);  filter: brightness(1.5); }
        70%  { opacity: 0.4; transform: translateX(2px)  skewX(1deg);   filter: brightness(2); }
        85%  { opacity: 0.2; transform: translateX(-1px) skewX(0deg);   filter: brightness(1); }
        100% { opacity: 0;   transform: translateX(0)    skewX(0deg);   filter: brightness(1); }
      }
      @keyframes dropFadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes scanPulse {
        0%, 100% { box-shadow: 0 0 0px rgba(255,0,0,0); }
        50%      { box-shadow: 0 0 12px rgba(255,0,0,0.5); }
      }
      @keyframes neonPulse {
        0%, 100% {
          box-shadow: 0 0 6px #ff0000, 0 0 14px rgba(255,0,0,0.5), inset 0 0 8px rgba(255,0,0,0.1);
          border-color: #ff0000;
        }
        50% {
          box-shadow: 0 0 18px #ff0000, 0 0 40px rgba(255,0,0,0.7), 0 0 70px rgba(255,0,0,0.3), inset 0 0 20px rgba(255,0,0,0.2);
          border-color: #ff4444;
        }
      }
      @keyframes glitchReveal {
        0%   { clip-path: inset(10% 0 80% 0); transform: translateX(-50%) skewX(-3deg); opacity: 0.95; }
        10%  { clip-path: inset(0% 0 0% 0);  transform: translateX(calc(-50% + 4px)) skewX(2deg);  opacity: 1; }
        20%  { clip-path: inset(15% 0 30% 0); transform: translateX(calc(-50% - 3px)) skewX(-1deg); opacity: 0.9; }
        35%  { clip-path: inset(0% 0 0% 0);  transform: translateX(-50%) skewX(0deg); opacity: 1; }
        50%  { clip-path: inset(5% 0 60% 0); transform: translateX(calc(-50% + 2px)) skewX(1deg);  opacity: 0.95; }
        65%  { clip-path: inset(0% 0 0% 0);  transform: translateX(-50%) skewX(-1deg); opacity: 1; }
        80%  { clip-path: inset(20% 0 10% 0); transform: translateX(calc(-50% - 2px)) skewX(2deg); opacity: 0.9; }
        100% { clip-path: inset(0% 0 0% 0);  transform: translateX(-50%) skewX(0deg); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => { /* leave keyframes — avoids flash on re-render */ };
  }, []);

  // ── auth redirect ──
  useEffect(() => {
    if (!localStorage.getItem('vanish_admin_token')) navigate('/admin');
  }, [navigate]);

  // ── uptime clock ──
  useEffect(() => {
    const id = setInterval(() => setUptime(u => u + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ── fetch + purge comparison ──
  const fetchTelemetry = useCallback(async () => {
    const token = localStorage.getItem('vanish_admin_token');
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/admin/telemetry`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('vanish_admin_token');
        navigate('/admin');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to fetch telemetry.');
        setLoading(false);
        return;
      }

      const freshDrops = data.recentDrops || [];
      const prevDrops  = currentDropsRef.current;

      // ── detect purged IDs (present before, absent now) ──
      const freshIds = new Set(freshDrops.map(d => d._id));
      const purged   = prevDrops.filter(d => !freshIds.has(d._id));

      if (purged.length > 0) {
        setPurgedItems(purged);
        setTimeout(() => setPurgedItems([]), 1600); // clear after animation
      }

      // rotate state
      setPreviousRecentDrops(prevDrops);
      currentDropsRef.current = freshDrops;
      setCurrentRecentDrops(freshDrops);

      setCount(data.totalDrops);
      setLastFetch(new Date());
    } catch {
      setError('NETWORK ERROR — Backend unreachable.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Auto-fetch on mount + every 30s
  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30_000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  const handleLogout = () => {
    localStorage.removeItem('vanish_admin_token');
    navigate('/admin');
  };

  const handlePurge = async () => {
    const confirmed = window.confirm(
      'WARNING: THIS WILL PERMANENTLY DELETE ALL ENCRYPTED DROPS. PROCEED?'
    );
    if (!confirmed) return;

    const token = localStorage.getItem('vanish_admin_token');
    if (!token) return;

    setPurging(true);
    try {
      const res = await fetch(`${API}/api/admin/purge`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('vanish_admin_token');
        navigate('/admin');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'PURGE OPERATION FAILED.');
        return;
      }

      // Show glitchy notification
      setNukeNotif(true);
      setTimeout(() => setNukeNotif(false), 3200);

      // Refresh telemetry so count resets to 0
      await fetchTelemetry();
    } catch {
      setError('NETWORK ERROR — Purge request failed.');
    } finally {
      setPurging(false);
    }
  };

  const connected = !error && !loading;

  // ── DropRow sub-component ──
  const DropRow = ({ drop, isPurging }) => (
    <div
      key={drop._id}
      style={{
        borderLeft: `3px solid ${isPurging ? T.red : T.green}`,
        borderBottom: `1px solid ${isPurging ? T.red + '33' : T.green + '18'}`,
        padding: '10px 16px',
        background: isPurging
          ? 'rgba(255,0,0,0.06)'
          : 'rgba(0,255,0,0.02)',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '6px 16px',
        alignItems: 'start',
        animation: isPurging
          ? 'purgeGlitch 1.6s ease-out forwards'
          : 'dropFadeIn 0.35s ease-out',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* PURGED badge */}
      {isPurging && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: T.red, color: '#000',
          fontSize: '9px', fontWeight: 700,
          letterSpacing: '3px', padding: '2px 8px',
        }}>
          ✕ PURGED
        </div>
      )}

      {/* left column: id + ciphertext */}
      <div>
        <div style={{
          fontSize: '10px', color: isPurging ? T.red : T.green,
          letterSpacing: '2px', marginBottom: '4px',
          fontWeight: 700,
        }}>
          DROP // {drop._id}
          {drop.duressCipher && (
            <span style={{
              marginLeft: '10px', color: T.red,
              fontSize: '9px', letterSpacing: '2px',
            }}>⚠ DURESS</span>
          )}
        </div>
        <div style={{
          fontSize: '11px', color: '#bbb',
          letterSpacing: '0.5px', wordBreak: 'break-all',
          fontFamily: '"Fira Code", monospace',
        }}>
          <span style={{ color: isPurging ? T.red + 'aa' : T.grayLight, fontSize: '9px', letterSpacing: '2px', marginRight: '6px' }}>
            (ENCRYPTED)
          </span>
          {drop.ciphertext.slice(0, 38)}
          <span style={{ opacity: 0.5 }}>…</span>
        </div>
      </div>

      {/* right column: timestamp */}
      <div style={{
        fontSize: '10px', color: T.grayLight,
        letterSpacing: '1px', textAlign: 'right',
        whiteSpace: 'nowrap', paddingTop: '2px',
      }}>
        {new Date(drop.createdAt).toISOString().slice(0, 19).replace('T', '\n')}Z
      </div>
    </div>
  );

  // merged list for render: purging items shown at top, then current
  const purgedIds = new Set(purgedItems.map(d => d._id));
  // avoid showing same item twice if it reappears (edge case)
  const displayList = [
    ...purgedItems,
    ...currentRecentDrops.filter(d => !purgedIds.has(d._id)),
  ];

  return (
    <div style={S.wrapper}>

      {/* VAULT STERILIZED glitch notification */}
      {nukeNotif && (
        <div id="vault-sterilized-notif" style={S.vaultSterilized}>
          ☢&nbsp;&nbsp;VAULT STERILIZED&nbsp;&nbsp;☢
        </div>
      )}

      {/* Top Bar */}
      <div style={S.topBar}>
        <div style={S.topBarLeft}>
          <span style={S.badge}>⚠ ADMIN</span>
          <span style={S.siteName}>VANISH-E // SYSTEM CONTROL</span>
        </div>
        <button
          id="admin-logout-btn"
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            ...S.logoutBtn,
            ...(logoutHover ? { background: T.red, color: '#000' } : {}),
          }}
        >
          ⟶  TERMINATE SESSION
        </button>
      </div>

      {/* Main Content */}
      <main style={S.main}>
        <span style={S.label}>// LIVE SYSTEM TELEMETRY — AUTO-REFRESH: 30s</span>

        {/* Vault Counter Block */}
        <div style={S.vaultBlock}>
          <span style={S.countLabel}>ACTIVE ENCRYPTED DROPS IN VAULT</span>

          <span
            id="admin-vault-count"
            style={{ ...S.count, ...(loading || error ? S.countLoading : {}) }}
          >
            {loading ? '----' : error ? 'ERR' : String(count).padStart(4, '0')}
          </span>

          <span style={S.tagline}>
            {loading
              ? '// SCANNING VAULT...'
              : error
                ? '// VAULT UNREACHABLE'
                : '// MESSAGES ARE CLIENT-SIDE ENCRYPTED — CONTENTS OPAQUE TO ADMIN'}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div id="admin-error-msg" style={S.errorBox}>
            <span style={{ color: T.red }}>SYSTEM ERR &gt;</span> {error}
          </div>
        )}

        {/* Meta Grid */}
        <div style={S.metaGrid}>
          <div style={S.metaCard}>
            <span style={S.metaCardTitle}>LAST SYNC</span>
            <span style={S.metaCardValue}>
              {lastFetch ? lastFetch.toLocaleTimeString() : '—'}
            </span>
          </div>
          <div style={S.metaCard}>
            <span style={S.metaCardTitle}>SESSION UPTIME</span>
            <span style={S.metaCardValue}>{formatUptime(uptime)}</span>
          </div>
          <div style={S.metaCard}>
            <span style={S.metaCardTitle}>ENCRYPTION MODEL</span>
            <span style={S.metaCardValue}>AES-256 (CLIENT)</span>
          </div>
          <div style={S.metaCard}>
            <span style={S.metaCardTitle}>ADMIN ROLE</span>
            <span style={{ ...S.metaCardValue, color: T.red }}>LEVEL-1 READ-ONLY</span>
          </div>
        </div>

        {/* NUKE Button */}
        <button
          id="admin-nuke-btn"
          onClick={handlePurge}
          disabled={purging}
          onMouseEnter={() => setNukeHover(true)}
          onMouseLeave={() => setNukeHover(false)}
          style={{
            ...S.nukeBtn,
            ...(nukeHover && !purging
              ? { background: 'rgba(255,0,0,0.12)', color: '#ff4444' }
              : {}),
            ...(purging ? { opacity: 0.55, cursor: 'not-allowed', animation: 'none' } : {}),
          }}
        >
          {purging ? '☢  STERILIZING...' : '☢  UNILATERAL PURGE (NUKE VAULT)'}
        </button>

        {/* Manual Refresh */}
        <button
          id="admin-refresh-btn"
          onClick={fetchTelemetry}
          disabled={loading}
          onMouseEnter={() => setRefreshHover(true)}
          onMouseLeave={() => setRefreshHover(false)}
          style={{
            ...S.refreshBtn,
            ...(refreshHover && !loading
              ? { background: 'rgba(0,255,0,0.08)', boxShadow: `0 0 14px ${T.greenGlow}` }
              : {}),
            ...(loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
          }}
        >
          {loading ? '⟳  SYNCING...' : '⟳  REFRESH TELEMETRY'}
        </button>

        {/* ── Recent Drops Log with Purge Animation ── */}
        <div style={{ width: '100%', maxWidth: '860px', marginTop: '8px' }}>

          {/* section header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            borderBottom: `1px solid ${T.red}33`, paddingBottom: '8px', marginBottom: '2px',
          }}>
            <span style={{ fontSize: '10px', color: T.red, letterSpacing: '3px' }}>
              ── VAULT LOG ── LAST 10 DROPS ──
            </span>
            <span style={{ fontSize: '10px', color: T.grayLight, letterSpacing: '2px' }}>
              {loading ? 'SCANNING...' : `${currentRecentDrops.length} RECORD${currentRecentDrops.length !== 1 ? 'S' : ''}`}
            </span>
          </div>

          {/* column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto',
            padding: '6px 16px',
            fontSize: '9px', color: T.grayLight, letterSpacing: '3px',
          }}>
            <span>ID · CIPHERTEXT PREVIEW</span>
            <span>TIMESTAMP (UTC)</span>
          </div>

          {/* rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading && currentRecentDrops.length === 0 ? (
              // skeleton placeholders
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{
                  borderLeft: `3px solid ${T.gray}55`,
                  borderBottom: `1px solid ${T.gray}22`,
                  padding: '10px 16px',
                  background: 'rgba(0,255,0,0.01)',
                }}>
                  <div style={{ color: T.gray, fontSize: '10px', letterSpacing: '2px' }}>
                    DROP // ────────────────────────────
                  </div>
                  <div style={{ color: T.gray, fontSize: '11px', marginTop: '4px' }}>
                    ── ──── ──── ──── ──── ──── ──── ────
                  </div>
                </div>
              ))
            ) : displayList.length === 0 ? (
              <div style={{
                padding: '30px 16px', textAlign: 'center',
                color: T.gray, fontSize: '12px', letterSpacing: '4px',
                borderLeft: `3px solid ${T.gray}33`,
                animation: 'scanPulse 2.5s ease-in-out infinite',
              }}>
                // NO ACTIVE DROPS IN VAULT
              </div>
            ) : (
              displayList.map(drop => (
                <DropRow
                  key={drop._id}
                  drop={drop}
                  isPurging={purgedIds.has(drop._id)}
                />
              ))
            )}
          </div>

          {/* footer hint */}
          {!loading && previousRecentDrops.length > 0 && purgedItems.length === 0 && (
            <div style={{
              fontSize: '9px', color: T.grayLight, letterSpacing: '2px',
              textAlign: 'right', paddingTop: '8px', opacity: 0.6,
            }}>
              ◈ PURGED RECORDS ANIMATE RED BEFORE DISAPPEARING
            </div>
          )}
        </div>
      </main>

      {/* Status Bar */}
      <div style={S.statusBar}>
        <span>
          <span style={S.statusDot(connected)} />
          {connected ? 'VAULT ONLINE' : error ? 'VAULT UNREACHABLE' : 'SYNCING...'}
        </span>
        <span>VANISH-E v1.0 // ADMIN MODULE</span>
        <span>SESSION ENCRYPTED &nbsp;|&nbsp; JWT HS256</span>
      </div>
    </div>
  );
}

