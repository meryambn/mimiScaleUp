import React from "react";
import Sidebar from "@/components/sidebar";
import ParticulierHeader from "./ParticulierHeader";
import { useLocation } from "wouter";
import "../../styles/userStyles.css";
import TeamNotificationHandler from "@/components/notification/TeamNotificationHandler";
import WinnerNotificationHandler from "@/components/notification/WinnerNotificationHandler";

interface ParticulierLayoutProps {
  children: React.ReactNode;
}

const ParticulierLayout: React.FC<ParticulierLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [location] = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <ParticulierHeader onToggleSidebar={toggleSidebar} />
      {children}
      <TeamNotificationHandler />
      <WinnerNotificationHandler />
    </div>
  );
};

export default ParticulierLayout;
