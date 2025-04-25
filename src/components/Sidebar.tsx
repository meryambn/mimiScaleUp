import React from 'react';
import { FaHome, FaCalendarAlt, FaComments, FaFileAlt, FaBook, FaRocket, FaChartBar } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => (
  <Link 
    className={`nav-item ${isActive ? 'active' : ''}`} 
    to={to}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <>
      <style>
        {`
          .sidebar {
            background: white;
            border-right: 1px solid #e5e7eb;
            padding: 1.5rem;
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 250px;
            overflow-y: auto;
            z-index: 1000;
            transition: transform 0.3s ease;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
          }

          .logo {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .logo-icon img {
            width: 120px;
            height: auto;
            margin: 0 auto;
          }

          .nav-menu {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .nav-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            color: #374151;
            text-decoration: none;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
            font-size: 0.95rem;
            position: relative;
          }

          .nav-item svg {
            width: 1.25rem;
            height: 1.25rem;
            margin-right: 0.75rem;
          }

          .nav-item:hover {
            background: rgba(228, 62, 50, 0.05);
            color: #e43e32;
          }

          .nav-item.active {
            background: rgba(228, 62, 50, 0.1);
            color: #e43e32;
            font-weight: 500;
          }

          .nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            height: 60%;
            width: 3px;
            background: #e43e32;
            border-radius: 0 2px 2px 0;
          }

          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
            }

            .sidebar.active {
              transform: translateX(0);
            }
          }

          /* Ajout d'un effet de transition sur les icônes */
          .nav-item svg {
            transition: transform 0.2s ease;
          }

          .nav-item:hover svg {
            transform: translateX(2px);
          }
        `}
      </style>
      
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <img 
              src={`${process.env.PUBLIC_URL}/ScaleUp_Logo_-_Original_with_Transparent_Background_-_5000x5000.png`} 
              alt="ScaleUp Logo" 
            />
          </div>
        </div>
        <nav className="nav-menu">
          <NavItem 
            to={localStorage.getItem('role') === 'startup' ? '/startup' : '/particulier'}
            icon={<FaHome />}
            label="Home"
            isActive={isActive('/startup') || isActive('/particulier')}
          />
          
          <NavItem 
            to="/meetings"
            icon={<FaCalendarAlt />}
            label="Meeting"
            isActive={isActive('/meetings')}
          />
          
          <NavItem 
            to="/livrable"
            icon={<FaFileAlt />}
            label="Livrable"
            isActive={isActive('/livrable')}
          />
          
          <NavItem 
            to="/ressource"
            icon={<FaBook />}
            label="Ressource"
            isActive={isActive('/ressource')}
          />
          
          <NavItem 
            to="/tasks"
            icon={<FaRocket />}
            label="Tasks"
            isActive={isActive('/tasks')}
          />

          {localStorage.getItem('role') === 'startup' && (
            <NavItem 
              to="/analystics"
              icon={<FaChartBar />}
              label="Analytics"
              isActive={isActive('/analystics')}
            />
          )}
          
          <NavItem 
            to="/feed"
            icon={<FaComments />}
            label="Feeds"
            isActive={isActive('/feed')}
          />
        </nav>
      </div>
    </>
  );
};

export default Sidebar; 