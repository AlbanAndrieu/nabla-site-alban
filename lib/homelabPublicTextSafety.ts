/** Validate display-only SERVICE text before rendering or browser caching. */
const PRIVATE_REFERENCE = /(?:[a-z][a-z0-9+.-]*:\/\/|(?:\d{1,3}\.){3}\d{1,3}|\.int(?:\.|\b)|\b(?:password|secret|token|api[_-]?key)\s*[:=])/i;
const PRIVATE_IPV6 = /(?:\b(?:fe80|f[cd][0-9a-f]{2}):|\[[0-9a-f:]+\]|::1\b)/i;
const PRIVATE_PATH = /(?:^|\s)\/(?:mnt|etc|home|root)\//i;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

/** Reject embedded URLs, IP addresses, private hostnames and credentials. */
export function isSafePublicText(value: unknown, maxLength = 500): value is string {
  return typeof value === "string" && value.trim().length > 0 &&
    value.length <= maxLength && !PRIVATE_REFERENCE.test(value) &&
    !PRIVATE_IPV6.test(value) && !PRIVATE_PATH.test(value) &&
    !CONTROL_CHARACTER.test(value);
}
