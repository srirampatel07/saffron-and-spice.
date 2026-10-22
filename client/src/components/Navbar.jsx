import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Brand from './Brand';
import Button from './Button';
import { Bag, Close, MenuIcon, Sparkles } from './Icons';
import { restaurant } from '../config';
import { useCart } from '../context/cart';

const navLinks = [
  { to: '/menu', label: 'Menu' },
  { to: '/#story', label: 'Our story' },
  { to: '/#visit', label: 'Visit us' },
  { to: '/track', label: 'Track order' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef(null);
  const panelRef = useRef(null);
  const location = useLocation();
  const cart = useCart();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const firstLink = panelRef.current?.querySelector('a, button');
    firstLink?.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (cart.isOpen) setOpen(false);
  }, [cart.isOpen]);

  return (
    <>
      <div className="announcement">
        <p>
          <Sparkles size={13} />
          Freshly ground masalas
          <span aria-hidden="true">·</span>
          Free delivery over ₹{restaurant.freeDeliveryThreshold}
        </p>
      </div>
      <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
        <div className="container header__inner">
          <Brand />
          <nav className="nav" aria-label="Primary">
            {navLinks.map((link) =>
              link.to.includes('#') ? (
                <Link key={link.to} to={link.to} className="nav__link">
                  {link.label}
                </Link>
              ) : (
                <NavLink key={link.to} to={link.to} className="nav__link">
                  {link.label}
                </NavLink>
              ),
            )}
          </nav>
          <div className="header__actions">
            <button
              type="button"
              className={`cart-button${cart.count > 0 ? ' cart-button--filled' : ''}`}
              onClick={() => {
                setOpen(false);
                cart.openCart();
              }}
              aria-label={`Open cart${cart.count > 0 ? `, ${cart.count} items` : ', empty'}`}
            >
              <Bag size={18} />
              <span className="cart-button__label">Cart</span>
              {cart.count > 0 ? (
                <span className="cart-button__count" aria-hidden="true">
                  {cart.count}
                </span>
              ) : null}
            </button>
            <button
              ref={toggleRef}
              type="button"
              className="mobile-toggle"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <Close /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <div ref={panelRef} id="mobile-navigation" className={`mobile-nav container${open ? ' mobile-nav--open' : ''}`}>
          {open ? (
            <>
              <nav aria-label="Mobile">
                <div className="mobile-nav__links">
                  {navLinks.map((link) => (
                    <Link key={link.to} to={link.to} className="mobile-nav__link" onClick={() => setOpen(false)}>
                      {link.label}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ))}
                </div>
              </nav>
              <div className="mobile-nav__footer">
                <a className="mobile-nav__phone" href={`tel:${restaurant.phoneHref}`}>
                  {restaurant.phone}
                </a>
                <Button as={Link} to="/menu" size="sm" onClick={() => setOpen(false)}>
                  Order now
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </header>
    </>
  );
}
