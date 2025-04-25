import React from 'react';
import Sidebar from '@/components/sidebar';
import Dashboard from '@/components/Dashboard';

const MentorDashboardPage: React.FC = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <Dashboard />
    </div>
  );
};

export default MentorDashboardPage; 