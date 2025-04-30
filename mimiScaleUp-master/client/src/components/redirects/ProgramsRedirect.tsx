import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';

const ProgramsRedirect: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  React.useEffect(() => {
    if (user?.role === 'admin') {
      setLocation('/admin/programs');
    } else if (user?.role === 'mentor') {
      setLocation('/mentors/programs');
    } else {
      setLocation('/home');
    }
  }, [user, setLocation]);
  
  return null;
};

export default ProgramsRedirect;
