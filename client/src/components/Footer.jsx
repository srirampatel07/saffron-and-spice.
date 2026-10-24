import { Link } from 'react-router-dom';
import Brand from './Brand';
import { MapPin, Phone, WhatsApp } from './Icons';
import { restaurant } from '../config';
import { getTelHref, getWhatsAppHref } from '../lib/contact';

export default function Footer() {
  const year = new Date().getFullYear();
  const { address } = restaurant;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Brand inverted />
            <p className="footer__tagline">{restaurant.shortDescription}</p>
            <p className="footer__hours mt-3">
              <strong>{restaurant.deliveryRadius}</strong>
            </p>
          </div>

          <div>
            <h2 className="footer__heading">Explore</h2>
            <ul className="footer__list">
              <li>
                <Link className="footer__link" to="/menu">
                  Full menu
                </Link>
              </li>
              <li>
                <Link className="footer__link" to="/story">
                  Our story
                </Link>
              </li>
              <li>
                <Link className="footer__link" to="/track">
                  Track an order
                </Link>
              </li>
              <li>
                <Link className="footer__link" to="/credits">
                  Photo credits
                </Link>
              </li>
              <li>
                <Link className="footer__link" to="/admin">
                  Staff admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="footer__heading">Visit</h2>
            <ul className="footer__list">
              <li className="footer__text">
                <span className="inline">
                  <MapPin size={15} />
                  {address.line1}, {address.line2}
                </span>
              </li>
              <li className="footer__text">
                {address.city}, {address.state} {address.pincode}
              </li>
              <li className="footer__text mt-1">{restaurant.deliveryRadius}</li>
            </ul>
          </div>

          <div>
            <h2 className="footer__heading">Hours &amp; contact</h2>
            <div className="footer__list">
              {restaurant.hours.map((slot) => (
                <div className="footer__hours" key={slot.service}>
                  <span>{slot.service}</span>
                  <strong>{slot.time}</strong>
                  <span>{slot.days}</span>
                </div>
              ))}
              <div className="footer__hours">
                <span>{restaurant.closedNote}</span>
              </div>
              <div className="footer__contact-actions">
                <a
                  className="footer__action footer__action--whatsapp"
                  href={getWhatsAppHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with Saffron & Spice on WhatsApp"
                >
                  <WhatsApp size={16} />
                  WhatsApp
                </a>
                <a className="footer__action" href={getTelHref()}>
                  <Phone size={16} />
                  {restaurant.phone}
                </a>
              </div>
              <a className="footer__link" href={`mailto:${restaurant.email}`}>
                {restaurant.email}
              </a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            © {year} {restaurant.name}. All rights reserved.
          </p>
          <p className="footer__ornament">Cooked with care in Bengaluru</p>
        </div>
      </div>
    </footer>
  );
}
