import React from "react";
import Sidebar from "@/components/sidebar";
import StartupHeader from "./StartupHeader";
import { useLocation } from "wouter";
import "../../styles/userStyles.css";

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
    </div>
  );
};

export default StartupLayout;
