import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { saveAuth } from "../../../services/authStorage";
import "./login.css";
import { login } from "../../../services/authApi";

import bg from "../../../assets/login.jpg";

function isValidEmail(value) {
  // simple, practical email check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export default function LoginPage() {
const navigate = useNavigate();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [showPassword, setShowPassword] = useState(false);
const [touched, setTouched] = useState({ email: false, password: false });
const [formError, setFormError] = useState("");
const [loading, setLoading] = useState(false);

const errors = useMemo(() => {
  const e = {};
  const emailTrimmed = email.trim();

  if (!emailTrimmed) e.email = "Email is required.";
  else if (!isValidEmail(emailTrimmed)) e.email = "Enter a valid email address.";

  if (!password) e.password = "Password is required.";
  else if (password.length < 8) e.password = "Password must be at least 8 characters.";

  return e;
}, [email, password]);

const canSubmit = Object.keys(errors).length === 0;

const onSubmit = async (evt) => {
  evt.preventDefault();
  setFormError("");
  setTouched({ email: true, password: true });

  if (!canSubmit || loading) return;

  try {
    setLoading(true);

    const data = await login(email.trim(), password);
    saveAuth(data); // stores token + user in localStorage

   const role = String(data?.user?.role || "").toLowerCase();
   const adminRoles = new Set(["system_admin", "department_admin"]);
   const target = adminRoles.has(role) ? "/admin" : "/user-dashboard";

navigate(target, { replace: true }); // default USER
  } catch (err) {
    setFormError(err?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="auth">
      <section className="auth-left" style={{ backgroundImage: `url(${bg})` }}>
        <div className="auth-left__overlay" />
        <div className="auth-left__content">
          <div className="auth-brand">
            <div className="auth-brand__mark" aria-hidden="true" />
            <div className="auth-brand__name">VertexSpace</div>
          </div>

          <div className="auth-left__tagline">
            <div className="auth-left__headline">
              The ultimate workspace OS for modern teams.
            </div>
            <div className="auth-left__sub">
              Schedule rooms, desks, and parking with a single click.
            </div>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-card">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Manage your workplace resources efficiently.</p>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                className={`auth-input ${touched.email && errors.email ? "is-error" : ""}`}
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email"
              />
              {touched.email && errors.email && <div className="auth-error">{errors.email}</div>}
            </div>

            <div className="auth-row">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <button type="button" className="auth-link" onClick={() => {}}>
                Forgot password?
              </button>
            </div>

            <div className="auth-field">
              <div className="auth-passWrap">
                <input
                  id="password"
                  className={`auth-input auth-input--pass ${
                    touched.password && errors.password ? "is-error" : ""
                  }`}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-eye"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {touched.password && errors.password && (
                <div className="auth-error">{errors.password}</div>
              )}
            </div>

            {formError && <div className="auth-formError">{formError}</div>}

            <button className="auth-primary" type="submit">
              Sign in
            </button>


            <div className="auth-bottom">
              <span>Don't have an account yet?</span>{" "}
              <Link className="auth-link" to="/register">
                Register your organization
              </Link>
            </div>

            <div className="auth-legal">
              <span>© 2024 VertexSpace Inc. All rights reserved.</span>
              <div className="auth-legal__links">
                <button type="button" className="auth-legalLink">Privacy Policy</button>
                <button type="button" className="auth-legalLink">Terms of Service</button>
                <button type="button" className="auth-legalLink">Help Center</button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
