import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMenu } from '../context/menu';
import { readInitialMenu } from '../lib/initialMenu';
import {
  SITE_URL,
  getPageSeo,
  jsonLdForPath,
  serialiseJsonLd,
} from '../lib/seo';

const MANAGED = 'data-seo-managed';

function setMeta(attribute, key, content) {
  const selector = `meta[${attribute}="${key}"][${MANAGED}]`;
  let element = document.head.querySelector(selector);
  if (!content) {
    if (element) element.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    element.setAttribute(MANAGED, 'true');
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href) {
  let element = document.head.querySelector(`link[rel="canonical"][${MANAGED}]`);
  if (!href) {
    if (element) element.remove();
    return;
  }
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    element.setAttribute(MANAGED, 'true');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function useJsonLd(id, documents) {
  const payload = JSON.stringify(documents);

  useEffect(() => {
    const remove = () => {
      document.head
        .querySelectorAll(`script[data-seo-jsonld="${id}"]`)
        .forEach((element) => element.remove());
    };

    remove();
    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return remove;
    }
    if (!Array.isArray(parsed)) return remove;

    for (const documentData of parsed) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', id);
      script.textContent = serialiseJsonLd(documentData);
      document.head.appendChild(script);
    }

    return remove;
  }, [id, payload]);
}

/**
 * Central client-side head manager. The build-time prerenderer injects the
 * same values into static HTML so crawlers do not need to execute JavaScript.
 */
export default function Seo() {
  const { pathname } = useLocation();
  const { categories, items } = useMenu();
  const meta = getPageSeo(pathname, SITE_URL);
  const menu = items.length > 0 ? { categories, items } : readInitialMenu();
  const jsonLd = jsonLdForPath(pathname, SITE_URL, menu);

  useEffect(() => {
    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('name', 'robots', meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setCanonical(meta.canonical);

    setMeta('property', 'og:type', meta.type);
    setMeta('property', 'og:site_name', meta.siteName);
    setMeta('property', 'og:locale', meta.locale);
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:url', meta.canonical);
    setMeta('property', 'og:image', meta.image);
    setMeta('property', 'og:image:width', String(meta.imageWidth));
    setMeta('property', 'og:image:height', String(meta.imageHeight));
    setMeta('property', 'og:image:alt', meta.imageAlt);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);
    setMeta('name', 'twitter:image', meta.image);
    setMeta('name', 'twitter:image:alt', meta.imageAlt);
  }, [meta]);

  useJsonLd('page', jsonLd);

  return null;
}
