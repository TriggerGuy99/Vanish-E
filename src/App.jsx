import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { injectKeyframes, C } from './globals.js';
import { MatrixRain, Scanline } from './components/ui.jsx';
import { Navbar, Footer } from './components/Layout.jsx';
import SenderPage      from './pages/SenderPage.jsx';
import ReceiverPage    from './pages/ReceiverPage.jsx';
import AdminLogin      from './pages/AdminLogin.jsx';
import AdminDashboard  from './pages/AdminDashboard.jsx';
import StegoReceiverPage from './pages/StegoReceiverPage.jsx';

export default function App() {
  useEffect(() => {
    injectKeyframes();
  }, []);

  return (
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
              </Routes>
            </main>

            <Footer />
          </div>
        </>
      } />
    </Routes>
  );
}
