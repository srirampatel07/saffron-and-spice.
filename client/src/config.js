export const restaurant = {
  name: 'Saffron & Spice',
  tagline: 'Modern Indian kitchen',
  shortDescription:
    'Slow-cooked Indian classics, hand-ground spice blends, and a table that always has room for one more.',
  since: 1998,
  logoMark: 'S&S',
  phone: '+91 93810 74674',
  phoneHref: '+919381074674',
  email: 'hello@saffronandspice.in',
  address: {
    line1: '14 Lavelle Road',
    line2: 'Ashok Nagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  },
  hours: [
    { days: 'Tuesday – Sunday', service: 'Lunch', time: '12:00 – 3:30 pm' },
    { days: 'Tuesday – Sunday', service: 'Dinner', time: '6:30 – 11:00 pm' },
  ],
  closedNote: 'Closed on Mondays',
  deliveryRadius: 'Delivering across central Bengaluru',
  freeDeliveryThreshold: 999,
  deliveryFee: 49,
  taxRate: 0.05,
  adminPath: '/admin',
  whatsapp: {
    defaultMessage: "Hi Saffron & Spice! I'd like to enquire about your menu and orders.",
  },
  social: {
    instagram: 'https://instagram.com',
  },
  seo: {
    // The address, phone, service area and hours above are demo placeholders.
    // Only turn this on once real, verified local-business details replace
    // them; the structured data omits those fields while this is false.
    emitBusinessDetails: false,
  },
};

export const siteMeta = {
  titleTemplate: (page) => (page ? `${page} · ${restaurant.name}` : `${restaurant.name} · ${restaurant.tagline}`),
  description:
    'Order slow-cooked biryanis, tandoori kebabs and modern Indian favourites from Saffron & Spice. Freshly prepared, delivered warm.',
};
