import React from 'react';
import Dashboard from '@/components/Dashboard';
import ParticulierLayout from '../../components/layout/ParticulierLayout';

const ParticulierDashboardPage: React.FC = () => {
  return (
    <ParticulierLayout>
      <Dashboard />
    </ParticulierLayout>
  );
};

export default ParticulierDashboardPage;