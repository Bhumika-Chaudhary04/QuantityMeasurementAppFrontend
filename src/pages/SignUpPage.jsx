import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/auth.css";

const API_BASE = "http://localhost:8080";

export default function SignupPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);

  function storeAuthSession(token, name, userEmail) {
    localStorage.setItem("quanmentToken", token || "");
    localStorage.setItem("quanmentUserName", name || "");
    localStorage.setItem("quanmentUserEmail", userEmail || "");

    sessionStorage.removeItem("quanmentToken");
    sessionStorage.removeItem("quanmentUserName");
    sessionStorage.removeItem("quanmentUserEmail");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function getPasswordStrength(pw) {
    if (!pw) return { score: 0, label: "", color: "" };

    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
      { label: "", color: "transparent" },
      { label: "Weak", color: "#f43f5e" },
      { label: "Fair", color: "#f59e0b" },
      { label: "Good", color: "#6366f1" },
      { label: "Strong", color: "#10b981" },
      { label: "Very strong", color: "#10b981" },
    ];

    return { score, ...levels[score] };
  }

  const strength = getPasswordStrength(password);

  async function handleSignup(e) {
    e.preventDefault();
    setAlert({ message: "", type: "" });

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setAlert({ message: "Please fill all fields.", type: "error" });
      return;
    }

    if (!isValidEmail(email.trim())) {
      setAlert({ message: "Enter a valid email address.", type: "error" });
      return;
    }

    if (password.length < 6) {
      setAlert({
        message: "Password must be at least 6 characters.",
        type: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      setAlert({ message: "Passwords do not match.", type: "error" });
      return;
    }

    if (!agreeTerms) {
      setAlert({
        message: "Please accept the Terms & Conditions.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: email.trim(),
        name: `${firstName} ${lastName}`.trim(),
        password,
      };

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      storeAuthSession(
        data.token || "",
        data.name || payload.name,
        data.email || payload.email
      );

      setAlert({ message: "Account created! Redirecting…", type: "success" });

      setTimeout(() => {
        navigate("/dashboard");
      }, 700);
    } catch (error) {
      setAlert({
        message: error.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  function googleLogin() {
    sessionStorage.setItem("quanmentRememberChoice", "local");
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  }

  return (
    <div className="auth-layout">
      <section className="auth-left">
        <div className="auth-overlay" />

        <div className="brand">
          <div className="brand-icon">Q</div>
          <div>
            <div className="brand-name">Quanment</div>
            <div className="brand-sub">Create Your Account</div>
          </div>
        </div>

        <div className="left-content">
          <span className="mini-badge">Get Started</span>
          <h1>Start using a cleaner measurement experience.</h1>
          <p>
            Sign up and access your compact, interactive conversion dashboard —
            built for speed and precision.
          </p>

          <div className="feature-list">
            <div className="feature-item">✨ Modern UI</div>
            <div className="feature-item">🎯 Focused workflow</div>
            <div className="feature-item">🚀 Faster calculations</div>
            <div className="feature-item">🔐 Secure sign in</div>
          </div>
        </div>

        <div className="left-bottom">
          <div className="left-stat">
            <strong>Rich</strong>
            <span>Readable interface</span>
          </div>
          <div className="left-stat">
            <strong>Quick</strong>
            <span>Easy onboarding</span>
          </div>
          <div className="left-stat">
            <strong>Smart</strong>
            <span>Built for conversions</span>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-card auth-card-wide">
          <div className="card-header">
            <span className="card-chip">Create Account</span>
            <h2>Sign up</h2>
            <p>Join Quanment for free</p>
          </div>

          {alert.message && <div className={`alert ${alert.type}`}>{alert.message}</div>}

          <form onSubmit={handleSignup}>
            <div className="field-row">
              <div className="field-group">
                <label>First Name</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Last Name</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

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
              <div className="password-wrap">
                <input
                  className="field-input"
                  type={showPw ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "48px" }}
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPw(!showPw)}
                  aria-label="Toggle password"
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>

              <div className="strength-wrap">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(strength.score / 5) * 100}%`,
                      background: strength.color,
                    }}
                  />
                </div>
                <div
                  className="strength-text"
                  style={{ color: strength.color || "rgba(248,250,252,0.5)" }}
                >
                  {strength.label}
                </div>
              </div>
            </div>

            <div className="field-group">
              <label>Confirm Password</label>
              <div className="password-wrap">
                <input
                  className="field-input"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: "48px" }}
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="Toggle confirm password"
                >
                  {showConfirm ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="terms-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={() => setAgreeTerms(!agreeTerms)}
                />
                <span>I agree to the Terms & Conditions</span>
              </label>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Creating Account…" : "Create Account →"}
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <button type="button" className="google-btn" onClick={googleLogin}>
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                width="18"
                alt="Google"
              />
              Continue with Google
            </button>
          </form>

          <p className="switch-text">
            Already have an account? <Link to="/">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}