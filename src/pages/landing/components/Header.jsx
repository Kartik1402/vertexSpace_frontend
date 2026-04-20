import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "./ui/Container.jsx";
import Button from "./ui/Button.jsx";
import { getAuth, clearAuth } from "../../../services/authStorage.js";
import { logout } from "../../../services/api";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "Resources", href: "#resources" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [auth, setAuth] = useState(() => getAuth());
  const [loggingOut, setLoggingOut] = useState(false);

  const isLoggedIn = useMemo(() => {
    // keep this flexible since auth shapes differ
    return !!(auth?.token || auth?.accessToken || auth?.user);
  }, [auth]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onStorage = () => setAuth(getAuth());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const closeMenu = () => setOpen(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();      // success only if backend returns 2xx/200
      clearAuth();         // remove token/auth from localStorage
      setAuth(null);       // update this tab immediately
      closeMenu();
      navigate("/login", { replace: true });
    } catch (e) {
      alert(e?.message || "Logout failed.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="lp-header">
      <Container className="lp-header__inner">
        <a className="lp-brand" href="#top" aria-label="Go to top">
          <div className="lp-brand__mark" aria-hidden="true" />
          <span className="lp-brand__name">VertexSpace</span>
        </a>

        <nav className="lp-nav" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.label} className="lp-nav__link" href={n.href}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="lp-header__actions">
          {!isLoggedIn ? (
            <>
              <button
                type="button"
                className="lp-linkbtn lp-onlyDesktop"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>

              <Button
                variant="primary"
                size="md"
                className="lp-onlyDesktop"
                onClick={() => navigate("/register")}
              >
                Sign Up Free
              </Button>
            </>
          ) : (
            <button
              type="button"
              className="lp-linkbtn lp-onlyDesktop"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          )}

          <button
            type="button"
            className="lp-burger lp-onlyMobile"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </Container>

      {open && (
        <>
          <button className="lp-backdrop" aria-label="Close menu" onClick={closeMenu} />

          <div className="lp-drawer" role="dialog" aria-label="Mobile menu">
            <div className="lp-drawer__top">
              <a className="lp-brand" href="#top" onClick={closeMenu} aria-label="Go to top">
                <div className="lp-brand__mark" aria-hidden="true" />
                <span className="lp-brand__name">VertexSpace</span>
              </a>

              <button type="button" className="lp-x" aria-label="Close menu" onClick={closeMenu}>
                ✕
              </button>
            </div>

            <div className="lp-drawer__links">
              {NAV.map((n) => (
                <a key={n.label} className="lp-drawer__link" href={n.href} onClick={closeMenu}>
                  {n.label}
                </a>
              ))}
            </div>

            <div className="lp-drawer__actions">
              {!isLoggedIn ? (
                <>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="lp-w100"
                    onClick={() => {
                      closeMenu();
                      navigate("/login");
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    className="lp-w100"
                    onClick={() => {
                      closeMenu();
                      navigate("/register");
                    }}
                  >
                    Sign Up Free
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="lg"
                  className="lp-w100"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
