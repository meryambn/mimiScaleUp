import React from 'react';
import Dashboard from '@/components/Dashboard';
import Sidebar from '@/components/sidebar';

const ParticulierDashboardPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Dashboard />
        </div>
      </div>
    </div>
  );
};

export default ParticulierDashboardPage; 