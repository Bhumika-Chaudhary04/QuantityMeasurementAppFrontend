import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/auth.css";

const API_BASE = "http://localhost:8080";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const name = params.get("name");
    const userEmail = params.get("email");

    if (!token) return;

    storeAuthSession(token, name || "User", userEmail || "", remember);
    window.history.replaceState({}, document.title, "/");
    navigate("/dashboard");
  }, [navigate, remember]);

  function storeAuthSession(token, name, userEmail, rememberMe) {
    localStorage.removeItem("quanmentToken");
    localStorage.removeItem("quanmentUserName");
    localStorage.removeItem("quanmentUserEmail");

    sessionStorage.removeItem("quanmentToken");
    sessionStorage.removeItem("quanmentUserName");
    sessionStorage.removeItem("quanmentUserEmail");

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem("quanmentToken", token || "");
    storage.setItem("quanmentUserName", name || "");
    storage.setItem("quanmentUserEmail", userEmail || "");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAlert({ message: "", type: "" });

    if (!email.trim() || !password) {
      setAlert({ message: "Please fill all fields.", type: "error" });
      return;
    }

    if (!isValidEmail(email.trim())) {
      setAlert({ message: "Enter a valid email address.", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      storeAuthSession(
        data.token || "",
        data.name || email.split("@")[0],
        data.email || email,
        remember
      );

      setAlert({ message: "Login successful! Redirecting...", type: "success" });

      setTimeout(() => {
        navigate("/dashboard");
      }, 700);
    } catch (error) {
      setAlert({ message: error.message || "Something went wrong.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function googleLogin() {
    sessionStorage.setItem("quanmentRememberChoice", remember ? "local" : "session");
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  }

  return (
    <div className="auth-layout">
      <section className="auth-left">
        <div className="auth-overlay"></div>

        <div className="brand">
          <div className="brand-icon">Q</div>
          <div>
            <div className="brand-name">Quanment</div>
            <div className="brand-sub">Smart Unit Converter</div>
          </div>
        </div>

        <div className="left-content">
          <span className="mini-badge">Modern Measurement Workspace</span>
          <h1>Convert, compare and calculate with ease.</h1>
          <p>
            A smart and elegant place to work with length, temperature,
            volume and weight conversions.
          </p>

          <div className="feature-list">
            <div className="feature-item">📏 Unit conversion</div>
            <div className="feature-item">⚖️ Arithmetic operations</div>
            <div className="feature-item">🌡️ Smart temperature rules</div>
            <div className="feature-item">🧠 Comparison support</div>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-card">
          <div className="card-header">
            <span className="card-chip">Welcome Back</span>
            <h2>Sign in</h2>
            <p>Continue to your Quanment dashboard</p>
          </div>

          <div className={`alert ${alert.type}`}>{alert.message}</div>

          <form onSubmit={handleLogin}>
            <div className="field-group">
              <label>Email</label>
              <input
                className="field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Password</label>
              <input
                className="field-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="remember-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                />
                <span>Remember me</span>
              </label>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <button type="button" className="google-btn" onClick={googleLogin}>
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                width="18"
              />
              Continue with Google
            </button>
          </form>

          <p className="switch-text">
            Don’t have an account?
            <Link to="/signup"> Sign up</Link>
          </p>
        </div>
      </section>
    </div>
  );
}