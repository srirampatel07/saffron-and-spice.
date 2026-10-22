export function createHttpError(status, message, code, details) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}
