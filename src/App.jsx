import { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { injectKeyframes, C } from './globals.js';
import { MatrixRain, Scanline } from './components/ui.jsx';
import { Navbar, Footer } from './components/Layout.jsx';
import SenderPage      from './pages/SenderPage.jsx';
import ReceiverPage    from './pages/ReceiverPage.jsx';
import AdminLogin      from './pages/AdminLogin.jsx';
import AdminDashboard  from './pages/AdminDashboard.jsx';
import StegoReceiverPage from './pages/StegoReceiverPage.jsx';
import HowToUsePage      from './pages/HowToUsePage.jsx';
import useDynamicFavicon from './utils/useDynamicFavicon.js';

const FloatingNav = () => {
  const { pathname } = useLocation();
  const isHowToUse = pathname === '/how-to-use';
  if (pathname.startsWith('/admin')) return null;

  return (
    <Link
      to={isHowToUse ? '/' : '/how-to-use'}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.8)',
        border: `1px solid ${C.green}`,
        color: C.green,
        padding: '8px 16px',
        fontFamily: '"Fira Code", monospace',
        fontSize: '12px',
        textDecoration: 'none',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        boxShadow: `0 0 10px ${C.greenGlow}`,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(0, 255, 0, 0.1)';
        e.currentTarget.style.boxShadow = `0 0 16px ${C.greenGlow}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
        e.currentTarget.style.boxShadow = `0 0 10px ${C.greenGlow}`;
      }}
    >
      {isHowToUse ? '[ ⟵ RETURN TO TERMINAL ]' : '[ ? HOW TO USE / PLAYGROUND ]'}
    </Link>
  );
};

export default function App() {
  useDynamicFavicon();

  useEffect(() => {
    injectKeyframes();
  }, []);

  return (
    <>
      <FloatingNav />
      <Routes>
      {/* ── Admin routes: full-viewport, own design system ── */}
      <Route path="/admin"           element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* ── Public routes: hacker layout shell ── */}
      <Route path="*" element={
        <>
          <MatrixRain />
          <Scanline />

          {/* content layer */}
          <div style={{
            maxWidth: '660px',
            margin: '0 auto',
            padding: '0 24px 40px',
            position: 'relative',
            zIndex: 1,
          }}>
            {/* persistent nav bar — always visible */}
            <Navbar />

            {/* routed page content */}
            <main style={{
              border: `1px solid ${C.gray}33`,
              padding: '28px 24px',
              background: 'rgba(0,255,0,0.04)',
              minHeight: '320px',
              marginTop: '0',
            }}>
              <Routes>
                <Route path="/"           element={<SenderPage />}       />
                <Route path="/drop/:id"   element={<ReceiverPage />}     />
                <Route path="/drop/"      element={<ReceiverPage />}     />
                <Route path="/stego-drop" element={<StegoReceiverPage />} />
                <Route path="/how-to-use" element={<HowToUsePage />}     />
              </Routes>
            </main>

            <Footer />
          </div>
        </>
      } />
    </Routes>
    </>
  );
}
