import React from 'react';
import { Route, useLocation } from 'wouter';

interface PrivateRouteProps {
  path: string;
  component: React.ComponentType<any>;
  allowedRoles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ path, component: Component, allowedRoles }) => {
  const [, setLocation] = useLocation();

  const isAuthenticated = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return !!user.id && !!user.token;
  };

  const hasRequiredRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return allowedRoles.includes(user.role);
  };

  const render = () => {
    if (!isAuthenticated()) {
      setLocation('/');
      return null;
    }

    if (!hasRequiredRole()) {
      setLocation('/dashboard');
      return null;
    }

    return <Component />;
  };

  return <Route path={path} component={render} />;
};

export default PrivateRoute; 