import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaCalendarAlt, 
  FaComments,
  FaFileAlt, 
  FaBook, 
  FaRocket,
  FaChartBar 
} from 'react-icons/fa';
import '../styles/sidebar.css';

const Sidebar = () => {
    const [location, setLocation] = useLocation();
    
    const isActive = (path: string) => {
      return location === path;
    };

    const getDashboardPath = () => {
      const role = localStorage.getItem('role');
      return role === 'startup' ? '/startup/dashboard' : '/particulier/dashboard';
    };

    const getProfilePath = () => {
      const role = localStorage.getItem('role');
      return role === 'startup' ? '/startup/profile' : '/particulier/profile';
    };

    const getMeetingsPath = () => {
      const role = localStorage.getItem('role');
      return role === 'startup' ? '/startup/meetings' : '/particulier/meetings';
    };

    const getDeliverablesPath = () => {
      const role = localStorage.getItem('role');
      return role === 'startup' ? '/startup/livrable' : '/particulier/livrable';
    };

    const getResourcesPath = () => {
      const role = localStorage.getItem('role');
      return role === 'startup' ? '/startup/ressource' : '/particulier/ressource';
    };

    const getTasksPath = () => {
      const role = localStorage.getItem('role');
      return role === 'startup' ? '/startup/tasks' : '/particulier/tasks';
    };

    const getAnalyticsPath = () => {
      return '/startup/analytics';
    };
  
    return (
        <>
          <div className="sidebar">
            <div className="logo">
              <div className="logo-icon">
                <a href="">
                  <img 
                    src="/ScaleUp_Logo_-_Original_with_Transparent_Background_-_5000x5000.png" 
                    className="logo" 
                    alt="ScaleUp Logo" 
                  />
                </a>
              </div>
            </div>
            <nav className="nav-menu">  
              <Link 
                className={`nav-item ${isActive('/startup/profile') || isActive('/particulier/profile') ? 'active' : ''}`} 
                to={getProfilePath()}
              >
                <div className="icon"><FaUsers /></div>
                <span>Profil</span>
              </Link>
              
              <Link 
                className={`nav-item ${isActive('/startup/dashboard') || isActive('/particulier/dashboard') ? 'active' : ''}`} 
                to={getDashboardPath()}
              >
                <div className="icon"><FaTachometerAlt /></div>
                <span>Dashboard</span>
              </Link>
              
              <Link 
                className={`nav-item ${isActive('/startup/meetings') || isActive('/particulier/meetings') ? 'active' : ''}`} 
                to={getMeetingsPath()}
              >
                <div className="icon"><FaCalendarAlt /></div>
                <span>Meeting</span>
              </Link>
              
              <Link 
                className={`nav-item ${isActive('/startup/livrable') || isActive('/particulier/livrable') ? 'active' : ''}`} 
                to={getDeliverablesPath()}
              >
                <div className="icon"><FaFileAlt /></div>
                <span>Livrables</span>
              </Link>
              
              <Link 
                className={`nav-item ${isActive('/startup/ressource') || isActive('/particulier/ressource') ? 'active' : ''}`} 
                to={getResourcesPath()}
              >
                <div className="icon"><FaBook /></div>
                <span>Ressources</span>
              </Link>
              
              <Link 
                className={`nav-item ${isActive('/startup/tasks') || isActive('/particulier/tasks') ? 'active' : ''}`} 
                to={getTasksPath()}
              >
                <div className="icon"><FaRocket /></div>
                <span>Tasks</span>      
              </Link>

              {/* Afficher Analytics seulement pour les startups */}
              {localStorage.getItem('role') === 'startup' && (
                <Link 
                  className={`nav-item ${isActive('/startup/analytics') ? 'active' : ''}`} 
                  to={getAnalyticsPath()}
                >
                  <div className="icon"><FaChartBar /></div>
                  <span>Analytics</span>      
                </Link>
              )}
              
              <Link 
                className={`nav-item ${isActive('/feed') ? 'active' : ''}`} 
                to="/feed"
              >
                <div className="icon"><FaComments /></div>
                <span>Feeds</span>
              </Link>
            </nav>
          </div>
        </>
    );
};

export default Sidebar; 