import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/manrope';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/dish.css';
import './styles/cart.css';
import './styles/pages.css';
import './styles/home.css';
import './styles/menu.css';
import './styles/checkout.css';
import './styles/order.css';
import './styles/admin.css';
import App from './App';
import { ToastProvider } from './context/ToastContext';
import { MenuProvider } from './context/MenuContext';
import { CartProvider } from './context/CartContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <MenuProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </MenuProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
