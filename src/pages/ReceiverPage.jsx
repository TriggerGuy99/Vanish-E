import { useState } from 'react';
import { useParams } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { C } from '../globals.js';
import { NeonInput, NeonButton, Cursor } from '../components/ui.jsx';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

/* ─── ReceiverPage: fetch, decrypt, burn-sequence ─── */
export default function ReceiverPage() {
  const { id: urlId } = useParams();
  // full magic link pasted manually (or empty when user landed via direct URL)
  const [linkInput, setLinkInput] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | decrypting | revealed | error
  const [plaintext, setPlaintext] = useState('');
  const [errMsg, setErrMsg]       = useState('');
  const [decryptLabel, setDecryptLabel] = useState('');
  const [resolvedId, setResolvedId] = useState(urlId || '');

  /* ── Parse id + aesKey from a pasted magic link ────────────────────────────
     Handles both full URLs:  http://localhost:3000/drop/<id>#<key>
     and bare IDs in the input (only when user arrived via URL and key is in hash) */
  const parseMagicLink = (raw) => {
    try {
      const url = new URL(raw.trim());
      const segments = url.pathname.split('/').filter(Boolean); // ['drop', '<id>']
      const id  = segments[segments.length - 1];
      const key = url.hash.slice(1); // strip '#'
      return { id, key };
    } catch {
      return null; // not a valid URL
    }
  };

  const handleAccess = async () => {
    let dropId, aesKey;

    if (linkInput.trim()) {
      // Manual path: parse the pasted magic link
      const parsed = parseMagicLink(linkInput.trim());
      if (!parsed || !parsed.id) {
        setErrMsg('INVALID MAGIC LINK — PASTE THE FULL URL (e.g. http://...drop/<id>#<key>)');
        setPhase('error');
        return;
      }
      if (!parsed.key) {
        setErrMsg('DECRYPTION KEY MISSING FROM MAGIC LINK — ENSURE THE FULL LINK INCLUDING THE # PART IS PASTED');
        setPhase('error');
        return;
      }
      dropId = parsed.id;
      aesKey = parsed.key;
    } else {
      // URL-navigation path: id comes from route param, key from browser URL hash
      dropId = urlId;
      aesKey = window.location.hash.slice(1);
      if (!dropId) {
        setErrMsg('DROP ID IS REQUIRED — PASTE THE FULL MAGIC LINK BELOW');
        setPhase('error');
        return;
      }
      if (!aesKey) {
        setErrMsg('DECRYPTION KEY NOT FOUND — OPEN THE MAGIC LINK DIRECTLY OR PASTE IT IN FULL');
        setPhase('error');
        return;
      }
    }

    setResolvedId(dropId);
    setPhase('decrypting');

    const stages = [
      'LOCATING RECORD...',
      'VERIFYING TOKEN...',
      'DECRYPTING PAYLOAD...',
      'VALIDATING INTEGRITY...',
    ];
    let i = 0;
    setDecryptLabel(stages[0]);
    const labelTimer = setInterval(() => {
      i++;
      if (i < stages.length) setDecryptLabel(stages[i]);
    }, 375);

    try {
      const { data } = await axios.get(`${API_BASE}/messages/${dropId}`);
      const { ciphertext, duressCipher } = data;

      await new Promise(resolve => setTimeout(resolve, 1500));
      clearInterval(labelTimer);

      // Try the key against the real ciphertext first
      let decoded = '';
      try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, aesKey);
        decoded = bytes.toString(CryptoJS.enc.Utf8);
      } catch (_) { /* key mismatch — will try duress below */ }

      // If real decryption failed AND a duress cipher exists, try that
      if (!decoded && duressCipher) {
        try {
          const bytes = CryptoJS.AES.decrypt(duressCipher, aesKey);
          decoded = bytes.toString(CryptoJS.enc.Utf8);
        } catch (_) { /* key matches neither cipher */ }
      }

      if (!decoded) {
        setErrMsg('DECRYPTION FAILED — KEY MISMATCH OR DATA CORRUPTED');
        setPhase('error');
        return;
      }

      setPlaintext(decoded);
      setPhase('revealed');
    } catch (err) {
      clearInterval(labelTimer);
      if (err?.response?.status === 404) {
        setErrMsg('RECORD NOT FOUND — ALREADY ACCESSED OR NEVER EXISTED');
      } else {
        setErrMsg(err?.response?.data?.message || err.message || 'SERVER UNREACHABLE');
      }
      setPhase('error');
    }
  };

  /* ── decrypting animation view ── */
  if (phase === 'decrypting') {
    return (
      <div style={{ animation: 'fadeInUp 0.4s ease-out', textAlign: 'center', padding: '50px 0' }}>
        <div style={{ fontSize: '12px', color: C.gray, letterSpacing: '4px', marginBottom: '24px' }}>
          ── SECURE CHANNEL OPEN ──
        </div>
        <div style={{
          fontSize: '18px', color: C.green, marginBottom: '28px',
          textShadow: `0 0 15px ${C.greenGlow}`,
          animation: 'flicker 1.5s infinite',
        }}>
          DECRYPTING PAYLOAD...<Cursor />
        </div>
        {/* scanning bar */}
        <div style={{ width: '60%', margin: '0 auto 16px', height: '2px', background: '#111', border: `1px solid ${C.gray}33`, overflow: 'hidden' }}>
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(90deg, transparent, ${C.green}, transparent)`,
            animation: 'scanline 1s linear infinite',
          }} />
        </div>
        <div style={{ fontSize: '11px', color: C.gray, letterSpacing: '3px' }}>
          {decryptLabel}
        </div>
      </div>
    );
  }

  /* ── error view ── */
  if (phase === 'error') {
    return (
      <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <div style={{
          border: `1px solid ${C.red}`, padding: '20px',
          background: 'rgba(255,34,68,0.06)', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: C.red, letterSpacing: '3px', marginBottom: '8px' }}>
            ⚠ ACCESS DENIED
          </div>
          <div style={{ fontSize: '11px', color: C.yellow, letterSpacing: '2px', lineHeight: 1.7 }}>
            {errMsg}
          </div>
        </div>
      </div>
    );
  }

  /* ── revealed — show decrypted message + burn warning ── */
  if (phase === 'revealed') {
    return (
      <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '12px', color: C.green, letterSpacing: '4px' }}>
          ✓ PAYLOAD DECRYPTED
        </div>

        {/* dashed message container */}
        <div style={{
          border: `2px dashed ${C.green}`,
          padding: '24px',
          background: 'rgba(0,255,0,0.03)',
          marginBottom: '20px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: '-10px', left: '16px',
            background: C.bg, padding: '0 10px',
            fontSize: '10px', color: C.green, letterSpacing: '3px',
          }}>
            DECRYPTED COMMUNIQUÉ
          </div>
          <div style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: 1.9, letterSpacing: '0.5px' }}>
            {plaintext}
          </div>
          <div style={{ marginTop: '14px', fontSize: '10px', color: C.gray, letterSpacing: '2px', opacity: 0.6 }}>
            DROP ID: {resolvedId} // ACCESSED: {new Date().toISOString().slice(0, 19)}Z
          </div>
        </div>

        {/* burn warning */}
        <div style={{
          border: `1px solid ${C.red}`,
          padding: '16px 18px',
          background: 'rgba(255,34,68,0.06)',
          marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '12px', fontWeight: 700, letterSpacing: '3px',
            color: C.red, marginBottom: '6px',
            textShadow: '0 0 10px rgba(255,34,68,0.4)',
          }}>
            ⚠ WARNING
          </div>
          <div style={{ fontSize: '11px', color: C.yellow, letterSpacing: '2px', lineHeight: 1.6 }}>
            CIPHERTEXT PERMANENTLY PURGED FROM DATABASE.
          </div>
        </div>
      </div>
    );
  }

  /* ── idle — magic link input + ACCESS button ── */
  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '4px', marginBottom: '20px' }}>
        ── RETRIEVE ENCRYPTED MESSAGE ──
      </div>

      {/* show read-only Drop ID if arrived via direct magic link */}
      {urlId && !linkInput && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          border: `1px solid ${C.gray}44`,
          background: 'rgba(0,255,0,0.02)',
          fontSize: '11px', color: C.gray, letterSpacing: '2px',
        }}>
          <span style={{ color: C.gray, fontSize: '10px', letterSpacing: '3px', display: 'block', marginBottom: '4px' }}>DROP ID (FROM LINK)</span>
          <span style={{ color: C.green }}>{urlId}</span>
        </div>
      )}

      {/* magic link input field */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '3px', marginBottom: '8px' }}>
          {urlId ? 'OR PASTE A DIFFERENT MAGIC LINK' : 'PASTE MAGIC LINK'}
        </div>
        <NeonInput
          id="input-magic-link"
          value={linkInput}
          onChange={setLinkInput}
          placeholder="[ PASTE FULL MAGIC LINK — http://...drop/<id>#<key> ]"
        />
      </div>

      <NeonButton
        id="btn-access"
        onClick={handleAccess}
        disabled={!urlId && !linkInput.trim()}
      >
        ⟐ ACCESS COMMUNIQUÉ
      </NeonButton>

      <div style={{ marginTop: '16px', fontSize: '10px', color: C.gray, letterSpacing: '2px', lineHeight: 1.8, opacity: 0.6 }}>
        Open the magic link directly <em>or</em> paste it in full above.
        The AES key in the <code style={{ color: C.green }}>#fragment</code> never leaves your device — the server only holds ciphertext.
      </div>
    </div>
  );
}
