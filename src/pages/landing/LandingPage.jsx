import "./landing.css";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import ResourceSection from "./components/ResourceSection.jsx";
import FeatureSection from "./components/FeatureSection.jsx";
import CtaBanner from "./components/CtaBanner.jsx";
import Footer from "./components/Footer.jsx";

export default function LandingPage() {
  return (
    <div className="lp">
      <Header />
      <main>
        <Hero />
        <ResourceSection />
        <FeatureSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
