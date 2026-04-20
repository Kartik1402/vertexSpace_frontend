import React from "react";
import "./userDashboard.css";

import DashboardHeader from "../../shared/components/DashboardHeader/DashboardHeader";
import RecommendationsSection from "../../features/dashboard/RecommendationsSection";
import BestSlotsSection from "../../features/dashboard/BestSlotsSection/BestSlotsSection";
import FindResourcesSection from "../../features/dashboard/FindResourcesSection/FindResourcesSection";

export default function UserDashboard() {
  return (
    <div className="userDashboard">
      <DashboardHeader activeTab="overview" notificationCount={0} />

      <main className="userDashboard__main">
        <div className="userDashboard__container">
          <div className="userDashboard__heading">
            <h1 className="userDashboard__title">VertexSpace Dashboard</h1>
            <div className="userDashboard__subtitle">
              Welcome back. Find the best slot for your productive day.
            </div>
          </div>

          <div className="userDashboard__sections">
            <section className="userDashboard__sectionBlock">
              <RecommendationsSection />
            </section>
            <BestSlotsSection />
            <FindResourcesSection/>

            {/* SmartSlotSearchSection */}
            {/* FindResourceSection */}
          </div>
        </div>
      </main>
    </div>
  );
}
