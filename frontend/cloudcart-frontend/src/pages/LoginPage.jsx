
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8083/api/auth/signin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        // The backend may return an empty response.
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Invalid email or password. Please try again."
          );
        }

        throw new Error(
          data.message ||
            data.error ||
            `Login failed (${response.status}).`
        );
      }

      if (!data.token) {
        throw new Error("Login succeeded, but no token was returned.");
      }

      // Save JWT
      localStorage.setItem("cloudcart_token", data.token);

      // Save logged-in user details
      localStorage.setItem(
        "cloudcart_user",
        JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
        })
      );

      // Notify Header to update the profile immediately
      window.dispatchEvent(new Event("cloudcart-auth-change"));

      // Return to the originally requested page, or the shop
      navigate(location.state?.from?.pathname || "/", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Cannot connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome Back</h1>
        <p>Login to your CloudCart account</p>

        {location.state?.message && (
          <p className="auth-success">{location.state.message}</p>
        )}

        {error && <p className="auth-error">{error}</p>}

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>

        <Link className="auth-back" to="/">
          ← Back to Shop
        </Link>
      </form>
    </main>
  );
}