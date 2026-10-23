import { Link } from 'react-router-dom';
import Button from '../components/Button';
import SafeImage from '../components/SafeImage';
import { ArrowRight, ArrowUpRight, Leaf, Sparkles, Utensils } from '../components/Icons';
import { restaurant } from '../config';

export default function StoryPage() {
  const years = new Date().getFullYear() - restaurant.since;

  return (
    <>
      <section className="story-section section">
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
            <h1 className="display-sm mt-2">A kitchen that measures in patience, not minutes.</h1>
            <p className="lede mt-3">
              {restaurant.name} began with a family recipe book, a modest tandoor, and the belief that a good
              meal should slow the room down. We still cook that way.
            </p>
            <p className="story-section__body">
              This is a modern Indian kitchen in {restaurant.address.city}, but the rhythms are old: spices
              toasted until they smell right, dal left alone to deepen, rice sealed under dough so the saffron
              has time to settle in.
            </p>
            <div className="home-hero__actions mt-3">
              <Button as={Link} to="/menu" size="lg">
                Explore the menu
                <ArrowRight size={18} />
              </Button>
              <Link className="text-link" to="/#visit">
                Plan a visit
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="story-philosophy">
        <div className="section-head">
          <div className="section-head__copy">
            <p className="eyebrow">How we cook</p>
            <h2 id="story-philosophy" className="mt-2">
              Three things we refuse to hurry.
            </h2>
            <p className="lede">
              The menu travels across India, but the method stays close to home. These are the constants
              behind every plate.
            </p>
          </div>
        </div>

        <div className="ritual-grid">
          <article className="ritual-step">
            <span className="ritual-step__number" aria-hidden="true">01</span>
            <span className="ritual-step__icon" aria-hidden="true">
              <Leaf size={22} />
            </span>
            <h3>The spice shelf</h3>
            <p>
              Whole spices are toasted in small batches and ground in-house. Blends are built for balance,
              not heat alone, so the aroma arrives before the chilli does.
            </p>
          </article>
          <article className="ritual-step">
            <span className="ritual-step__number" aria-hidden="true">02</span>
            <span className="ritual-step__icon" aria-hidden="true">
              <Utensils size={22} />
            </span>
            <h3>The slow pot</h3>
            <p>
              Dal simmers overnight. Biryani is sealed under dough and opened at the pass. Curries are
              finished to order rather than parked under a lamp.
            </p>
          </article>
          <article className="ritual-step">
            <span className="ritual-step__number" aria-hidden="true">03</span>
            <span className="ritual-step__icon" aria-hidden="true">
              <Sparkles size={22} />
            </span>
            <h3>The table</h3>
            <p>
              A proper Indian table is generous and shared. We cook vegetarian and non-vegetarian dishes with
              the same care, and pack them to arrive warm.
            </p>
          </article>
        </div>

        <blockquote className="story-quote">
          “We don&rsquo;t rush a dish. We let it arrive when it&rsquo;s ready.”
          <footer>The kitchen at {restaurant.name}</footer>
        </blockquote>

        <div className="story-stats">
          <div>
            <strong>{years}</strong>
            <span>Years at the stove</span>
          </div>
          <div>
            <strong>Daily</strong>
            <span>Spices ground fresh</span>
          </div>
          <div>
            <strong>{restaurant.address.city}</strong>
            <span>Cooked and delivered locally</span>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="story-section__body">
          <p className="eyebrow eyebrow--plain">Come hungry</p>
          <h2 className="display-sm mt-2">The dining room is ready.</h2>
          <p className="lede mt-2">
            Walk in, call ahead, or order in. The kitchen is open Tuesday to Sunday for lunch and dinner, and
            closed on Mondays.
          </p>
          <div className="home-hero__actions mt-3">
            <Button as={Link} to="/menu" size="lg">
              Order for delivery
              <ArrowRight size={18} />
            </Button>
            <Link className="text-link" to="/#visit">
              Find us in {restaurant.address.city}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
