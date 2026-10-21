import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_API = `${API_BASE_URL}/api/auth`;

export default function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 12 || password.length > 72) {
      setError("Password must contain 12 to 72 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        // The backend may return an empty response.
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Signup failed (${response.status}).`
        );
      }

      navigate("/login", {
        state: {
          message: "Account created! Please log in.",
        },
      });
    } catch (err) {
      setError(
        err.message || "Cannot connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p>Join CloudCart and start shopping</p>

        {error && <p className="auth-error">{error}</p>}

        <label htmlFor="signup-name">Full Name</label>
        <input
          id="signup-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          autoComplete="name"
          required
        />

        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          required
        />

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 12 characters"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>

        <Link className="auth-back" to="/">
          ← Back to Shop
        </Link>
      </form>
    </main>
  );
}