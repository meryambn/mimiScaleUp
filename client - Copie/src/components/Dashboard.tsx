import React from "react";
import EvaluationCriteriaWidget from "./widgets/EvaluationCriteriaWidget";
import UpcomingMeetingsWidget from "./widgets/UpcomingMeetingsWidget";
import MentorManagement from "./mentor/MentorManagement";
import PhasesWidget from "./widgets/PhasesWidget";
import OverallTasksWidget from "./widgets/OverallTasksWidget";
import NumberOfStartupsWidget from "./widgets/NumberOfStartupsWidget";
import ResourcesWidget from "./widgets/ResourcesWidget";
import ProgressTrackerWidget from "./widgets/ProgressTrackerWidget";
import EligibilityCriteriaWidget from "./widgets/EligibilityCriteriaWidget";

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NumberOfStartupsWidget />
        <ProgressTrackerWidget />
        <UpcomingMeetingsWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <EvaluationCriteriaWidget />
          <OverallTasksWidget />
        </div>
        <div className="space-y-6">
          <PhasesWidget />
          <EligibilityCriteriaWidget />
          <ResourcesWidget />
        </div>
      </div>

      <div className="mt-6">
        <MentorManagement />
      </div>
    </div>
  );
};

export default Dashboard;