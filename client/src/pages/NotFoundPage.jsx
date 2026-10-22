import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { ArrowRight, Utensils } from '../components/Icons';
import usePageTitle from '../lib/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <section className="section container">
      <div className="empty-state not-found">
        <span className="empty-state__icon" aria-hidden="true">
          <Utensils size={26} />
        </span>
        <p className="eyebrow eyebrow--plain">404</p>
        <h1 className="display-sm mt-2">This table isn&rsquo;t set.</h1>
        <p>The page you&rsquo;re looking for has moved or never existed. Let&rsquo;s get you back to the good stuff.</p>
        <div className="not-found__actions">
          <Button as={Link} to="/menu">
            Explore the menu
            <ArrowRight size={16} />
          </Button>
          <Button as={Link} to="/" variant="secondary">
            Back home
          </Button>
        </div>
      </div>
    </section>
  );
}
