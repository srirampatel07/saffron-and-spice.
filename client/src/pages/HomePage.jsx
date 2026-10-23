import { Link } from 'react-router-dom';
import Button from '../components/Button';
import DishCard from '../components/DishCard';
import SafeImage from '../components/SafeImage';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Leaf,
  MapPin,
  Phone,
  Sparkles,
  Truck,
  Utensils,
} from '../components/Icons';
import { restaurant } from '../config';
import { useMenu } from '../context/menu';
import { formatMoney } from '../lib/format';

function DishCardSkeleton() {
  return (
    <div className="dish-card dish-card--skeleton" aria-hidden="true">
      <div className="skeleton dish-card__skeleton-media" />
      <div className="dish-card__body">
        <div className="skeleton" style={{ width: '35%', height: '0.7rem' }} />
        <div className="skeleton mt-2" style={{ width: '75%', height: '1.4rem' }} />
        <div className="skeleton mt-2" style={{ width: '100%', height: '0.8rem' }} />
        <div className="skeleton mt-1" style={{ width: '85%', height: '0.8rem' }} />
        <div className="dish-card__footer mt-3">
          <div className="skeleton" style={{ width: '28%', height: '1.2rem' }} />
          <div className="skeleton" style={{ width: '28%', height: '2rem', borderRadius: '999px' }} />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { items, categories, isLoading, status, error, refresh } = useMenu();
  const currentYear = new Date().getFullYear();
  const years = currentYear - restaurant.since;
  const featured = items.filter((item) => item.isFeatured);
  const heroPick = featured.find((item) => item.isAvailable) || items.find((item) => item.isAvailable);
  const signatureDishes = (featured.length >= 4 ? featured : items).filter((item) => item.isAvailable).slice(0, 4);
  const addressQuery = encodeURIComponent(
    `${restaurant.address.line1}, ${restaurant.address.line2}, ${restaurant.address.city}`,
  );

  return (
    <>
      <section className="home-hero">
        <div className="container home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow">
              {restaurant.address.city} <span aria-hidden="true">·</span> Since {restaurant.since}
            </p>
            <h1 className="home-hero__title">
              The warmth of India,
              <br />
              <span className="italic home-hero__accent">plated.</span>
            </h1>
            <p className="lede home-hero__lede">
              Slow-cooked classics, hand-ground spice blends, and a table that always has room for one more.
              Delivered warm across {restaurant.address.city}.
            </p>
            <div className="home-hero__actions">
              <Button as={Link} to="/menu" size="lg">
                Order now
                <ArrowRight size={18} />
              </Button>
              <a className="text-link" href="#story">
                Our kitchen story
                <ArrowUpRight size={16} />
              </a>
            </div>
            <ul className="home-hero__notes" aria-label="What to expect">
              <li>
                <Leaf size={15} /> Hand-ground masalas
              </li>
              <li>
                <Sparkles size={15} /> Cooked to order
              </li>
              <li>
                <Truck size={15} /> Delivered warm
              </li>
            </ul>
          </div>

          <div className="home-hero__visual">
            <div className="hero-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="hero-frame">
              <SafeImage
                src="/images/hero-thali-800.webp"
                srcSet="/images/hero-thali-640.webp 640w, /images/hero-thali-800.webp 800w, /images/hero-thali-1120.webp 1120w, /images/hero-thali.webp 1920w"
                sizes="(max-width: 720px) 92vw, (max-width: 1100px) 46vw, 34rem"
                fallbackSrc="/images/hero-thali.svg"
                alt="An overhead Indian thali with butter chicken, dal makhani, seasonal vegetables, raita and saffron rice"
                width="1920"
                height="2400"
              />
              <span className="hero-frame__shade" aria-hidden="true" />
            </div>
            <div className="hero-seal" aria-hidden="true">
              <span>Since</span>
              <strong>{restaurant.since}</strong>
              <span>Bengaluru</span>
            </div>
            {heroPick ? (
              <Link to="/menu" className="hero-dish-card">
                <span className="hero-dish-card__eyebrow">Tonight&rsquo;s table</span>
                <span className="hero-dish-card__name">{heroPick.name}</span>
                <span className="hero-dish-card__meta">
                  {formatMoney(heroPick.pricePaise)} · {heroPick.categoryName}
                </span>
                <span className="hero-dish-card__arrow" aria-hidden="true">
                  <ArrowUpRight size={17} />
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="values-strip" aria-label="Why order from us">
        <div className="container values-strip__inner">
          <div className="values-strip__item">
            <Leaf size={20} />
            <div>
              <strong>Ground fresh, daily</strong>
              <span>Small-batch masalas, no shortcuts</span>
            </div>
          </div>
          <div className="values-strip__item">
            <Utensils size={20} />
            <div>
              <strong>A proper Indian table</strong>
              <span>Regional classics, vegetarian and not</span>
            </div>
          </div>
          <div className="values-strip__item">
            <Truck size={20} />
            <div>
              <strong>Free delivery over ₹{restaurant.freeDeliveryThreshold}</strong>
              <span>Packed to arrive warm, never rushed</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container home-featured">
        <div className="section-head">
          <div className="section-head__copy">
            <p className="eyebrow">From our kitchen</p>
            <h2 className="mt-2">Dishes worth gathering for.</h2>
            <p className="lede">
              The plates our regulars order before they even open the menu. Start here, then wander.
            </p>
          </div>
          <div className="section-head__aside">
            <Link className="text-link" to="/menu">
              See the full menu
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {status === 'error' ? (
          <div className="notice notice--warning">
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={refresh} className="ml-auto">
              Try again
            </Button>
          </div>
        ) : (
          <div className="dish-grid dish-grid--featured">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => <DishCardSkeleton key={index} />)
              : signatureDishes.map((dish) => <DishCard key={dish.id} dish={dish} compact />)}
          </div>
        )}

        <p className="home-featured__note">
          {categories.length > 0 ? `${items.length} dishes across ${categories.length} corners of India.` : 'Explore the full menu.'}
        </p>
      </section>

      <section id="story" className="story-section section">
        <div className="container story-section__grid">
          <div className="story-section__media">
            <div className="arch-frame arch-frame--portrait">
              <SafeImage
                src="/images/story-spice-720.webp"
                srcSet="/images/story-spice-480.webp 480w, /images/story-spice-720.webp 720w, /images/story-spice.webp 900w"
                sizes="(max-width: 720px) 88vw, 29rem"
                fallbackSrc="/images/story-spice.svg"
                alt="Bowls of turmeric, chilli, cardamom and whole spices at a spice market"
                width="900"
                height="1100"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="story-plaque">
              <span className="story-plaque__mark" aria-hidden="true">
                <Sparkles size={17} />
              </span>
              <p>
                <strong>Ground each morning</strong>
                <span>Eleven spice blends, one small kitchen.</span>
              </p>
            </div>
          </div>
          <div className="story-section__copy">
            <p className="eyebrow">Our story</p>
            <h2 className="mt-2">A kitchen that measures in patience, not minutes.</h2>
            <p className="lede mt-3">
              {restaurant.name} began with a family recipe book, a modest tandoor, and the belief that a good
              meal should slow the room down. We still cook that way.
            </p>
            <p className="story-section__body">
              Masalas are roasted and ground in-house. Dal simmers overnight. Biryani is sealed under dough and
              opened only when the saffron has had time to settle in. Nothing leaves the pass until it tastes
              like it came from a home, not a production line.
            </p>
            <blockquote className="story-quote">
              “We don&rsquo;t rush a dish. We let it arrive when it&rsquo;s ready.”
              <footer>The kitchen at {restaurant.name}</footer>
            </blockquote>
            <div className="mt-3">
              <Link className="text-link" to="/story">
                Read the full story
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="story-stats">
              <div>
                <strong>{years}</strong>
                <span>Years at the stove</span>
              </div>
              <div>
                <strong>{isLoading ? '—' : items.length}</strong>
                <span>Dishes on the menu</span>
              </div>
              <div>
                <strong>Daily</strong>
                <span>Spices ground fresh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container ritual-section">
        <div className="ritual-section__head">
          <p className="eyebrow eyebrow--plain">The ritual</p>
          <h2>From our stove to your table.</h2>
        </div>
        <ol className="ritual-grid">
          <li className="ritual-step">
            <span className="ritual-step__number" aria-hidden="true">01</span>
            <span className="ritual-step__icon" aria-hidden="true">
              <Utensils size={22} />
            </span>
            <h3>Choose your feast</h3>
            <p>Wander through regional favourites, add what tempts you, and build a table worth sharing.</p>
          </li>
          <li className="ritual-step">
            <span className="ritual-step__number" aria-hidden="true">02</span>
            <span className="ritual-step__icon" aria-hidden="true">
              <Sparkles size={22} />
            </span>
            <h3>We cook to order</h3>
            <p>Nothing sits under a lamp. Tandoors are lit, spices are bloomed, and your order is cooked fresh.</p>
          </li>
          <li className="ritual-step">
            <span className="ritual-step__number" aria-hidden="true">03</span>
            <span className="ritual-step__icon" aria-hidden="true">
              <Truck size={22} />
            </span>
            <h3>Delivered warm</h3>
            <p>Packed with care and sent straight from the pass, with a tracking link so you know when to set the table.</p>
          </li>
        </ol>
      </section>

      <section id="visit" className="visit-section section">
        <div className="container visit-section__grid">
          <div className="visit-section__media">
            <SafeImage
              src="/images/visit-room-960.webp"
              srcSet="/images/visit-room-640.webp 640w, /images/visit-room-960.webp 960w, /images/visit-room.webp 1200w"
              sizes="(max-width: 720px) 92vw, (max-width: 1100px) 46vw, 34rem"
              fallbackSrc="/images/visit-room.svg"
              alt={`Warmly lit dining arches, pendant lamps and set tables at ${restaurant.name}`}
              width="1200"
              height="900"
              loading="lazy"
              decoding="async"
            />
            <div className="visit-section__badge">
              <Check size={15} aria-hidden="true" />
              Dine-in &amp; takeaway
            </div>
          </div>
          <div className="visit-section__card">
            <p className="eyebrow">Visit us</p>
            <h2>Pull up a chair in the heart of the city.</h2>
            <p className="visit-section__intro">
              Tucked off Lavelle Road, our dining room stays warm late into the evening. Walk in, call ahead, or
              order in — the kitchen is ready either way.
            </p>
            <div className="visit-details">
              <div className="visit-details__item">
                <MapPin size={18} aria-hidden="true" />
                <div>
                  <strong>{restaurant.address.line1}, {restaurant.address.line2}</strong>
                  <span>
                    {restaurant.address.city}, {restaurant.address.state} {restaurant.address.pincode}
                  </span>
                  <a
                    className="text-link text-link--small"
                    href={`https://www.google.com/maps/search/?api=1&query=${addressQuery}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
              <div className="visit-details__hours">
                {restaurant.hours.map((slot) => (
                  <div key={slot.service}>
                    <span>{slot.service}</span>
                    <strong>{slot.time}</strong>
                    <span>{slot.days}</span>
                  </div>
                ))}
                <p className="visit-details__note">{restaurant.closedNote}</p>
              </div>
            </div>
            <div className="visit-section__actions">
              <Button as="a" href={`tel:${restaurant.phoneHref}`} variant="secondary">
                <Phone size={16} />
                Call to reserve
              </Button>
              <Button as={Link} to="/menu">
                Order in
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="cta-band">
          <div className="cta-band__ornament" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="cta-band__copy">
            <p className="eyebrow eyebrow--plain">The tandoor is lit</p>
            <h2>Hungry yet?</h2>
            <p>Let&rsquo;s make it a feast. Your table, delivered.</p>
          </div>
          <Button as={Link} to="/menu" variant="gold" size="lg">
            Order now
            <ArrowRight size={18} />
          </Button>
        </div>
      </section>
    </>
  );
}
