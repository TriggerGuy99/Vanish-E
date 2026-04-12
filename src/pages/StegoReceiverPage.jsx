import { useState, useRef } from 'react';
import CryptoJS from 'crypto-js';
import { C } from '../globals.js';
import { NeonInput, NeonButton, Cursor } from '../components/ui.jsx';
import { decodeMessageFromImage } from '../utils/steganography.js';

/* ─── StegoReceiverPage: upload stego PNG → extract → decrypt → reveal ─── */
export default function StegoReceiverPage() {
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState('');
  const [aesKey, setAesKey]       = useState('');
  const [phase, setPhase]         = useState('idle'); // idle | decoding | revealed | error
  const [plaintext, setPlaintext] = useState('');
  const [errMsg, setErrMsg]       = useState('');
  const [decodeLabel, setDecodeLabel] = useState('');
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhase('idle');
    setErrMsg('');
    setPlaintext('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhase('idle');
    setErrMsg('');
    setPlaintext('');
  };

  const handleDecode = async () => {
    if (!file || !aesKey.trim()) return;
    setPhase('decoding');
    setErrMsg('');

    const stages = [
      'READING PIXEL DATA...',
      'EXTRACTING LSB STREAM...',
      'RECONSTRUCTING CIPHERTEXT...',
      'DECRYPTING PAYLOAD...',
    ];
    let i = 0;
    setDecodeLabel(stages[0]);
    const labelTimer = setInterval(() => {
      i++;
      if (i < stages.length) setDecodeLabel(stages[i]);
    }, 400);

    try {
      // 1. Extract ciphertext from LSBs
      await new Promise(r => setTimeout(r, 300)); // let UI render first
      const ciphertext = await decodeMessageFromImage(file);

      await new Promise(r => setTimeout(r, 800)); // dramatic pause
      clearInterval(labelTimer);

      // 2. Decrypt with supplied AES key
      const bytes   = CryptoJS.AES.decrypt(ciphertext, aesKey.trim());
      const decoded = bytes.toString(CryptoJS.enc.Utf8);

      if (!decoded) {
        setErrMsg('DECRYPTION FAILED — KEY MISMATCH OR CORRUPTED PAYLOAD');
        setPhase('error');
        return;
      }

      setPlaintext(decoded);
      setPhase('revealed');
    } catch (err) {
      clearInterval(labelTimer);
      setErrMsg(err.message || 'UNKNOWN ERROR DURING EXTRACTION');
      setPhase('error');
    }
  };

  const reset = () => {
    setFile(null); setPreview(''); setAesKey('');
    setPhase('idle'); setPlaintext(''); setErrMsg('');
  };

  /* ── decoding animation ── */
  if (phase === 'decoding') {
    return (
      <div style={{ animation: 'fadeInUp 0.4s ease-out', textAlign: 'center', padding: '44px 0' }}>
        <div style={{ fontSize: '12px', color: C.gray, letterSpacing: '4px', marginBottom: '20px' }}>
          ── STEGO ANALYSIS IN PROGRESS ──
        </div>
        <div style={{
          fontSize: '18px', color: C.green, marginBottom: '28px',
          textShadow: `0 0 15px ${C.greenGlow}`,
          animation: 'flicker 1.5s infinite',
        }}>
          EXTRACTING PAYLOAD<Cursor />
        </div>
        <div style={{ width: '60%', margin: '0 auto 14px', height: '2px', background: '#111', border: `1px solid ${C.gray}33`, overflow: 'hidden' }}>
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(90deg, transparent, ${C.green}, transparent)`,
            animation: 'scanline 1s linear infinite',
          }} />
        </div>
        <div style={{ fontSize: '11px', color: C.gray, letterSpacing: '3px' }}>{decodeLabel}</div>
      </div>
    );
  }

  /* ── error view ── */
  if (phase === 'error') {
    return (
      <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <div style={{ border: `1px solid ${C.red}`, padding: '20px', background: 'rgba(255,34,68,0.06)', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: C.red, letterSpacing: '3px', marginBottom: '8px' }}>
            ⚠ EXTRACTION FAILED
          </div>
          <div style={{ fontSize: '11px', color: C.yellow, letterSpacing: '2px', lineHeight: 1.7 }}>
            {errMsg}
          </div>
        </div>
        <NeonButton id="btn-stego-retry" onClick={reset} variant="secondary">↻ RETRY</NeonButton>
      </div>
    );
  }

  /* ── revealed ── */
  if (phase === 'revealed') {
    return (
      <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '12px', color: C.green, letterSpacing: '4px' }}>
          ✓ STEGO PAYLOAD DECRYPTED
        </div>
        <div style={{
          border: `2px dashed ${C.green}`, padding: '24px',
          background: 'rgba(0,255,0,0.03)', marginBottom: '20px', position: 'relative',
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
        </div>
        <div style={{ border: `1px solid ${C.red}`, padding: '14px 18px', background: 'rgba(255,34,68,0.06)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: C.yellow, letterSpacing: '2px', lineHeight: 1.6 }}>
            ⚠ STEGO IMAGE IS LOCAL — NO SERVER RECORD EXISTS TO PURGE.
            DELETE THE IMAGE FILE MANUALLY AFTER READING.
          </div>
        </div>
        <NeonButton id="btn-stego-new" onClick={reset} variant="secondary">↻ DECODE ANOTHER</NeonButton>
      </div>
    );
  }

  /* ── idle ── */
  const canDecode = file && aesKey.trim();

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '4px', marginBottom: '20px' }}>
        ── STEGO IMAGE RECEIVER ──
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `1px dashed ${preview ? C.green : C.gray + '66'}`,
          background: preview ? 'rgba(0,255,0,0.03)' : 'rgba(0,255,0,0.01)',
          padding: preview ? '0' : '32px 16px',
          marginBottom: '16px',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Stego carrier"
            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block', filter: 'hue-rotate(100deg) saturate(0.4) brightness(0.7)' }}
          />
        ) : (
          <>
            <div style={{ fontSize: '20px', color: C.gray, marginBottom: '10px' }}>⊕</div>
            <div style={{ fontSize: '11px', color: C.gray, letterSpacing: '3px', marginBottom: '6px' }}>
              DROP STEGO IMAGE HERE
            </div>
            <div style={{ fontSize: '10px', color: C.gray, opacity: 0.5, letterSpacing: '2px' }}>
              OR CLICK TO SELECT FILE — PNG ONLY
            </div>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        id="input-stego-file"
        type="file"
        accept="image/png"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {preview && (
        <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '2px', marginBottom: '16px', opacity: 0.7 }}>
          ◈ FILE: {file?.name} ({(file?.size / 1024).toFixed(1)} KB)
        </div>
      )}

      {/* AES Key input */}
      <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '3px', marginBottom: '8px' }}>
        AES DECRYPTION KEY
      </div>
      <NeonInput
        id="input-stego-key"
        value={aesKey}
        onChange={setAesKey}
        placeholder="[ PASTE AES-256 KEY SHARED BY SENDER ]"
      />

      <NeonButton id="btn-stego-decode" onClick={handleDecode} disabled={!canDecode}>
        ⟐ EXTRACT &amp; DECRYPT PAYLOAD
      </NeonButton>

      <div style={{ marginTop: '16px', fontSize: '10px', color: C.gray, letterSpacing: '2px', lineHeight: 1.8, opacity: 0.6 }}>
        Upload the PNG image received from the sender. Enter the AES key they shared via a
        separate channel. No data is sent to any server — all processing is local.
      </div>
    </div>
  );
}
