import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { C } from '../globals.js';

/* ─── live UTC clock ─── */
const Clock = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(d.toISOString().replace('T', ' // ').slice(0, 22) + ' UTC');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontSize: '10px', color: C.green, opacity: 0.4, fontVariantNumeric: 'tabular-nums' }}>
      SYS.TIME: {time}
    </span>
  );
};

/* ─── nav link ─── */
const NavLink = ({ to, label, sub, active }) => (
  <Link
    to={to}
    style={{
      display: 'inline-block',
      padding: '10px 24px',
      textDecoration: 'none',
      fontFamily: '"Fira Code", monospace',
      fontSize: '12px',
      fontWeight: active ? 600 : 400,
      letterSpacing: '3px',
      color: active ? C.green : C.gray,
      border: `1px solid ${active ? C.green : C.gray + '66'}`,
      borderBottom: active ? `2px solid ${C.green}` : `1px solid ${C.gray}66`,
      background: active ? 'rgba(0,255,0,0.07)' : 'transparent',
      textShadow: active ? `0 0 12px ${C.greenGlow}` : 'none',
      transition: 'all 0.25s ease',
    }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.color = C.green;
        e.currentTarget.style.borderColor = C.green;
        e.currentTarget.style.boxShadow = `0 0 12px ${C.greenGlow}`;
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        e.currentTarget.style.color = C.gray;
        e.currentTarget.style.borderColor = C.gray + '66';
        e.currentTarget.style.boxShadow = 'none';
      }
    }}
  >
    {label}
    <div style={{ fontSize: '8px', letterSpacing: '4px', marginTop: '3px', opacity: 0.5 }}>{sub}</div>
  </Link>
);

/* ─── top navbar ─── */
export const Navbar = () => {
  const { pathname } = useLocation();
  const isSender   = pathname === '/';
  const isStego    = pathname === '/stego-drop';
  const isHowToUse = pathname === '/how-to-use';
  const isReceiver = !isSender && !isStego && !isHowToUse;

  return (
    <header style={{
      borderBottom: `1px solid ${C.green}22`,
      padding: '16px 0 0',
      marginBottom: '0',
      animation: 'fadeInUp 0.5s ease-out',
    }}>
      {/* branding row */}
      <div style={{ textAlign: 'center', paddingBottom: '12px' }}>
        <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '6px', marginBottom: '6px' }}>
          ▓▓▓ ENCRYPTED CHANNEL ACTIVE ▓▓▓
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 46px)',
          fontWeight: 700,
          color: C.green,
          margin: '0 0 4px',
          letterSpacing: '8px',
          textShadow: `0 0 30px ${C.greenGlow}, 0 0 60px rgba(0,255,0,0.15)`,
          animation: 'flicker 4s infinite',
        }}>
          VANISH<span style={{ color: C.gray, fontWeight: 300 }}>-</span>E
        </h1>
        <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '3px', marginBottom: '6px' }}>
          BURN-AFTER-READING // ZERO-KNOWLEDGE MESSAGING PROTOCOL
        </div>
        <Clock />
      </div>

      {/* nav tabs */}
      <nav style={{ display: 'flex', justifyContent: 'center', gap: '2px', paddingBottom: '0' }}>
        <NavLink to="/"           label="◆ DROP ZONE"       sub="CREATE" active={isSender}   />
        <NavLink to="/drop/"      label="◆ ACCESS TERMINAL" sub="READ"   active={isReceiver} />
        <NavLink to="/stego-drop" label="◆ STEGO TERMINAL"  sub="LSB"    active={isStego}    />
        <NavLink to="/how-to-use" label="◆ FIELD MANUAL"    sub="HELP"   active={isHowToUse} />
      </nav>
    </header>
  );
};

/* ─── footer ─── */
export const Footer = () => (
  <footer style={{
    textAlign: 'center',
    padding: '28px 0 18px',
    borderTop: `1px solid ${C.gray}22`,
    marginTop: '40px',
    animation: 'fadeInUp 0.9s ease-out',
  }}>
    <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '3px', marginBottom: '4px' }}>
      VANISH-E v3.0.0 // ZERO-KNOWLEDGE ARCHITECTURE
    </div>
    <div style={{ fontSize: '9px', color: C.gray, opacity: 0.4, letterSpacing: '2px' }}>
      NO LOGS • NO TRACES • NO EVIDENCE
    </div>
    <div style={{ fontSize: '9px', color: C.gray, opacity: 0.3, letterSpacing: '2px', marginTop: '8px' }}>
      MADE BY TRIGGERGUY💚 // SILENCE IS THE LOUDEST ENCRYPTION
    </div>
  </footer>
);
