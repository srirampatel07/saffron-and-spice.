/**
 * Indian mobile numbers: 10 digits, first digit 6-9, optional +91/91 prefix.
 * Spaces and dashes are tolerated for typed input; the stored value is the
 * canonical 10-digit national number.
 */
export function normalizeIndianPhone(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const digits = String(value).replace(/\D/g, '');
  let national = digits;

  if (digits.length === 12 && digits.startsWith('91')) {
    national = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  }

  return /^[6-9]\d{9}$/.test(national) ? national : null;
}
