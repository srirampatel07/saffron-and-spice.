import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import DishCard from '../components/DishCard';
import { ArrowRight, Close, Search, Sparkles } from '../components/Icons';
import { useCart } from '../context/cart';
import { useMenu } from '../context/menu';
import { formatMoney, pluralize } from '../lib/format';
import usePageTitle from '../lib/usePageTitle';

function CardSkeleton() {
  return (
    <div className="dish-card dish-card--skeleton" aria-hidden="true">
      <div className="skeleton dish-card__skeleton-media" />
      <div className="dish-card__body">
        <div className="skeleton" style={{ width: '40%', height: '0.7rem' }} />
        <div className="skeleton mt-2" style={{ width: '70%', height: '1.4rem' }} />
        <div className="skeleton mt-2" style={{ width: '100%', height: '0.8rem' }} />
        <div className="skeleton mt-1" style={{ width: '80%', height: '0.8rem' }} />
        <div className="dish-card__footer mt-3">
          <div className="skeleton" style={{ width: '30%', height: '1.2rem' }} />
          <div className="skeleton" style={{ width: '28%', height: '2rem', borderRadius: '999px' }} />
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  usePageTitle('Menu');
  const { categories, items, isLoading, status, error, refresh } = useMenu();
  const cart = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const selectedCategory = categories.some((category) => category.slug === categoryParam) ? categoryParam : 'all';
  const [query, setQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (vegOnly && !item.isVeg) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.categoryName.toLowerCase().includes(term)
      );
    });
  }, [items, selectedCategory, vegOnly, query]);

  const setCategory = (slug) => {
    const next = new URLSearchParams(searchParams);
    if (slug === 'all') next.delete('category');
    else next.set('category', slug);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setQuery('');
    setVegOnly(false);
    setCategory('all');
  };

  const filtersActive = query.trim() !== '' || vegOnly || selectedCategory !== 'all';
  const totalItems = items.length;

  return (
    <>
      <section className="menu-hero">
        <div className="container menu-hero__inner">
          <div className="menu-hero__copy">
            <p className="eyebrow">The menu</p>
            <h1>A feast, in every direction.</h1>
            <p className="lede">
              Six corners of India, one kitchen. Every dish is cooked to order and priced in INR — add what
              tempts you and we&rsquo;ll take it from there.
            </p>
          </div>
          <div className="menu-hero__note">
            <span className="menu-hero__note-icon" aria-hidden="true">
              <Sparkles size={19} />
            </span>
            <p>
              <strong>Chef&rsquo;s picks are marked.</strong>
              <span>Everything else is worth discovering too.</span>
            </p>
          </div>
        </div>
      </section>

      <section className="menu-catalogue section section--tight" aria-labelledby="menu-heading">
        <div className="container">
          <h2 id="menu-heading" className="sr-only">
            Browse dishes
          </h2>

          <div className="menu-toolbar">
            <div className="menu-categories" role="group" aria-label="Filter by category">
              <button
                type="button"
                className={`filter-chip${selectedCategory === 'all' ? ' filter-chip--active' : ''}`}
                aria-pressed={selectedCategory === 'all'}
                onClick={() => setCategory('all')}
              >
                All dishes
                <span className="filter-chip__count">{totalItems}</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  className={`filter-chip${selectedCategory === category.slug ? ' filter-chip--active' : ''}`}
                  aria-pressed={selectedCategory === category.slug}
                  onClick={() => setCategory(category.slug)}
                >
                  {category.name}
                  <span className="filter-chip__count">{category.count}</span>
                </button>
              ))}
            </div>

            <div className="menu-controls">
              <div className="search-field">
                <Search size={18} aria-hidden="true" />
                <label className="sr-only" htmlFor="menu-search">
                  Search dishes
                </label>
                <input
                  id="menu-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search biryani, paneer, kebab…"
                  autoComplete="off"
                />
                {query ? (
                  <button
                    type="button"
                    className="search-field__clear"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  >
                    <Close size={15} />
                  </button>
                ) : null}
              </div>

              <label className="veg-switch">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(event) => setVegOnly(event.target.checked)}
                />
                <span className="veg-switch__track" aria-hidden="true">
                  <span />
                </span>
                <span>Vegetarian only</span>
              </label>
            </div>
          </div>

          <div className="menu-results-bar">
            <p aria-live="polite">
              {isLoading ? (
                'Setting the table…'
              ) : (
                <>
                  <strong>{filtered.length}</strong> {filtered.length === 1 ? 'dish' : 'dishes'}
                  {selectedCategory !== 'all' ? (
                    <>
                      {' '}
                      in <strong>{categories.find((category) => category.slug === selectedCategory)?.name}</strong>
                    </>
                  ) : null}
                </>
              )}
            </p>
            {filtersActive ? (
              <button type="button" className="text-button" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <span className="menu-results-bar__note">All prices in INR · GST added at checkout</span>
            )}
          </div>

          {status === 'error' ? (
            <div className="menu-error">
              <p className="eyebrow">The kitchen is quiet</p>
              <h2>We couldn&rsquo;t load the menu.</h2>
              <p>{error}</p>
              <Button onClick={refresh} className="mt-3">
                Try again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="dish-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state menu-empty">
              <span className="empty-state__icon" aria-hidden="true">
                <Search size={24} />
              </span>
              <h2>No dishes match that search.</h2>
              <p>Try a different craving, or clear the filters to see the whole table.</p>
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="dish-grid">
              {filtered.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          )}

          {!isLoading && filtered.length > 0 ? (
            <div className="menu-footnote">
              <Badge tone="saffron">
                <Sparkles size={12} aria-hidden="true" />
                Cooked fresh
              </Badge>
              <p>
                Please tell us about allergies in the order notes. Our kitchen handles nuts, dairy and gluten.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {cart.count > 0 ? (
        <div className="mobile-cart-bar">
          <div>
            <span>{pluralize(cart.count, 'item')}</span>
            <strong>{formatMoney(cart.totalPaise)}</strong>
          </div>
          <Button onClick={cart.openCart} size="sm">
            View order
            <ArrowRight size={16} />
          </Button>
        </div>
      ) : null}
    </>
  );
}
