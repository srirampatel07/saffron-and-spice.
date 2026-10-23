import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import {
  AlertCircle,
  ArrowRight,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Utensils,
} from '../components/Icons';
import { restaurant } from '../config';
import { useToast } from '../context/toast';
import { api } from '../lib/api';
import { formatDateTime, formatMoney, formatPhone, pluralize } from '../lib/format';
import {
  ORDER_FLOW,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
} from '../lib/orderStatus';
import usePublicConfig from '../lib/usePublicConfig';

const TOKEN_KEY = 'saffron-spice.adminToken.v1';
const STATUSES = [...ORDER_FLOW, 'cancelled'];

const FILTERS = [
  { value: 'all', label: 'All orders' },
  ...STATUSES.map((value) => ({
    value,
    label: ORDER_STATUS_META[value].shortLabel,
  })),
];

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function storeToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // The session still works for this page; only persistence across reloads is lost.
  }
}

function AdminOrderCard({ order, updating, onUpdateStatus }) {
  const [draft, setDraft] = useState(order.status);
  const statusMeta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending;
  const paymentMeta = PAYMENT_STATUS_META[order.paymentStatus] || PAYMENT_STATUS_META.unpaid;
  const selectId = `admin-status-${order.orderNumber}`;
  const changed = draft !== order.status;

  useEffect(() => {
    setDraft(order.status);
  }, [order.status]);

  return (
    <article className={`admin-order admin-order--${order.status}`}>
      <header className="admin-order__head">
        <div className="admin-order__identity">
          <span className="admin-order__number">{order.orderNumber}</span>
          <span className="admin-order__time">{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="admin-order__badges">
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          <Badge tone={paymentMeta.tone}>{paymentMeta.label}</Badge>
        </div>
      </header>

      <div className="admin-order__body">
        <div className="admin-order__customer">
          <h3>{order.customer.name}</h3>
          <a className="admin-order__phone" href={`tel:+91${order.customer.phone}`}>
            <Phone size={14} aria-hidden="true" />
            {formatPhone(order.customer.phone)}
          </a>
          <p className="admin-order__address">
            <MapPin size={14} aria-hidden="true" />
            <span>{order.customer.address}</span>
          </p>
          {order.customer.notes ? (
            <p className="admin-order__note">
              <strong>Kitchen note:</strong> {order.customer.notes}
            </p>
          ) : null}
        </div>

        <ul className="admin-order__items" aria-label={`Items in order ${order.orderNumber}`}>
          {order.items.map((item) => (
            <li key={`${order.orderNumber}-${item.menuItemId}`}>
              <span className="admin-order__qty">{item.quantity}×</span>
              <span className="admin-order__item-name">{item.name}</span>
              <span className="admin-order__item-price">{formatMoney(item.lineTotalPaise)}</span>
            </li>
          ))}
        </ul>

        <dl className="admin-order__totals">
          <div>
            <dt>{pluralize(order.items.length, 'dish', 'dishes')}</dt>
            <dd>{formatMoney(order.totals.subtotalPaise)}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>
              {order.totals.deliveryFeePaise === 0
                ? 'Free'
                : formatMoney(order.totals.deliveryFeePaise)}
            </dd>
          </div>
          <div>
            <dt>GST</dt>
            <dd>{formatMoney(order.totals.taxPaise)}</dd>
          </div>
          <div className="admin-order__grand-total">
            <dt>Total</dt>
            <dd>{formatMoney(order.totals.totalPaise)}</dd>
          </div>
          <div className="admin-order__payment">
            <dt>Payment</dt>
            <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</dd>
          </div>
        </dl>
      </div>

      <footer className="admin-order__foot">
        <div className="admin-order__updated">
          <span>Last update</span>
          <strong>{formatDateTime(order.updatedAt)}</strong>
        </div>
        <div className="admin-order__status-control">
          <label htmlFor={selectId}>Move order to</label>
          <div className="admin-order__status-row">
            <select
              id={selectId}
              className="select"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={updating}
            >
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {ORDER_STATUS_META[value].label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={() => onUpdateStatus(order.orderNumber, draft)}
              disabled={!changed}
              loading={updating}
            >
              {updating ? 'Saving' : 'Update'}
            </Button>
          </div>
        </div>
      </footer>
    </article>
  );
}

export default function AdminPage() {
  const { push } = useToast();
  const publicConfig = usePublicConfig();
  const [token, setToken] = useState(readToken);
  const [phase, setPhase] = useState(token ? 'checking' : 'login');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState(null);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [adminDisabled, setAdminDisabled] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const disabled = adminDisabled || publicConfig.data?.adminEnabled === false;

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const endSession = useCallback((message = null) => {
    storeToken('');
    setToken('');
    setOrders([]);
    setCounts(null);
    setTotal(0);
    setFilter('all');
    setPassword('');
    setPhase('login');
    setLoginError(message);
  }, []);

  const loadOrders = useCallback(
    async (statusValue, { silent = false } = {}) => {
      if (!token) return;
      if (!silent) setLoading(true);
      setLoadError(null);

      try {
        const data = await api.adminOrders(token, {
          status: statusValue === 'all' ? undefined : statusValue,
        });
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
        setCounts(data?.counts || null);
        setTotal(Number(data?.total) || 0);
        setPhase('ready');
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (error.status === 401) {
          endSession('Your admin session expired. Sign in again to continue.');
        } else if (error.code === 'ADMIN_NOT_CONFIGURED') {
          setAdminDisabled(true);
          setPhase('disabled');
        } else {
          setLoadError(error.message || 'The order list could not be loaded.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [endSession, token],
  );

  useEffect(() => {
    if (!token || disabled) return undefined;
    let cancelled = false;
    setPhase((current) => (current === 'ready' ? current : 'checking'));
    setLoadError(null);

    api
      .adminOrders(token)
      .then((data) => {
        if (cancelled) return;
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
        setCounts(data?.counts || null);
        setTotal(Number(data?.total) || 0);
        setPhase('ready');
      })
      .catch((error) => {
        if (cancelled || error.name === 'AbortError') return;
        if (error.status === 401) {
          endSession('Your admin session expired. Sign in again to continue.');
        } else if (error.code === 'ADMIN_NOT_CONFIGURED') {
          setAdminDisabled(true);
          setPhase('disabled');
        } else {
          setLoadError(error.message || 'The order list could not be loaded.');
          setPhase('ready');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [disabled, endSession, token]);

  useEffect(() => {
    if (disabled) setPhase('disabled');
    else if (!token) setPhase('login');
  }, [disabled, token]);

  useEffect(() => {
    if (phase !== 'ready' || !token) return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadOrders(filter, { silent: true });
    }, 30000);
    return () => window.clearInterval(timer);
  }, [filter, loadOrders, phase, token]);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!password.trim()) {
      setLoginError('Enter the admin password.');
      return;
    }

    setLoggingIn(true);
    setLoginError(null);
    try {
      const { token: sessionToken } = await api.adminLogin(password);
      if (!sessionToken) throw new Error('The server did not return an admin session.');
      storeToken(sessionToken);
      setToken(sessionToken);
      setPassword('');
      setPhase('checking');
    } catch (error) {
      if (error.code === 'ADMIN_NOT_CONFIGURED') {
        setAdminDisabled(true);
        setPhase('disabled');
      } else {
        setLoginError(error.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadOrders(filter, { silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilter = (value) => {
    if (value === filter && phase === 'ready') return;
    setFilter(value);
    loadOrders(value);
  };

  const handleUpdateStatus = async (orderNumber, status) => {
    setUpdatingOrder(orderNumber);
    try {
      const { order: updated } = await api.adminUpdateStatus(token, orderNumber, status);
      setOrders((current) => {
        if (filter !== 'all' && updated.status !== filter) {
          return current.filter((order) => order.orderNumber !== orderNumber);
        }
        return current.map((order) => (order.orderNumber === orderNumber ? updated : order));
      });
      push(`${orderNumber} moved to ${ORDER_STATUS_META[updated.status]?.shortLabel || updated.status}.`);
      await loadOrders(filter, { silent: true });
    } catch (error) {
      if (error.status === 401) {
        endSession('Your admin session expired. Sign in again to continue.');
      } else {
        push(error.message || 'The order status could not be updated.', { tone: 'error' });
      }
    } finally {
      setUpdatingOrder(null);
    }
  };

  const countFor = useMemo(
    () => (value) => (value === 'all' ? total : counts?.[value] || 0),
    [counts, total],
  );

  if (disabled) {
    return (
      <section className="container section admin-setup">
        <div className="admin-setup__card">
          <span className="admin-setup__icon" aria-hidden="true">
            <ShieldCheck size={30} />
          </span>
          <p className="eyebrow eyebrow--plain">Staff console</p>
          <h1 className="display-sm mt-2">The admin dashboard is switched off.</h1>
          <p className="admin-setup__lede">
            For safety, the dashboard stays disabled until a password is configured on the server.
            Add <code>ADMIN_PASSWORD</code> to the root <code>.env</code> file, restart, and reload this
            page.
          </p>
          <pre className="admin-setup__code">
            <code>ADMIN_PASSWORD=choose-a-strong-demo-password</code>
          </pre>
          <p className="admin-setup__note">
            This demo uses one password for the whole staff console. Before production, replace it with
            proper staff accounts, roles, session expiry, and audit logging.
          </p>
          <Button as={Link} to="/" variant="secondary">
            Back to the restaurant
          </Button>
        </div>
      </section>
    );
  }

  if (phase === 'login' || (!token && phase !== 'checking')) {
    return (
      <section className="container admin-login-page">
        <div className="admin-login">
          <div className="admin-login__intro">
            <span className="admin-login__seal" aria-hidden="true">
              <Utensils size={28} />
            </span>
            <p className="eyebrow eyebrow--plain">Staff only</p>
            <h1 className="admin-login__title">Keep service moving.</h1>
            <p className="lede">
              See incoming orders, move them through the kitchen, and keep every guest&rsquo;s tracking
              page up to date.
            </p>
            <ul className="admin-login__notes">
              <li>
                <ShieldCheck size={16} aria-hidden="true" />
                Password-protected demo console
              </li>
              <li>
                <RefreshCw size={16} aria-hidden="true" />
                Live status updates for guests
              </li>
              <li>
                <Phone size={16} aria-hidden="true" />
                One-tap calls to customers
              </li>
            </ul>
            <p className="admin-login__demo-note">
              Demo build. Orders are real records in the local database; authentication is a single
              shared password.
            </p>
          </div>

          <form className="admin-login__card" onSubmit={handleLogin} noValidate>
            <div className="admin-login__head">
              <span aria-hidden="true">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h2>Admin sign in</h2>
                <p>Enter the password configured for this server.</p>
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="admin-password">
                Admin password
              </label>
              <input
                id="admin-password"
                className="input"
                type="password"
                name="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (loginError) setLoginError(null);
                }}
                autoComplete="current-password"
                placeholder="Enter staff password"
                aria-invalid={Boolean(loginError)}
                aria-describedby={loginError ? 'admin-login-error' : undefined}
                disabled={loggingIn}
                autoFocus
              />
              {loginError ? (
                <p className="field__error" id="admin-login-error" role="alert">
                  <AlertCircle size={13} aria-hidden="true" />
                  {loginError}
                </p>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="btn--block" loading={loggingIn}>
              {loggingIn ? 'Signing in' : 'Sign in'}
              {!loggingIn ? <ArrowRight size={17} /> : null}
            </Button>

            <p className="admin-login__fineprint">
              Before production, move admin authentication behind a real identity provider with
              individual staff accounts and audit trails.
            </p>
          </form>
        </div>
      </section>
    );
  }

  if (phase === 'checking') {
    return (
      <section className="container section">
        <div className="admin-loading" role="status">
          <span className="btn__spinner" aria-hidden="true" />
          Opening the staff console…
        </div>
      </section>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-hero">
        <div className="container admin-hero__inner">
          <div>
            <p className="eyebrow eyebrow--plain">Staff console</p>
            <h1 className="admin-hero__title">Service, at a glance.</h1>
            <p className="lede">
              {restaurant.name} · {restaurant.deliveryRadius}
            </p>
          </div>
          <div className="admin-hero__actions">
            <Button variant="secondary" onClick={handleRefresh} loading={refreshing}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button variant="ghost" onClick={() => endSession()}>
              <LogOut size={16} />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="container admin-body">
        <section className="admin-overview" aria-label="Order overview">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`admin-stat${filter === item.value ? ' admin-stat--active' : ''}${
                item.value === 'cancelled' ? ' admin-stat--cancelled' : ''
              }`}
              aria-pressed={filter === item.value}
              onClick={() => handleFilter(item.value)}
            >
              <span>{item.label}</span>
              <strong>{countFor(item.value)}</strong>
            </button>
          ))}
        </section>

        <div className="admin-toolbar">
          <div>
            <p className="eyebrow">Live queue</p>
            <h2>
              {filter === 'all' ? 'Every order' : FILTERS.find((item) => item.value === filter)?.label}
              <span className="admin-toolbar__count">{countFor(filter)}</span>
            </h2>
          </div>
          <p className="admin-toolbar__note">
            Refreshes every 30 seconds. Status changes appear on the guest&rsquo;s tracking page.
          </p>
        </div>

        {loadError ? (
          <div className="notice notice--danger admin-load-error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <div>
              <strong>The order list could not be loaded.</strong>
              <p>{loadError}</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={handleRefresh}>
                Try again
              </Button>
            </div>
          </div>
        ) : null}

        <div className="admin-list" aria-busy={loading || undefined}>
          {loading && orders.length === 0 ? (
            <div className="admin-loading" role="status">
              <span className="btn__spinner" aria-hidden="true" />
              Loading orders…
            </div>
          ) : null}

          {!loading && orders.length === 0 && !loadError ? (
            <div className="empty-state admin-empty">
              <span className="empty-state__icon" aria-hidden="true">
                <Utensils size={24} />
              </span>
              <h2>No orders here yet.</h2>
              <p>
                {filter === 'all'
                  ? 'When a guest places an order, it will appear in this queue.'
                  : 'No orders are in this status right now.'}
              </p>
            </div>
          ) : null}

          {orders.map((order) => (
            <AdminOrderCard
              key={order.orderNumber}
              order={order}
              updating={updatingOrder === order.orderNumber}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>

        <p className="admin-footnote">
          Showing up to 300 recent orders. Confirmation, payment status, and customer details are
          recorded exactly as the guest submitted them.
        </p>
      </div>
    </div>
  );
}
