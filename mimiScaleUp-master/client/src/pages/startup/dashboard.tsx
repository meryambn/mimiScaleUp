import React from 'react';
import Dashboard from '@/components/Dashboard';
import StartupLayout from '../../components/layout/StartupLayout';

const StartupDashboardPage: React.FC = () => {
  return (
    <StartupLayout>
      <Dashboard />
    </StartupLayout>
  );
};

export default StartupDashboardPage;