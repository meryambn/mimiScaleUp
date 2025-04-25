import React, { useState } from 'react';
import { useLocation } from 'wouter';
import LoginModal from '@/components/auth/LoginModal';
import RegisterModal from '@/components/auth/RegisterModal';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <>
      <style jsx>{`
        .navbar {
          position: fixed;
          width: 100%;
          height: 90px;
          padding: 1.5rem 5%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }

        .logo {
          width: 200px;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
        }

        .nav-links a {
          text-decoration: none;
          color: #2d2d34;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .nav-links a:hover {
          color: #e43e32;
          transform: translateY(-2px);
        }

        .hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
        }

        .hamburger-icon {
          width: 40px;
          height: 40px;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: -100%;
          height: 100vh;
          width: 250px;
          background: white;
          box-shadow: -5px 0 15px rgba(0,0,0,0.1);
          padding: 80px 20px 20px;
          transition: right 0.3s ease;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .mobile-menu.open {
          right: 0;
        }

        .mobile-menu a {
          color: #2d2d34;
          text-decoration: none;
          font-size: 1.2rem;
          padding: 10px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .mobile-menu a:hover {
          background: #f5f5f5;
          color: #e43e32;
        }

        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(2px);
          z-index: 999;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .mobile-overlay.active {
          opacity: 1;
          pointer-events: all;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }

          .hamburger {
            display: block;
          }

          .navbar {
            height: 70px;
            padding: 1rem 5%;
          }
        }
      `}</style>

      <nav className="navbar">
        <img
          src="/ScaleUp_Logo_-_Original_with_Transparent_Background_-_5000x5000.png"
          className="logo"
          alt="ScaleUp Logo"
          onClick={() => setLocation('/')}
          style={{ cursor: 'pointer' }}
        />

        {/* Desktop Menu */}
        <div className="nav-links">
          <a onClick={() => setLocation('/')}>Accueil</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#contact">Contact</a>
          <a onClick={() => setShowLoginModal(true)}>Connexion</a>
        </div>

        {/* Hamburger Icon */}
        <button
          className="hamburger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu mobile"
        >
          <svg
            className={`hamburger-icon ${isMenuOpen ? 'open' : ''}`}
            viewBox="0 0 100 100"
            width="40"
          >
            <path
              className="line top"
              d="m 30,33 h 40 c 0,0 9.044436,-0.654587 9.044436,-8.508902 0,-7.854315 -8.024349,-11.958003 -14.89975,-10.85914 -6.875401,1.098863 -13.637059,4.171617 -13.637059,16.368042 v 40"
            />
            <path
              className="line middle"
              d="m 30,50 h 40"
            />
            <path
              className="line bottom"
              d="m 30,67 h 40 c 12.796276,0 15.357889,-11.717785 15.357889,-26.851538 0,-15.133752 -4.786586,-27.274118 -16.667516,-27.274118 -11.88093,0 -18.499247,6.994427 -18.435284,17.125656 l 0.252538,40"
            />
          </svg>
        </button>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <a href="#" onClick={() => { setIsMenuOpen(false); setLocation('/'); }}>Accueil</a>
          <a href="#features" onClick={() => setIsMenuOpen(false)}>Fonctionnalités</a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
          <a onClick={() => { setIsMenuOpen(false); setShowLoginModal(true); }}>Connexion</a>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`mobile-overlay ${isMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Login and Register Modals */}
      <LoginModal
        show={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        switchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      <RegisterModal
        show={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        switchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </>
  );
};

export default Navbar;
