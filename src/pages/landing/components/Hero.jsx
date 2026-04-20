import Container from "./ui/Container.jsx";
import Pill from "./ui/Pill.jsx";
import Button from "./ui/Button.jsx";
import { useNavigate } from "react-router-dom";
import heroImg from "../../../assets/Hero.jpg";

export default function Hero() {
   const navigate=useNavigate();
  return (
    <section className="lp-hero" id="top">
      <Container className="lp-hero__grid">
        <div className="lp-hero__copy">
          <Pill className="lp-hero__pill">ENTERPRISE-READY v2.0</Pill>

          <h1 className="lp-hero__title">
            Conflict-Free <br />
            <span className="is-accent">Workplace</span> <br />
            Scheduling
          </h1>

          <p className="lp-hero__subtitle">
            VertexSpace optimizes your office resources with smart allocation for
            rooms, desks, and parking—all in one unified platform built for the
            modern enterprise.
          </p>

          <div className="lp-hero__cta">
            <Button variant="primary" size="lg" onClick={() => navigate("/login")}>
              Get Started
            </Button>
          </div>

          <div className="lp-hero__trusted">
            <span className="lp-hero__trustedLabel">Trusted by leading teams:</span>
            <div className="lp-hero__logos" aria-label="Trusted by logos">
              <span>NEXUS</span>
              <span>ORBIT</span>
              <span>PRISM</span>
            </div>
          </div>
        </div>

        <div className="lp-hero__media">
          <div className="lp-hero__imgWrap">
            <img className="lp-hero__img" src={heroImg} alt="Modern office room" />
          </div>
        </div>
      </Container>
    </section>
  );
}
