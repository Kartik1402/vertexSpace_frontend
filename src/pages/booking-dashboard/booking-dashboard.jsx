import React, { useState } from "react";

import UpcomingBookings from "../../features/bookings/UpcomingBookings/UpcomingBookings";
import PastBookings from "../../features/bookings/PastBookings/PastBookings"; // <-- add this
import WaitlistPanel from "../../features/bookings/WaitlistPanel/WaitlistPanel";
import WaitlistOfferPanel from "../../features/bookings/WaitlistOfferPanel/WaitlistOfferPanel";
import "./BookingDashboardPage.css";

function WaitlistPanelPlaceholder() {
  return (
    <aside className="bd__sideCard">
      <div className="bd__sideHeader">
        <div className="bd__sideTitle">Waitlist Section</div>
        <span className="bd__badge">0 ACTIVE</span>
      </div>

      <div className="bd__muted">
        Items currently unavailable. You will be notified if a slot opens up.
      </div>

      <div className="bd__emptyBox">
        <div className="bd__emptyTitle">No waitlist items</div>
        <div className="bd__mutedSmall">This will populate later.</div>
      </div>
    </aside>
  );
}

export default function BookingDashboardPage() {
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" | "past" | "waitlist"

  return (
    <div className="bd">
      <div className="bd__header">
        <div className="bd__crumbs">
          Dashboard › <span className="bd__crumbStrong">My Bookings</span>
        </div>
        <h1 className="bd__title">My Bookings Overview</h1>
        <div className="bd__subtitle">Manage your bookings and cancellations.</div>
      </div>

      {/* Tabs row (add this) */}
      <div className="bd__tabs">
        <button
          type="button"
          className={`bd__tab ${activeTab === "upcoming" ? "isActive" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Active & Upcoming
        </button>

        <button
          type="button"
          className={`bd__tab ${activeTab === "past" ? "isActive" : ""}`}
          onClick={() => setActiveTab("past")}
        >
          Past Bookings
        </button>

        <button
          type="button"
          className={`bd__tab ${activeTab === "waitlist" ? "isActive" : ""}`}
          onClick={() => setActiveTab("waitlist")}
        >
          waitlist
        </button>
      </div>

      <div className="bd__grid">
        <main className="bd__main">
          {activeTab === "upcoming" && <UpcomingBookings />}
          {activeTab === "past" && <PastBookings />}
          {activeTab === "waitlist" && <WaitlistPanel />}

        
        </main>

        {/* keep side panel visible (like your screenshot) */}
        {/* <WaitlistPanel /> */}
        <WaitlistOfferPanel />


      </div>
    </div>
  );
}
