import { useState, useRef } from 'react';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { C } from '../globals.js';
import { NeonInput, NeonButton, Cursor } from '../components/ui.jsx';
import { encodeMessageInImage } from '../utils/steganography.js';

const API_BASE = import.meta.env.VITE_API_URL ?${import.meta.env.VITE_API_URL}/api: 'http://localhost:5000/api';

/* ── Carrier images served from /public/stego-images/ — all files ── */
const STEGO_IMAGES = [
  '/stego-images/android.png',
  '/stego-images/lone_tree.png',
  '/stego-images/money_on_fire.png',
  '/stego-images/rocky_earth.png',
  '/stego-images/standard_bg.png',
];

/* ─── SenderPage: compose, encrypt, post, display magic link ─── */
export default function SenderPage() {
  const [msg, setMsg] = useState('');
  const [coverMsg, setCoverMsg] = useState('');
  const [clearanceLevel, setClearanceLevel] = useState(1);
  const [phase, setPhase] = useState('idle'); // idle | encrypting | done | error
  const [magicLink, setMagicLink] = useState('');
  const [realLink, setRealLink] = useState(''); // Level 3 real-message link
  const [duressLink, setDuressLink] = useState(''); // Level 3 duress link
  const [dropId, setDropId] = useState('');
  const [stegoBlob, setStegoBlob] = useState(null);
  const [stegoKey, setStegoKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedReal, setCopiedReal] = useState(false); // Level 3
  const [copiedDuress, setCopiedDuress] = useState(false); // Level 3
  const [progress, setProgress] = useState(0);
  const [errMsg, setErrMsg] = useState('');
  const stegoUrlRef = useRef(null);

  /* ── encrypt → route by clearance level ── */
  const handleEncrypt = async () => {
    const payload = msg.trim();
    if (!payload) return;
    setPhase('encrypting');
    setProgress(0);
    setErrMsg('');

    // Animate progress bar
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 90) { clearInterval(iv); p = 90; }
      setProgress(Math.floor(p));
    }, 100);

    try {
      // 1. Generate random AES-256 key
      const rawKey = CryptoJS.lib.WordArray.random(32);
      const aesKey = rawKey.toString(CryptoJS.enc.Hex); // 64 hex chars

      // 2. Encrypt payload
      const ciphertext = CryptoJS.AES.encrypt(payload, aesKey).toString();

      /* ── LEVEL 2: steganography path ───────────────────────────── */
      if (clearanceLevel === 2) {
        // Pick a random real carrier image from /public/stego-images/
        const carrierSrc = STEGO_IMAGES[Math.floor(Math.random() * STEGO_IMAGES.length)];
        const blob = await encodeMessageInImage(ciphertext, carrierSrc);

        clearInterval(iv);
        setProgress(100);

        // Revoke any previous object URL to avoid leaks
        if (stegoUrlRef.current) URL.revokeObjectURL(stegoUrlRef.current);
        stegoUrlRef.current = URL.createObjectURL(blob);

        setTimeout(() => {
          setStegoBlob(blob);
          setStegoKey(aesKey);
          setPhase('done');
        }, 300);
        return;
      }

      /* ── LEVEL 3: duress protocol ─────────────────────────────────
         Two separate AES keys, two separate ciphertexts, ONE server drop.
         Real link  → #realKey  decrypts ciphertext
         Duress link → #duressKey decrypts duressCipher                   */
      if (clearanceLevel === 3) {
        const rawDuressKey = CryptoJS.lib.WordArray.random(32);
        const duressKey = rawDuressKey.toString(CryptoJS.enc.Hex);
        const duressCipher = CryptoJS.AES.encrypt(coverMsg.trim(), duressKey).toString();

        const { data } = await axios.post(`${API_BASE}/messages`, { ciphertext, duressCipher });

        clearInterval(iv);
        setProgress(100);

        const id = data._id;
        const rLink = `${window.location.origin}/drop/${id}#${aesKey}`;
        const dLink = `${window.location.origin}/drop/${id}#${duressKey}`;

        setTimeout(() => {
          setDropId(id);
          setRealLink(rLink);
          setDuressLink(dLink);
          setPhase('done');
        }, 300);
        return;
      }

      /* ── LEVEL 1: server drop path ────────────────────────────── */
      const { data } = await axios.post(`${API_BASE}/messages`, { ciphertext });

      clearInterval(iv);
      setProgress(100);

      const id = data._id;
      const link = `${window.location.origin}/drop/${id}#${aesKey}`;

      setTimeout(() => {
        setDropId(id);
        setMagicLink(link);
        setPhase('done');
      }, 300);
    } catch (err) {
      clearInterval(iv);
      setErrMsg(err?.response?.data?.message || err.message || 'SERVER UNREACHABLE');
      setPhase('error');
    }
  };

  const copyLink = () => { navigator.clipboard.writeText(magicLink); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const copyId = () => { navigator.clipboard.writeText(dropId); setCopiedId(true); setTimeout(() => setCopiedId(false), 2500); };
  const copyStegoKey = () => { navigator.clipboard.writeText(stegoKey); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2500); };
  const copyRealLink = () => { navigator.clipboard.writeText(realLink); setCopiedReal(true); setTimeout(() => setCopiedReal(false), 2500); };
  const copyDuressLink = () => { navigator.clipboard.writeText(duressLink); setCopiedDuress(true); setTimeout(() => setCopiedDuress(false), 2500); };

  const downloadStegoImage = () => {
    const a = document.createElement('a');
    a.href = stegoUrlRef.current;
    a.download = `vanish-e-stego-${Date.now()}.png`;
    a.click();
  };

  const reset = () => {
    setMsg(''); setCoverMsg(''); setPhase('idle');
    setMagicLink(''); setRealLink(''); setDuressLink('');
    setDropId(''); setCopied(false); setCopiedId(false);
    setCopiedReal(false); setCopiedDuress(false);
    setStegoBlob(null); setStegoKey(''); setCopiedKey(false);
    setProgress(0); setErrMsg('');
    if (stegoUrlRef.current) { URL.revokeObjectURL(stegoUrlRef.current); stegoUrlRef.current = null; }
  };

  /* ── encrypting view ── */
  if (phase === 'encrypting') {
    return (
      <div style={{ animation: 'fadeInUp 0.4s ease-out', textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: '12px', color: C.gray, letterSpacing: '4px', marginBottom: '20px' }}>
          ── AES-256 ENCRYPTION IN PROGRESS ──
        </div>
        <div style={{ fontSize: '18px', color: C.green, marginBottom: '24px', textShadow: `0 0 15px ${C.greenGlow}` }}>
          ENCRYPTING PAYLOAD<Cursor />
        </div>
        <div style={{ width: '100%', height: '3px', background: '#111', border: `1px solid ${C.gray}44`, marginBottom: '12px' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: `linear-gradient(90deg, ${C.green}, ${C.greenDim})`,
            boxShadow: `0 0 10px ${C.greenGlow}`,
            transition: 'width 0.1s ease',
          }} />
        </div>
        <div style={{ fontSize: '11px', color: C.gray, fontVariantNumeric: 'tabular-nums' }}>
          [{progress}%] AES-256-CBC //{clearanceLevel === 2 ? ' LSB STEGANOGRAPHY...' : ' POSTING TO SERVER...'}
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
            ⚠ TRANSMISSION FAILED
          </div>
          <div style={{ fontSize: '11px', color: C.yellow, letterSpacing: '2px', lineHeight: 1.7 }}>
            {errMsg}
          </div>
        </div>
        <NeonButton id="btn-retry" onClick={reset} variant="secondary">↻ RETRY</NeonButton>
      </div>
    );
  }

  /* ── done view (Level 2): stego image download ── */
  if (phase === 'done' && clearanceLevel === 2) {
    return (
      <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '12px', color: C.green, letterSpacing: '4px' }}>
          ✓ PAYLOAD HIDDEN IN IMAGE
        </div>

        {/* stego image preview */}
        <div style={{
          border: `1px solid ${C.green}`, marginBottom: '8px',
          background: 'rgba(0,255,0,0.02)', overflow: 'hidden',
          animation: 'pulseGlow 3s ease-in-out infinite',
        }}>
          <img
            src={stegoUrlRef.current}
            alt="Stego carrier"
            style={{ width: '100%', display: 'block', filter: 'hue-rotate(100deg) saturate(0.4) brightness(0.65)' }}
          />
        </div>
        <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '3px', marginBottom: '8px', opacity: 0.7 }}>
          ◈ CIPHERTEXT HIDDEN IN PIXEL LSBs — VISUALLY INDISTINGUISHABLE FROM A NORMAL IMAGE
        </div>
        <NeonButton id="btn-stego-download" onClick={downloadStegoImage}>
          ⤓ DOWNLOAD SECURE IMAGE
        </NeonButton>

        {/* AES key — must be shared separately */}
        <div style={{
          border: `1px solid ${C.gray}55`, padding: '16px 20px',
          background: 'rgba(0,255,0,0.02)', marginTop: '16px', marginBottom: '8px',
        }}>
          <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '3px', marginBottom: '8px' }}>
            ◈ AES KEY — SHARE VIA SEPARATE SECURE CHANNEL
          </div>
          <div style={{
            fontSize: '12px', color: C.green, letterSpacing: '1.5px',
            wordBreak: 'break-all', fontFamily: '"Fira Code", monospace',
            textShadow: `0 0 6px ${C.greenGlow}`,
          }}>
            {stegoKey}
          </div>
        </div>
        <NeonButton id="btn-stego-copy-key" onClick={copyStegoKey} variant="secondary">
          {copiedKey ? '✓ KEY COPIED' : '⧉ COPY AES KEY'}
        </NeonButton>

        <div style={{ marginTop: '12px' }}>
          <NeonButton id="btn-stego-new" onClick={reset} variant="secondary">↻ NEW DROP</NeonButton>
        </div>

        <div style={{
          marginTop: '20px', padding: '12px 16px',
          border: `1px dashed ${C.gray}44`,
          fontSize: '10px', color: C.gray, letterSpacing: '2px', lineHeight: 1.8,
        }}>
          <div>■ METHOD: LSB STEGANOGRAPHY (512×512 PNG CARRIER)</div>
          <div>■ CIPHERTEXT: AES-256-CBC EMBEDDED IN R/G/B PIXEL LSBS</div>
          <div>■ SERVER NEVER CONTACTED — FULLY OFFLINE OPERATION</div>
          <div>■ RECIPIENT: /stego-drop — UPLOAD IMAGE + PASTE KEY</div>
        </div>
      </div>
    );
  }

  /* ── done view (Level 3): dual links ── */
  if (phase === 'done' && clearanceLevel === 3) {
    const linkBox = (label, labelColor, borderColor, link, copyFn, wasCopied, btnId) => (
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          border: `1px solid ${borderColor}`, padding: '16px 20px',
          background: `${borderColor}0a`, marginBottom: '6px',
        }}>
          <div style={{ fontSize: '10px', color: borderColor, letterSpacing: '3px', marginBottom: '8px', fontWeight: 700 }}>
            {label}
          </div>
          <div style={{ fontSize: '12px', color: borderColor, letterSpacing: '1px', wordBreak: 'break-all', lineHeight: 1.7, opacity: 0.9 }}>
            {link}
          </div>
        </div>
        <button
          id={btnId}
          onClick={copyFn}
          style={{
            width: '100%', padding: '12px 0',
            background: wasCopied ? `${borderColor}22` : 'transparent',
            border: `1px solid ${borderColor}88`,
            color: borderColor,
            fontFamily: '"Fira Code", monospace',
            fontSize: '12px', letterSpacing: '3px',
            cursor: 'pointer', transition: 'all 0.2s ease',
            textTransform: 'uppercase',
          }}
        >
          {wasCopied ? '✓ COPIED' : '⧉ COPY'}
        </button>
      </div>
    );

    return (
      <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '12px', color: C.green, letterSpacing: '4px' }}>
          ✓ DURESS PROTOCOL ARMED
        </div>

        {/* Real link */}
        {linkBox(
          '◈ REAL LINK — SHARE WITH TRUSTED RECIPIENT',
          C.green, C.green,
          realLink, copyRealLink, copiedReal, 'btn-copy-real'
        )}

        {/* Duress link */}
        {linkBox(
          '⚠ DURESS LINK — SHARE UNDER COERCION',
          C.yellow, C.yellow,
          duressLink, copyDuressLink, copiedDuress, 'btn-copy-duress'
        )}

        <div style={{ marginBottom: '12px', marginTop: '4px' }}>
          <NeonButton id="btn-duress-new" onClick={reset} variant="secondary">↻ NEW DROP</NeonButton>
        </div>

        <div style={{
          padding: '14px 16px',
          border: `1px dashed ${C.gray}44`,
          fontSize: '10px', color: C.gray, letterSpacing: '2px', lineHeight: 1.9,
        }}>
          <div>■ REAL LINK: decrypts the real message using realKey</div>
          <div>■ DURESS LINK: decrypts the cover message using duressKey</div>
          <div>■ BOTH LINKS POINT TO THE SAME DROP ID — INDISTINGUISHABLE</div>
          <div>■ EITHER ACCESS BURNS ALL DATA FROM SERVER</div>
        </div>
      </div>
    );
  }

  /* ── done view (Level 1): magic link ── */
  if (phase === 'done') {
    return (
      <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '12px', color: C.green, letterSpacing: '4px' }}>
          ✓ PAYLOAD ENCRYPTED &amp; STORED
        </div>

        {/* magic link box */}
        <div style={{
          border: `1px solid ${C.green}`, padding: '20px',
          background: 'rgba(0,255,0,0.04)', marginBottom: '8px',
          animation: 'pulseGlow 3s ease-in-out infinite',
        }}>
          <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '3px', marginBottom: '10px' }}>
            ◈ MAGIC LINK — SHARE WITH RECIPIENT
          </div>
          <div style={{
            fontSize: '13px', color: C.green, letterSpacing: '1px',
            wordBreak: 'break-all', lineHeight: 1.7,
            textShadow: `0 0 8px ${C.greenGlow}`,
          }}>
            {magicLink}
          </div>
        </div>
        <NeonButton id="btn-copy" onClick={copyLink}>
          {copied ? '✓ COPIED TO CLIPBOARD' : '⧉ COPY MAGIC LINK'}
        </NeonButton>

        {/* drop id box */}
        <div style={{
          border: `1px solid ${C.gray}55`, padding: '16px 20px',
          background: 'rgba(0,255,0,0.02)', marginBottom: '8px', marginTop: '16px',
        }}>
          <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '3px', marginBottom: '8px' }}>
            ◈ DROP ID — SHARE SEPARATELY (RECIPIENT ENTERS MANUALLY)
          </div>
          <div style={{
            fontSize: '13px', color: C.green, letterSpacing: '2px',
            wordBreak: 'break-all', fontWeight: 600,
            textShadow: `0 0 6px ${C.greenGlow}`,
          }}>
            {dropId}
          </div>
        </div>
        <NeonButton id="btn-copy-id" onClick={copyId} variant="secondary">
          {copiedId ? '✓ DROP ID COPIED' : '⧉ COPY DROP ID'}
        </NeonButton>

        <div style={{ marginTop: '12px' }}>
          <NeonButton id="btn-new-drop" onClick={reset} variant="secondary">↻ NEW DROP</NeonButton>
        </div>

        <div style={{
          marginTop: '20px', padding: '12px 16px',
          border: `1px dashed ${C.gray}44`,
          fontSize: '10px', color: C.gray, letterSpacing: '2px', lineHeight: 1.8,
        }}>
          <div>■ ENCRYPTION: AES-256-CBC (crypto-js)</div>
          <div>■ KEY NEVER SENT TO SERVER — URL FRAGMENT ONLY</div>
          <div>■ AUTO-PURGE: AFTER FIRST READ</div>
        </div>
      </div>
    );
  }

  /* ── idle / compose view ── */

  /* clearance level metadata */
  const LEVELS = [
    {
      id: 1,
      label: 'LEVEL 1: LINK-DROP',
      desc: 'Standard AES-256 drop. Single payload. Key embedded in URL fragment.',
    },
    {
      id: 2,
      label: 'LEVEL 2: STEGO-DROP',
      desc: 'Same encryption, elevated classification marker. Use for sensitive ops.',
    },
    {
      id: 3,
      label: 'LEVEL 3: DURESS-PROTOCOL',
      desc: 'Dual payload. Real message is encrypted. Cover message is a decoy for coerced disclosure.',
    },
  ];

  const canSubmit = clearanceLevel === 3
    ? msg.trim() && coverMsg.trim()
    : msg.trim();

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>

      {/* ─── Security Clearance Toggle ─── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '4px', marginBottom: '10px' }}>
          ── SECURITY CLEARANCE LEVEL ──
        </div>
        <div style={{ display: 'flex', gap: '0' }}>
          {LEVELS.map((lvl) => {
            const active = clearanceLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                id={`btn-level-${lvl.id}`}
                onClick={() => setClearanceLevel(lvl.id)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  background: active ? 'rgba(0,255,0,0.12)' : 'transparent',
                  border: `1px solid ${active ? C.green : C.gray + '66'}`,
                  borderRight: lvl.id < 3 ? 'none' : `1px solid ${active ? C.green : C.gray + '66'}`,
                  color: active ? C.green : C.gray,
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '9px',
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? `0 0 12px ${C.greenGlow}, inset 0 0 12px rgba(0,255,0,0.06)` : 'none',
                  textShadow: active ? `0 0 8px ${C.greenGlow}` : 'none',
                  textTransform: 'uppercase',
                }}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>
        {/* active level description */}
        <div style={{
          marginTop: '8px', padding: '8px 12px',
          border: `1px dashed ${C.gray}44`,
          fontSize: '10px', color: C.gray, letterSpacing: '1.5px', lineHeight: 1.7,
        }}>
          ◈ {LEVELS[clearanceLevel - 1].desc}
        </div>
      </div>

      {/* ─── Compose Area ─── */}
      <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '4px', marginBottom: '10px' }}>
        {clearanceLevel === 3 ? '── REAL MESSAGE (ENCRYPTED) ──' : '── COMPOSE SECURE PAYLOAD ──'}
      </div>
      <NeonInput
        id="input-payload"
        multiline
        value={msg}
        onChange={setMsg}
        placeholder={clearanceLevel === 3 ? '[ ENTER REAL MESSAGE — THIS WILL BE ENCRYPTED ]' : '[ ENTER SECURE PAYLOAD ]'}
      />

      {/* Level 3: Cover Message */}
      {clearanceLevel === 3 && (
        <>
          <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '4px', margin: '16px 0 10px' }}>
            ── COVER MESSAGE (DECOY) ──
          </div>
          <div style={{
            padding: '8px 12px', marginBottom: '10px',
            border: `1px dashed ${C.yellow}44`,
            fontSize: '10px', color: C.yellow, letterSpacing: '1.5px', lineHeight: 1.7,
          }}>
            ⚠ Under duress, reveal only this cover message. Real message stays concealed.
          </div>
          <NeonInput
            id="input-cover"
            multiline
            value={coverMsg}
            onChange={setCoverMsg}
            placeholder="[ ENTER COVER MESSAGE — DECOY FOR COERCED DISCLOSURE ]"
          />
        </>
      )}

      <NeonButton id="btn-encrypt" onClick={handleEncrypt} disabled={!canSubmit}>
        ⟐ ENCRYPT &amp; GENERATE LINK
      </NeonButton>

      <div style={{ marginTop: '16px', fontSize: '10px', color: C.gray, letterSpacing: '2px', lineHeight: 1.8, opacity: 0.6 }}>
        {clearanceLevel === 3
          ? 'Real message is AES-encrypted. Cover message is stored as plaintext metadata in the link — visible only to the recipient.'
          : 'Message is AES-encrypted client-side. Only ciphertext is sent to the server. The decryption key lives in the URL fragment — never touches the backend.'}
      </div>
    </div>
  );
}
