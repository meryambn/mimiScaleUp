import React from "react";
import Sidebar from "./Sidebar";
import RoleSidebar from "./RoleSidebar";
import Header from "./Header";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import "../../styles/adminStyles.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  // Log authentication state for debugging
  React.useEffect(() => {
    console.log('Layout authentication state:', {
      isAuthenticated,
      user,
      location,
      storedUser: localStorage.getItem('user')
    });
  }, [isAuthenticated, user, location]);

  // Redirect to home if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated && !location.startsWith('/home')) {
      console.log('Not authenticated, redirecting to home');

      // Check if there's a user in localStorage but not in context
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        console.log('Found user in localStorage but not in context, refreshing page');
        // Force a page refresh to reload the user from localStorage
        window.location.reload();
        return;
      }

      setLocation('/home');
    }
  }, [isAuthenticated, location, setLocation]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - fixed on desktop, sliding on mobile */}
      <div
        className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 transition-transform duration-200
          fixed md:sticky top-0 left-0 z-20 w-64 h-full admin-sidebar
        `}
      >
        {isAuthenticated ? <RoleSidebar /> : <Sidebar />}
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto admin-main-content">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
