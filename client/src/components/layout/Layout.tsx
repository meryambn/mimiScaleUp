import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

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
          fixed md:sticky top-0 left-0 z-20 w-64 h-full
        `}
      >
        <Sidebar />
      </div>
      
      {/* Content area */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto p-4 md:p-6">
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
