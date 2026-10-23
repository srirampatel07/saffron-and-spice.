const WEAK_ADMIN_PASSWORDS = new Set([
  'admin',
  'password',
  'changeme',
  'change-me',
  'demo',
  'saffron-demo-kitchen',
  'choose-a-long-demo-password',
  'choose-a-strong-demo-password',
]);

const MIN_ADMIN_PASSWORD_LENGTH = 16;
const MIN_TOKEN_SECRET_LENGTH = 32;

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Production-only configuration gate. It returns human-readable problems
 * without echoing any secret values. The server calls this before opening the
 * database or listening, so an unsafe production configuration cannot boot.
 */
export function validateProductionEnv(env = {}) {
  if (clean(env.NODE_ENV) !== 'production') return [];

  const problems = [];
  const password = clean(env.ADMIN_PASSWORD);
  const tokenSecret = clean(env.ADMIN_TOKEN_SECRET);

  if (!password) {
    problems.push('ADMIN_PASSWORD must be set in production.');
  } else if (
    password.length < MIN_ADMIN_PASSWORD_LENGTH ||
    WEAK_ADMIN_PASSWORDS.has(password.toLowerCase())
  ) {
    problems.push(
      `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters and must not be a demo/common value.`,
    );
  }

  if (!tokenSecret) {
    problems.push('ADMIN_TOKEN_SECRET must be set in production.');
  } else if (tokenSecret.length < MIN_TOKEN_SECRET_LENGTH) {
    problems.push(
      `ADMIN_TOKEN_SECRET must be at least ${MIN_TOKEN_SECRET_LENGTH} characters and randomly generated.`,
    );
  } else if (password && tokenSecret === password) {
    problems.push('ADMIN_TOKEN_SECRET must be different from ADMIN_PASSWORD.');
  }

  return problems;
}
