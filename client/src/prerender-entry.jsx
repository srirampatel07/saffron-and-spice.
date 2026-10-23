import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { MenuProvider } from './context/MenuContext';
import { ToastProvider } from './context/ToastContext';

export function renderPage(url, initialMenu) {
  return renderToString(
    <StaticRouter location={url}>
      <ToastProvider>
        <MenuProvider initialMenu={initialMenu}>
          <CartProvider>
            <App />
          </CartProvider>
        </MenuProvider>
      </ToastProvider>
    </StaticRouter>,
  );
}
