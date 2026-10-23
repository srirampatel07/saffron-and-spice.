import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import CreditsPage from './pages/CreditsPage';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import NotFoundPage from './pages/NotFoundPage';
import StoryPage from './pages/StoryPage';
import TrackOrderPage from './pages/TrackOrderPage';

// Private screens are not prerendered, so keeping them out of the initial
// bundle reduces the JavaScript needed for the public menu and home page.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));

function RouteFallback() {
  return (
    <div className="container section" aria-busy="true">
      <p className="sr-only">Loading page…</p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="story" element={<StoryPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order/:orderNumber" element={<OrderConfirmationPage />} />
          <Route path="track" element={<TrackOrderPage />} />
          <Route path="credits" element={<CreditsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
