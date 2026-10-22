import { useEffect } from 'react';
import { siteMeta } from '../config';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = siteMeta.titleTemplate(title);
  }, [title]);
}
