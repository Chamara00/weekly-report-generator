/**
 * Never actually rendered: middleware.ts redirects "/" to /login when signed
 * out, or to the role's home page when signed in. Kept as a safe fallback.
 */
export default function HomePage() {
  return null;
}
