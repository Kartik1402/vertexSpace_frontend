import { useMemo, useState } from "react";
import Container from "./ui/Container.jsx";
import Tabs from "./ui/Tabs.jsx";

import r1 from "../../../assets/broom.jpg";
import r2 from "../../../assets/desk.jpg";
import r3 from "../../../assets/evpark.jpg";
import r4 from "../../../assets/vpark.jpg";

const TAB_ITEMS = [
  { value: "rooms", label: "Meeting Rooms", icon: "▦" },
  { value: "desks", label: "Hot Desks", icon: "▤" },
  { value: "parking", label: "Parking Spaces", icon: "Ⓟ" },
];

export default function ResourceSection() {
  const [tab, setTab] = useState("rooms");

  const cards = useMemo(() => {
    // (You can later map these to real backend data.)
    if (tab === "rooms") {
      return [
        { img:r1, title: "Conference Suites", desc: "Integrated AV and sensors" },
        { img: r1, title: "Focus Rooms", desc: "Quiet spaces for deep work" },
        { img: r1, title: "Board Rooms", desc: "Premium rooms for exec meetings" },
      ];
    }
    if (tab === "desks") {
      return [
        { img: r2, title: "Flex Desks", desc: "Reserve in seconds, arrive ready" },
        { img: r2, title: "Team Pods", desc: "Group seating for squads" },
        { img: r2, title: "Window Seats", desc: "Bright desks in high demand" },
      ];
    }
    return [
      { img: r3, title: "Reserved Parking", desc: "Assigned and bookable bays" },
      { img: r3, title: "EV Charging", desc: "Track charger availability" },
      { img: r4, title: "Visitor Spots", desc: "Short-stay parking options" },
    ];
  }, [tab]);

  return (
    <section className="lp-section lp-resources" id="resources">
      <Container>
        <h2 className="lp-h2">Manage Every Resource</h2>
        <div className="lp-resources__tabs">
          <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />
        </div>

        <div className="lp-grid3">
          {cards.map((c) => (
            <article key={c.title} className="lp-mediaCard">
              <img className="lp-mediaCard__img" src={c.img} alt={c.title} />
              <div className="lp-mediaCard__overlay">
                <div className="lp-mediaCard__title">{c.title}</div>
                <div className="lp-mediaCard__desc">{c.desc}</div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
