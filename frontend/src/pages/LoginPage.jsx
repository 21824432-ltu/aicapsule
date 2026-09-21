export default function LoginPage() {
  return (
    <div className="hero">
      <h2>Sign in</h2>
      <p>AI Capsule uses GitHub to sign you in. No separate password required.</p>
      {/* A full page navigation (not fetch) so the browser follows GitHub's
          OAuth redirect chain normally. In dev this is proxied to the
          backend by vite.config.js; in production it's same-origin. */}
      <a href="/login" className="btn">
        Continue with GitHub
      </a>
    </div>
  );
}
