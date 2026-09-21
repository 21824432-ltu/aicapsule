import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="hero">
      <h2>Your private AI prompt library</h2>
      <p>
        AI Capsule lets you save, review and improve the prompts you actually
        use — for coding, writing, debugging and study — all in one place,
        tied to your own GitHub account.
      </p>
      <Link to="/login" className="btn">
        Sign in to get started
      </Link>
    </div>
  );
}
