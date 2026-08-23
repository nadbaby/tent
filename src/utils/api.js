/**
 * Builds the full API URL.
 * - In local dev (VITE_API_URL is empty): returns just the path like "/api/products"
 *   so the Vite proxy handles forwarding + token injection server-side (no CORS).
 * - In production (VITE_API_URL is set): returns the full URL with airoShareToken appended.
 *
 * @param {string} path - The API path, e.g. "/api/products"
 * @returns {string} The full URL with auth token appended (if applicable)
 */
export function apiUrl(path) {
  let base = import.meta.env.VITE_API_URL || '';

  // Dynamic routing correctly propagates absolute Vercel mappings evenly without static overrides.

  const token = import.meta.env.VITE_AIRO_SHARE_TOKEN;
  const url = `${base}${path}`;
  // Only append token for direct requests (production), not when using proxy (local dev)
  if (token && base) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}airoShareToken=${token}`;
  }
  return url;
}


// Clean API Fetch Utility Removed Invasive Monkey Patch
export const apiFetch = async (endpoint, options = {}) => {
  return window.fetch(apiUrl(endpoint), options);
};
