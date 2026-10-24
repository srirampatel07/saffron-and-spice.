import { Outlet } from 'react-router-dom';
import CartDrawer from './CartDrawer';
import FloatingContact from './FloatingContact';
import Footer from './Footer';
import Navbar from './Navbar';
import ScrollToTop from './ScrollToTop';
import Seo from './Seo';

export default function Layout() {
  return (
    <div className="site-shell">
      <Seo />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="site-main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <FloatingContact />
      <CartDrawer />
      <ScrollToTop />
    </div>
  );
}
