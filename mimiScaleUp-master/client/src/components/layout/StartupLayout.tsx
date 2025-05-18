import React from "react";
import Sidebar from "@/components/sidebar";
import StartupHeader from "./StartupHeader";
import { useLocation } from "wouter";
import "../../styles/userStyles.css";
import TeamNotificationHandler from "@/components/notification/TeamNotificationHandler";

interface StartupLayoutProps {
  children: React.ReactNode;
}

const StartupLayout: React.FC<StartupLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [location] = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <StartupHeader onToggleSidebar={toggleSidebar} />
      {children}
      <TeamNotificationHandler />
    </div>
  );
};

export default StartupLayout;
