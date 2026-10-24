import { useLocation } from 'react-router-dom';
import { restaurant } from '../config';
import { useCart } from '../context/cart';
import { getTelHref, getWhatsAppHref, shouldShowFloatingContact } from '../lib/contact';
import { Phone, WhatsApp } from './Icons';

export default function FloatingContact() {
  const { pathname } = useLocation();
  const cart = useCart();

  if (!shouldShowFloatingContact(pathname, { cartOpen: cart.isOpen })) return null;

  return (
    <div className="floating-contact" role="group" aria-label="Contact Saffron & Spice">
      <a
        className="floating-contact__button floating-contact__button--whatsapp"
        href={getWhatsAppHref()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Saffron & Spice on WhatsApp"
        title="Chat on WhatsApp"
      >
        <WhatsApp size={24} />
      </a>
      <a
        className="floating-contact__button floating-contact__button--call"
        href={getTelHref()}
        aria-label={`Call Saffron & Spice at ${restaurant.phone}`}
        title={`Call ${restaurant.phone}`}
      >
        <Phone size={22} />
      </a>
    </div>
  );
}
