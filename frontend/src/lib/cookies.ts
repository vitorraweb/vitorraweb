/** Set a browser cookie (client-side). Kept in a plain module so callers in
 *  components/hooks don't trip the react-hooks immutability rule on `document`. */
export function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${value};path=/;max-age=${maxAgeSeconds};samesite=lax`;
}
