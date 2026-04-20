import Container from "./ui/Container.jsx";
import Card from "./ui/Card.jsx";

const FEATURES = [
  {
    icon: "✦",
    title: "Smart Allocation",
    desc: "AI-driven placement to maximize office density and resource usage efficiency.",
    link: "Learn More →",
  },
  {
    icon: "⏱",
    title: "Real-time Availability",
    desc: "Instant synchronization across all mobile, web, and kiosk devices to avoid double-bookings.",
    link: "Learn More →",
  },
  {
    icon: "⌛",
    title: "Automated Waitlists",
    desc: "No more ghost bookings; auto-release and re-assign features optimize space usage automatically.",
    link: "Learn More →",
  },
];

export default function FeatureSection() {
  return (
    <section className="lp-section lp-features" id="features">
      <Container>
        <div className="lp-eyebrow">ENTERPRISE-GRADE FEATURES</div>
        <div className="lp-featureHead">
          <h2 className="lp-h2 lp-h2--left">
            Streamline your office operations with <br />
            intelligent tools.
          </h2>
          <p className="lp-muted">
            VertexSpace eliminates the manual overhead of managing facility access,
            allowing your team to focus on meaningful work.
          </p>
        </div>

        <div className="lp-grid3 lp-grid3--gapLg">
          {FEATURES.map((f) => (
            <Card key={f.title} className="lp-featureCard">
              <div className="lp-featureCard__icon" aria-hidden="true">
                {f.icon}
              </div>
              <div className="lp-featureCard__title">{f.title}</div>
              <div className="lp-featureCard__desc">{f.desc}</div>
              <button type="button" className="lp-linkbtn lp-linkbtn--sm">
                {f.link}
              </button>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
