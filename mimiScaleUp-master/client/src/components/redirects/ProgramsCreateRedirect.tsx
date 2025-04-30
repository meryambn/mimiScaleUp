import React from 'react';
import { useLocation } from 'wouter';

const ProgramsCreateRedirect: React.FC = () => {
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    setLocation('/admin/programs/create');
  }, [setLocation]);
  
  return null;
};

export default ProgramsCreateRedirect;
