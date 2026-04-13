import { useState, useEffect, useRef } from 'react';
import { C } from '../globals.js';
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

export default function HowToUsePage() {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(500);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.floor(entry.contentRect.width));
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const sampleText = `[ VANISH-E SYSTEM CAPABILITIES ]
This text is dynamically formatted and measured via the '@chenglou/pretext' library. It avoids DOM reflows entirely by rendering via pure JS arithmetic! Try resizing this window to observe real-time repaints without costly node measurements.

FEATURE MATRIX:
■ AES-256 Client-Side Encryption
■ Invisible Network Traffic (Level 2)
■ Active Defense Mechanisms (Level 3)
■ Zero Logs, Zero Telemetry

"Encryption is the ultimate asymmetric defense. It takes a fraction of a second to lock data, but lifetimes to crack it."`;

  const prepared = prepareWithSegments(sampleText, '12px "Fira Code", monospace', { whiteSpace: 'pre-wrap' });
  // Add 40px padding to give some breathing room
  const layouted = layoutWithLines(prepared, Math.max(300, containerWidth - 40), 22);

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out', color: C.green, fontFamily: '"Fira Code", monospace' }}>
      
      <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '4px', marginBottom: '24px' }}>
        ── OPERATIONAL FIELD MANUAL ──
      </div>

      <h2 style={{ fontSize: 'clamp(20px, 3vw, 24px)', color: C.green, textShadow: `0 0 10px ${C.greenGlow}`, marginTop: 0, letterSpacing: '2px' }}>
        [ CLEARANCE PROTOCOLS ]
      </h2>

      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.8 }}>
          Vanish-E operates on a trustless, zero-knowledge architecture. All payloads are encrypted locally on your device. The server only ever handles scrambled ciphertext and possesses absolutely zero ability to decrypt it. Below are the three active transmission methods available.
        </p>
      </div>

      {/* Level 1 */}
      <div style={{ borderLeft: `2px solid ${C.green}`, marginBottom: '24px', background: 'rgba(0,255,0,0.02)', padding: '20px' }}>
        <h3 style={{ fontSize: '14px', color: C.green, margin: '0 0 12px 0', letterSpacing: '2px' }}>LEVEL 1: LINK-DROP</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#aaa', lineHeight: 1.7 }}>
          Standard operation. Your message is encrypted locally via AES-256 before leaving your machine. The decryption key is attached to the URL hash fragment. Because of how browsers operate, the server never receives this fragment.
        </p>
        <div style={{ fontSize: '11px', color: C.gray, lineHeight: 1.6 }}>
          <strong style={{ color: C.green }}>Recommended Use Cases:</strong> Sharing secure passwords, API tokens, IP addresses, or sensitive client data that needs to be wiped after a single viewing.
        </div>
      </div>

      {/* Level 2 */}
      <div style={{ borderLeft: `2px solid ${C.green}`, marginBottom: '24px', background: 'rgba(0,255,0,0.02)', padding: '20px' }}>
        <h3 style={{ fontSize: '14px', color: C.green, margin: '0 0 12px 0', letterSpacing: '2px' }}>LEVEL 2: STEGO-DROP</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#aaa', lineHeight: 1.7 }}>
          Advanced obfuscation. The AES-256 ciphertext is mathematically embedded inside the least significant bits (LSB) of a carrier image. This requires the sender and recipient to share the image and key via an alternative channel.
        </p>
        <div style={{ fontSize: '11px', color: C.gray, lineHeight: 1.6 }}>
          <strong style={{ color: C.green }}>Recommended Use Cases:</strong> Whistleblower document drops, bypassing Deep Packet Inspection (DPI) firewalls, or transmitting encrypted data with plausible deniability.
        </div>
      </div>

      {/* Level 3 */}
      <div style={{ borderLeft: `2px solid ${C.yellow}`, marginBottom: '40px', background: 'rgba(255,255,0,0.03)', padding: '20px' }}>
        <h3 style={{ fontSize: '14px', color: C.yellow, margin: '0 0 12px 0', letterSpacing: '2px', textShadow: '0 0 8px rgba(255,255,0,0.2)' }}>LEVEL 3: DURESS PROTOCOL</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#aaa', lineHeight: 1.7 }}>
          Coercion defense. You author two messages: a real payload and an innocent decoy. Both are encrypted separately, but share identical identifiers. You are issued two links. If intercepted and forced to decrypt the message, you surrender the decoy link. The vault is immediately purged, maintaining the security of the real payload.
        </p>
        <div style={{ fontSize: '11px', color: C.gray, lineHeight: 1.6 }}>
          <strong style={{ color: C.yellow }}>Recommended Use Cases:</strong> Interrogation resistance, hostile border crossings, or operative zones where refusing to decrypt is lethally dangerous.
        </div>
      </div>

      {/* Pretext rendering demo */}
      <div style={{ fontSize: '10px', color: C.gray, letterSpacing: '3px', marginBottom: '16px' }}>
        ── PRETEXT ENGINE RENDER DEMO ──
      </div>
      
      <div 
        ref={containerRef}
        style={{ 
          border: `1px solid ${C.gray}55`, 
          background: '#050505', 
          position: 'relative',
          height: layouted.height + 40,
          overflow: 'hidden'
        }}
      >
        {layouted.lines.map((line, i) => (
          <div 
            key={i} 
            style={{ 
              position: 'absolute', 
              top: 20 + i * 22, 
              left: 20,
              fontSize: '12px',
              color: i === 0 ? C.green : '#999',
              whiteSpace: 'pre',
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
      <div style={{ fontSize: '9px', color: C.gray, opacity: 0.5, letterSpacing: '1px', marginTop: '8px', textAlign: 'right' }}>
        * RESIZE BROWSER TO SEE PRETEXT RECOMPUTE TEXT FLOW *
      </div>

    </div>
  );
}
