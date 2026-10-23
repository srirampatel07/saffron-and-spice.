import { useEffect, useState } from 'react';

export default function SafeImage({ src, fallbackSrc, onError, ...props }) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  useEffect(() => {
    setResolvedSrc(src);
    setFallbackUsed(false);
  }, [src]);

  const fallback = fallbackSrc ?? (src?.endsWith('.webp') ? src.replace(/\.webp$/, '.svg') : undefined);

  const handleError = (event) => {
    if (!fallbackUsed && fallback && resolvedSrc !== fallback) {
      setFallbackUsed(true);
      setResolvedSrc(fallback);
    }
    onError?.(event);
  };

  return <img {...props} src={resolvedSrc} onError={handleError} />;
}
