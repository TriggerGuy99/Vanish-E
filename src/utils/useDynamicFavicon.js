import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useDynamicFavicon() {
  const location = useLocation();

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    
    // Switch between admin (red) and public (green) favicons
    if (location.pathname.startsWith('/admin')) {
      link.href = '/admin-favicon.svg';
    } else {
      link.href = '/favicon.svg';
    }
  }, [location.pathname]);
}
