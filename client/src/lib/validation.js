export function normalizeIndianPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  let national = digits;

  if (digits.length === 12 && digits.startsWith('91')) {
    national = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  }

  return /^[6-9]\d{9}$/.test(national) ? national : null;
}

export function validateCheckout(values) {
  const errors = {};
  const name = String(values.name || '').trim();
  const address = String(values.address || '').trim();
  const notes = String(values.notes || '').trim();

  if (name.length < 2) {
    errors.name = 'Enter the name we should deliver to.';
  } else if (name.length > 80) {
    errors.name = 'Please use a shorter name.';
  }

  if (!normalizeIndianPhone(values.phone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number starting with 6–9.';
  }

  if (address.length < 10) {
    errors.address = 'Add a little more detail so we can find you.';
  } else if (address.length > 300) {
    errors.address = 'Please keep the address under 300 characters.';
  }

  if (notes.length > 300) {
    errors.notes = 'Please keep notes under 300 characters.';
  }

  return errors;
}

export function validatePhone(value) {
  return normalizeIndianPhone(value)
    ? null
    : 'Enter a valid 10-digit Indian mobile number starting with 6–9.';
}
