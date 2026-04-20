import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { register as registerUser } from "../../../services/authApi";
import { saveAuth } from "../../../services/authStorage";
import "./Register.css";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}


function getDomain(email) {
  const at = email.lastIndexOf("@");
  if (at === -1) return "";
  return email.slice(at + 1).toLowerCase();
}

function passwordStrength(pw) {
  const p = String(pw || "");
  const lenOk = p.length >= 8;
  const hasLower = /[a-z]/.test(p);
  const hasUpper = /[A-Z]/.test(p);
  const hasNum = /\d/.test(p);
  const hasSym = /[^a-zA-Z0-9]/.test(p);

  const classes = [hasLower || hasUpper, hasNum, hasSym].filter(Boolean).length;

  if (!lenOk) return { level: "weak", label: "WEAK STRENGTH", filled: 1 };
  if (classes >= 3) return { level: "strong", label: "STRONG STRENGTH", filled: 3 };
  if (classes === 2) return { level: "medium", label: "MEDIUM STRENGTH", filled: 2 };
  return { level: "weak", label: "WEAK STRENGTH", filled: 1 };
}

const DEPARTMENTS = ["HR", "IT", "OPS",,"ENG", "Finance", "Marketing", "Sales"];

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    department: false,
  });
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const fullNameTrimmed = fullName.trim();
  const emailTrimmed = email.trim();

  const strength = useMemo(() => passwordStrength(password), [password]);

  const errors = useMemo(() => {
    const e = {};

    if (!fullNameTrimmed) e.fullName = "Full name is required.";
    else if (fullNameTrimmed.length < 2) e.fullName = "Enter at least 2 characters.";

    if (!emailTrimmed) e.email = "Corporate email is required.";
    else if (!isValidEmail(emailTrimmed)) e.email = "Enter a valid email address.";
    // else if (BLOCKED_DOMAINS.has(getDomain(emailTrimmed)))
    //   e.email = "Please use your work email address.";

    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "Minimum 8 characters.";

    if (!department) e.department = "Please select a department.";

    return e;
  }, [fullNameTrimmed, emailTrimmed, password, department]);

  const canSubmit = Object.keys(errors).length === 0;

  const showErr = (key) => (touched[key] || submittedOnce) && !!errors[key];

  const markTouched = (key) => setTouched((t) => ({ ...t, [key]: true }));



const onSubmit = async (evt) => {
  evt.preventDefault();
  setFormError("");
  setTouched({ displayName: true, email: true, password: true, code: true });

  if (!canSubmit || loading) return;

  try {
    setLoading(true);

    const data = await registerUser({
      email: email.trim(),
      password,
      displayName: fullName.trim(),
      code :department, // e.g. "HR"
    });

    saveAuth(data); // auto-login

    const role = String(data?.user?.role || "").toLowerCase();
    const adminRoles = new Set(["system_admin", "department_admin"]);
    navigate(adminRoles.has(role) ? "/admin-dashboard" : "/user-dashboard", { replace: true });
  } catch (err) {
    setFormError(err?.message || "Registration failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="reg">
      <header className="reg-top">
        <div className="reg-top__inner">
          <Link className="reg-brand" to="/" aria-label="Go to home">
            <span className="reg-brand__mark" aria-hidden="true" />
            <span className="reg-brand__name">VertexSpace</span>
          </Link>

          <nav className="reg-nav" aria-label="Primary">
            <a className="reg-nav__link" href="#features">
              Features
            </a>
            <a className="reg-nav__link" href="#pricing">
              Pricing
            </a>
            <a className="reg-nav__link" href="#enterprise">
              Enterprise
            </a>
            <span className="reg-nav__sep" aria-hidden="true" />
            <Link className="reg-nav__link reg-nav__link--strong" to="/login">
              Log In
            </Link>
          </nav>
        </div>
      </header>

      <main className="reg-main">
        <section className="reg-card" aria-label="Register">
          <h1 className="reg-title">Join VertexSpace</h1>
          <p className="reg-subtitle">
            Optimize your office flow. Start your conflict-free scheduling journey today.
          </p>

          <div className="reg-promise" aria-label="Promise">
            <span className="reg-promise__icon" aria-hidden="true">
              ✓
            </span>
            <span>Our conflict-free scheduling promise protects your focus time.</span>
          </div>

          <form className="reg-form" onSubmit={onSubmit} noValidate>
            <div className="reg-field">
              <label className="reg-label" htmlFor="fullName">
                Full Name
              </label>
              <div className={`reg-inputWrap ${showErr("fullName") ? "is-error" : ""}`}>
                <span className="reg-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                    />
                  </svg>
                </span>
                <input
                  id="fullName"
                  className="reg-input"
                  placeholder="e.g. Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => markTouched("fullName")}
                  autoComplete="name"
                  required
                  aria-invalid={showErr("fullName")}
                  aria-describedby={showErr("fullName") ? "fullName-error" : undefined}
                />
              </div>
              <div className="reg-help" role={showErr("fullName") ? "alert" : undefined} id="fullName-error">
                {showErr("fullName") ? errors.fullName : "\u00A0"}
              </div>
            </div>

            <div className="reg-field">
              <label className="reg-label" htmlFor="email">
                Corporate Email
              </label>
              <div className={`reg-inputWrap ${showErr("email") ? "is-error" : ""}`}>
                <span className="reg-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5Z"
                    />
                  </svg>
                </span>
                <input
                  id="email"
                  className="reg-input"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched("email")}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  aria-invalid={showErr("email")}
                  aria-describedby={showErr("email") ? "email-error" : undefined}
                />
              </div>
              <div className="reg-help" role={showErr("email") ? "alert" : undefined} id="email-error">
                {showErr("email") ? errors.email : "\u00A0"}
              </div>
            </div>

            <div className="reg-field">
              <label className="reg-label" htmlFor="password">
                Password
              </label>
              <div className={`reg-inputWrap ${showErr("password") ? "is-error" : ""}`}>
                <span className="reg-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4Z"
                    />
                  </svg>
                </span>

                <input
                  id="password"
                  className="reg-input reg-input--pass"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched("password")}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  aria-invalid={showErr("password")}
                  aria-describedby="pw-help"
                />

                <button
                  type="button"
                  className="reg-eye"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="reg-strength" aria-label="Password strength">
                <div className="reg-bars" aria-hidden="true">
                  <span className={`reg-bar ${strength.filled >= 1 ? `is-${strength.level}` : ""}`} />
                  <span className={`reg-bar ${strength.filled >= 2 ? `is-${strength.level}` : ""}`} />
                  <span className={`reg-bar ${strength.filled >= 3 ? `is-${strength.level}` : ""}`} />
                </div>
                <div className="reg-strength__meta">
                  <span className="reg-strength__label">{strength.label}</span>
                  <span className="reg-strength__min">Min. 8 characters</span>
                </div>
              </div>

              <div className="reg-help" role={showErr("password") ? "alert" : undefined} id="pw-help">
                {showErr("password") ? errors.password : "\u00A0"}
              </div>
            </div>

            <div className="reg-field">
              <label className="reg-label" htmlFor="department">
                Department
              </label>
              <div className={`reg-inputWrap ${showErr("department") ? "is-error" : ""}`}>
                <span className="reg-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M4 3h12v4H4V3Zm0 6h12v12H4V9Zm14 0h2v12h-2V9ZM6 11h8v2H6v-2Zm0 4h8v2H6v-2Z"
                    />
                  </svg>
                </span>

                <select
                  id="department"
                  className="reg-input reg-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  onBlur={() => markTouched("department")}
                  required
                  aria-invalid={showErr("department")}
                  aria-describedby={showErr("department") ? "dept-error" : undefined}
                >
                  <option value="" disabled>
                    Select department
                  </option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <span className="reg-chevron" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
                  </svg>
                </span>
              </div>

              <div className="reg-help" role={showErr("department") ? "alert" : undefined} id="dept-error">
                {showErr("department") ? errors.department : "\u00A0"}
              </div>
            </div>

            <button className="reg-primary" type="submit" >
              Create Your Workspace Account <span aria-hidden="true">→</span>
            </button>

            <div className="reg-bottom">
              <span>Already have an account?</span>{" "}
              <Link className="reg-link" to="/login">
                Log in
              </Link>
            </div>
          </form>
        </section>
      </main>

      <footer className="reg-foot">
        <div className="reg-foot__inner">
          <span>© 2024 VertexSpace Inc. All rights reserved.</span>
          <div className="reg-foot__links">
            <button type="button" className="reg-footLink">
              Privacy Policy
            </button>
            <button type="button" className="reg-footLink">
              Terms of Service
            </button>
            <button type="button" className="reg-footLink">
              Help Center
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
