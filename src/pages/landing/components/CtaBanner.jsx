import Container from "./ui/Container.jsx";
import Button from "./ui/Button.jsx";
import { useNavigate } from "react-router-dom";


export default function CtaBanner() {
    const navigate = useNavigate();

  return (
    <section className="lp-section" id="pricing">
      <Container>
        <div className="lp-cta">
          <h3 className="lp-cta__title">Ready to modernize your office space?</h3>
          <p className="lp-cta__sub">
            Join over 500+ enterprises worldwide using VertexSpace to drive office
            efficiency. Get started with your free account today.
          </p>
          <div className="lp-cta__actions">
            <Button variant="light" size="lg" onclick={()=>navigate("/login")}>
              Get Started
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
