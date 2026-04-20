import Container from "./ui/Container.jsx";

function Col({ title, items }) {
  return (
    <div className="lp-footCol">
      <div className="lp-footCol__title">{title}</div>
      {items.map((t) => (
        <button key={t} type="button" className="lp-footLink">
          {t}
        </button>
      ))}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="lp-footer" id="contact">
      <Container className="lp-footer__grid">
        <div className="lp-footBrand">
          <div className="lp-brand">
            <div className="lp-brand__mark" aria-hidden="true" />
            <span className="lp-brand__name">VertexSpace</span>
          </div>
          <p className="lp-footBrand__desc">
            Next-gen workspace scheduling for enterprises that value productivity and employee experience.
          </p>
          <div className="lp-footSocial" aria-label="Social icons">
            <span className="lp-socialDot" />
            <span className="lp-socialDot" />
          </div>
        </div>

        <Col title="Product" items={["Feature Set", "Integrations", "Pricing", "Security"]} />
        <Col title="Resources" items={["Documentation", "Case Studies", "Help Center", "Blog"]} />
        <Col title="Company" items={["About Us", "Careers", "Press", "Contact"]} />
        <Col title="Legal" items={["Privacy", "Terms", "Compliance", "DPA"]} />
      </Container>

      <Container className="lp-footer__bottom">
        <div>© 2024 VertexSpace Inc. All rights reserved.</div>
        <div className="lp-footer__bottomRight">
          <button type="button" className="lp-footLink lp-footLink--inline">
            Cookie Settings
          </button>
          <button type="button" className="lp-footLink lp-footLink--inline">
            System Status
          </button>
        </div>
      </Container>
    </footer>
  );
}
