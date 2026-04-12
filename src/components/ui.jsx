import { C } from '../globals.js';

/* ─── matrix rain background ─── */
export const MatrixRain = () => {
  const cols = 30;
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none', opacity: 0.06 }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0,
          left: `${(i / cols) * 100}%`,
          fontSize: '14px',
          fontFamily: '"Fira Code", monospace',
          color: C.green,
          writingMode: 'vertical-rl',
          animation: `matrixRain ${4 + Math.random() * 8}s linear ${Math.random() * 5}s infinite`,
          whiteSpace: 'nowrap',
        }}>
          {Array.from({ length: 40 }, () => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')}
        </div>
      ))}
    </div>
  );
};

/* ─── scanline CRT overlay ─── */
export const Scanline = () => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
    background: 'repeating-linear-gradient(0deg, rgba(0,255,0,0.03) 0px, transparent 1px, transparent 3px)',
  }} />
);

/* ─── blinking block cursor ─── */
export const Cursor = () => (
  <span style={{ animation: 'blink 1s step-end infinite', color: C.green, fontWeight: 700 }}>█</span>
);

/* ─── transparent neon input / textarea ─── */
export const NeonInput = ({ value, onChange, placeholder, multiline, id }) => {
  const base = {
    width: '100%',
    padding: '16px 18px',
    background: 'rgba(0,255,0,0.03)',
    border: `1px solid ${C.gray}`,
    color: C.green,
    fontFamily: '"Fira Code", monospace',
    fontSize: '14px',
    letterSpacing: '1px',
    outline: 'none',
    transition: 'all 0.3s ease',
    resize: 'none',
  };
  const handlers = {
    onFocus: e => {
      e.target.style.borderColor = C.green;
      e.target.style.boxShadow = `0 0 20px ${C.greenGlow}, inset 0 0 20px rgba(0,255,0,0.05)`;
    },
    onBlur: e => {
      e.target.style.borderColor = C.gray;
      e.target.style.boxShadow = 'none';
    },
  };

  if (multiline) {
    return (
      <textarea
        id={id}
        rows={8}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...base, minHeight: '180px' }}
        {...handlers}
      />
    );
  }
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={base}
      {...handlers}
    />
  );
};

/* ─── neon bordered button ─── */
export const NeonButton = ({ children, onClick, disabled, variant = 'primary', id }) => {
  const isPrimary = variant === 'primary';
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '16px 0',
        marginTop: '16px',
        background: disabled ? 'transparent' : isPrimary ? 'rgba(0,255,0,0.08)' : 'transparent',
        border: `1px solid ${disabled ? C.gray : C.green}`,
        color: disabled ? C.gray : C.green,
        fontFamily: '"Fira Code", monospace',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        textTransform: 'uppercase',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.background = 'rgba(0,255,0,0.15)';
          e.currentTarget.style.boxShadow = `0 0 25px ${C.greenGlow}, inset 0 0 25px rgba(0,255,0,0.08)`;
          e.currentTarget.style.textShadow = `0 0 10px ${C.greenGlow}`;
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.background = isPrimary ? 'rgba(0,255,0,0.08)' : 'transparent';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.textShadow = 'none';
        }
      }}
    >
      {children}
    </button>
  );
};
