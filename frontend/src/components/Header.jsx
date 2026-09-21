import { Link } from "react-router-dom";
import { logout } from "../api";

export default function Header() {
  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  return (
    <header className="app-header">
      <h1>🧠 AI Capsule</h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <button onClick={handleLogout}>Logout</button>
      </nav>
    </header>
  );
}
