import { restaurant, siteMeta } from '../config';

const FALLBACK_SITE_URL = 'http://localhost:5173';

export const SITE_URL = (
  typeof __SITE_URL__ === 'string' && __SITE_URL__ ? __SITE_URL__ : FALLBACK_SITE_URL
).replace(/\/+$/, '');

export const SHARE_IMAGE = {
  path: '/og-share.jpg',
  width: 1200,
  height: 630,
  alt: 'Saffron & Spice modern Indian kitchen in Bengaluru',
};

export function absoluteUrl(pathname = '/', siteUrl = SITE_URL) {
  const base = String(siteUrl || FALLBACK_SITE_URL).replace(/\/+$/, '');
  const path = String(pathname || '/').split('?')[0].split('#')[0];
  if (path === '/' || path === '') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function canonicalPath(pathname) {
  const path = String(pathname || '/').split('?')[0].split('#')[0];
  if (!path || path === '/') return '/';
  return path.replace(/\/+$/, '') || '/';
}

const PUBLIC_PAGES = {
  '/': {
    title: `${restaurant.name} | Modern Indian restaurant in Bengaluru`,
    description:
      'Slow-cooked biryanis, tandoori kebabs and modern Indian favourites, cooked to order in Bengaluru. Order online for delivery across central Bengaluru.',
    changeFrequency: 'weekly',
    priority: '1.0',
  },
  '/menu': {
    title: `Menu | ${restaurant.name}, Bengaluru`,
    description:
      'Browse biryanis, kebabs, curries, breads and desserts from six regions of India. Prices in INR, cooked to order and delivered warm across central Bengaluru.',
    changeFrequency: 'weekly',
    priority: '0.9',
  },
  '/story': {
    title: `Our story | ${restaurant.name}, Bengaluru`,
    description:
      'Inside the Saffron & Spice kitchen: hand-ground masalas, overnight dal, sealed biryanis and the patience behind every plate.',
    changeFrequency: 'monthly',
    priority: '0.7',
  },
  '/credits': {
    title: `Photo credits | ${restaurant.name}`,
    description:
      'Photographer, source and licence details for the food and interior photography used on the Saffron & Spice demo site.',
    changeFrequency: 'yearly',
    priority: '0.3',
  },
};

const NOINDEX_PAGES = {
  '/track': {
    title: `Track your order | ${restaurant.name}`,
    description:
      'Check the live status of a Saffron & Spice order using your order number and the mobile number used at checkout.',
  },
  '/checkout': {
    title: `Checkout | ${restaurant.name}`,
    description: 'Review your order and delivery details before placing a Saffron & Spice order.',
  },
  '/admin': {
    title: `Staff dashboard | ${restaurant.name}`,
    description: 'Private staff dashboard for Saffron & Spice order management.',
  },
};

export function getPageSeo(pathname, siteUrl = SITE_URL) {
  const path = canonicalPath(pathname);
  const isOrder = path.startsWith('/order/');
  const page = PUBLIC_PAGES[path] || NOINDEX_PAGES[path] || {
    title: isOrder ? `Order status | ${restaurant.name}` : `Page not found | ${restaurant.name}`,
    description: isOrder
      ? 'View the status and receipt for a Saffron & Spice order.'
      : 'The page you requested could not be found. Return to the Saffron & Spice menu or home page.',
  };
  const noindex = path.startsWith('/order/') || Boolean(NOINDEX_PAGES[path]) || !PUBLIC_PAGES[path];
  const canonical = noindex ? null : absoluteUrl(path, siteUrl);
  const image = absoluteUrl(SHARE_IMAGE.path, siteUrl);

  return {
    path,
    title: page.title,
    description: page.description,
    canonical,
    noindex,
    type: path === '/story' ? 'article' : 'website',
    image,
    imageWidth: SHARE_IMAGE.width,
    imageHeight: SHARE_IMAGE.height,
    imageAlt: SHARE_IMAGE.alt,
    siteName: restaurant.name,
    locale: 'en_IN',
    changeFrequency: page.changeFrequency || null,
    priority: page.priority || null,
  };
}

export function publicSeoPages(siteUrl = SITE_URL) {
  return Object.keys(PUBLIC_PAGES).map((path) => ({
    path,
    ...getPageSeo(path, siteUrl),
  }));
}

export function restaurantJsonLd(siteUrl = SITE_URL) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${absoluteUrl('/', siteUrl)}#restaurant`,
    name: restaurant.name,
    description: restaurant.shortDescription,
    url: absoluteUrl('/', siteUrl),
    image: absoluteUrl(SHARE_IMAGE.path, siteUrl),
    servesCuisine: 'Indian',
    hasMenu: absoluteUrl('/menu', siteUrl),
  };

  // The demo values in config are placeholders. Only emit local-business
  // details after they have been replaced with verified data and the flag is
  // deliberately enabled.
  if (restaurant.seo?.emitBusinessDetails === true) {
    data.areaServed = {
      '@type': 'City',
      name: restaurant.address.city,
    };
    data.telephone = restaurant.phone;
    data.address = {
      '@type': 'PostalAddress',
      streetAddress: `${restaurant.address.line1}, ${restaurant.address.line2}`,
      addressLocality: restaurant.address.city,
      addressRegion: restaurant.address.state,
      postalCode: restaurant.address.pincode,
      addressCountry: 'IN',
    };
    data.openingHoursSpecification = restaurant.hours.map((slot) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: slot.days,
      description: `${slot.service}: ${slot.time}`,
    }));
  }

  const instagram = restaurant.social?.instagram;
  if (instagram && instagram !== 'https://instagram.com') {
    data.sameAs = [instagram];
  }

  return data;
}

export function websiteJsonLd(siteUrl = SITE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absoluteUrl('/', siteUrl)}#website`,
    name: restaurant.name,
    url: absoluteUrl('/', siteUrl),
    description: siteMeta.description,
    inLanguage: 'en-IN',
    publisher: { '@id': `${absoluteUrl('/', siteUrl)}#restaurant` },
  };
}

export function breadcrumbJsonLd(siteUrl, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, siteUrl),
    })),
  };
}

export function menuJsonLd(siteUrl, menu) {
  if (!menu || !Array.isArray(menu.items) || menu.items.length === 0) return null;

  const categories = Array.isArray(menu.categories) ? menu.categories : [];
  const sections = categories
    .map((category) => {
      const items = menu.items.filter((item) => item.category === category.slug);
      if (items.length === 0) return null;
      return {
        '@type': 'MenuSection',
        name: category.name,
        ...(category.description ? { description: category.description } : {}),
        hasMenuItem: items.map((item) => ({
          '@type': 'MenuItem',
          name: item.name,
          description: item.description,
          image: absoluteUrl(item.image, siteUrl),
          ...(item.isVeg ? { suitableForDiet: 'https://schema.org/VegetarianDiet' } : {}),
          offers: {
            '@type': 'Offer',
            price: (Number(item.pricePaise) / 100).toFixed(2),
            priceCurrency: 'INR',
            availability: item.isAvailable
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        })),
      };
    })
    .filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `${restaurant.name} menu`,
    url: absoluteUrl('/menu', siteUrl),
    inLanguage: 'en-IN',
    hasMenuSection: sections,
  };
}

export function storyJsonLd(siteUrl = SITE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `Our story | ${restaurant.name}`,
    description:
      'The cooking philosophy and kitchen story behind Saffron & Spice, a modern Indian restaurant in Bengaluru.',
    url: absoluteUrl('/story', siteUrl),
    isPartOf: { '@id': `${absoluteUrl('/', siteUrl)}#website` },
    about: { '@id': `${absoluteUrl('/', siteUrl)}#restaurant` },
  };
}

/**
 * Returns the JSON-LD documents that should be present for a route. The client
 * and the build-time prerenderer call this same function so their structured
 * data stays aligned.
 */
export function jsonLdForPath(pathname, siteUrl = SITE_URL, menu = null) {
  const path = canonicalPath(pathname);
  if (path === '/') {
    return [websiteJsonLd(siteUrl), restaurantJsonLd(siteUrl)];
  }
  if (path === '/menu') {
    const menuData = menuJsonLd(siteUrl, menu);
    return [
      breadcrumbJsonLd(siteUrl, [
        { name: 'Home', path: '/' },
        { name: 'Menu', path: '/menu' },
      ]),
      ...(menuData ? [menuData] : []),
    ];
  }
  if (path === '/story') {
    return [
      breadcrumbJsonLd(siteUrl, [
        { name: 'Home', path: '/' },
        { name: 'Our story', path: '/story' },
      ]),
      storyJsonLd(siteUrl),
    ];
  }
  if (path === '/credits') {
    return [
      breadcrumbJsonLd(siteUrl, [
        { name: 'Home', path: '/' },
        { name: 'Photo credits', path: '/credits' },
      ]),
    ];
  }
  return [];
}

export function serialiseJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
