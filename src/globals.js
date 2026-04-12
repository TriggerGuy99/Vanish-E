/* ─── colour tokens ─── */
export const C = {
  bg:        '#050505',
  green:     '#00ff00',
  greenDim:  '#00cc00',
  greenGlow: 'rgba(0,255,0,0.35)',
  gray:      '#555',
  grayLight: '#888',
  red:       '#ff2244',
  yellow:    '#ffd600',
  panel:     'rgba(0,255,0,0.04)',
};

/* ─── keyframes injected once into <head> ─── */
export const injectKeyframes = () => {
  if (document.getElementById('vanish-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'vanish-keyframes';
  style.textContent = `
    @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
    @keyframes scanline {
      0%{transform:translateY(-100%)}
      100%{transform:translateY(100vh)}
    }
    @keyframes fadeInUp {
      from{opacity:0;transform:translateY(18px)}
      to{opacity:1;transform:translateY(0)}
    }
    @keyframes flicker {
      0%,19%,21%,23%,25%,54%,56%,100%{opacity:1}
      20%,24%,55%{opacity:0.4}
    }
    @keyframes pulseGlow {
      0%,100%{box-shadow:0 0 8px rgba(0,255,0,0.3), inset 0 0 8px rgba(0,255,0,0.05)}
      50%{box-shadow:0 0 20px rgba(0,255,0,0.6), inset 0 0 20px rgba(0,255,0,0.1)}
    }
    @keyframes matrixRain {
      0%{transform:translateY(-100%);opacity:1}
      100%{transform:translateY(100vh);opacity:0}
    }
    @keyframes spin {
      from{transform:rotate(0deg)} to{transform:rotate(360deg)}
    }
    ::selection { background: rgba(0,255,0,0.3); color: #00ff00; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #050505; }
    ::-webkit-scrollbar-thumb { background: #00ff0044; border-radius: 0; }
    ::-webkit-scrollbar-thumb:hover { background: #00ff0088; }
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      background: #050505;
      font-family: "Fira Code", monospace;
      color: #00ff00;
      min-height: 100vh;
    }
  `;
  document.head.appendChild(style);
};
