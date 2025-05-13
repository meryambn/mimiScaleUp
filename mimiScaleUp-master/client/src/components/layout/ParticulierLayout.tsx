import React from "react";
import Sidebar from "@/components/sidebar";
import ParticulierHeader from "./ParticulierHeader";
import { useLocation } from "wouter";
import "../../styles/userStyles.css";

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
    </div>
  );
};

export default ParticulierLayout;
