import React, { useState, useEffect, useRef } from 'react';
import LoginModal from '@/components/auth/LoginModal';
import RegisterModal from '@/components/auth/RegisterModal';
import Footer from '@/components/home/Footer';
import Features from '@/components/home/Features';
import { useAuth } from '@/context/AuthContext';

const HomePage: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);
  const { isAuthenticated, user } = useAuth();
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use a safer approach for redirection
      try {
        // Determine the correct dashboard path based on user role
        let dashboardPath = '/dashboard';
        if (user.role === 'admin') {
          dashboardPath = '/admin/dashboard';
        } else if (user.role === 'mentor') {
          dashboardPath = '/mentors/dashboard';
        } else if (user.role === 'startup') {
          dashboardPath = '/startup/dashboard';
        } else if (user.role === 'particulier') {
          dashboardPath = '/particulier/dashboard';
        }

        // Use a timeout to avoid too many history API calls
        setTimeout(() => {
          window.location.href = dashboardPath;
        }, 100);
      } catch (error) {
        console.error('Error during redirection:', error);
      }
    }
  }, [isAuthenticated, user]);

  const slides = [
    {
      image: '/images/young-team-leader-big-corporation-briefing-coworkers-pointing-graph-meeting-corporate-staff.jpg',
      title: 'Écosystème Dynamique'
    },
    {
      image: '/images/top-viewtop-view-manager-employee-doing-teamwork-business-office-looking-charts-laptop-display.jpg',
      title: 'Analytique Avancée'
    }
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-page">
      <style jsx>{`
        .home-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .hero {
          padding: 8rem 5% 4rem;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 4rem;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .hero h1 {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #e43e32 0%, #0c4c80 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }

        .hero p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          color: #666;
        }

        /* Carousel */
        .carousel-container {
          position: relative;
          height: 400px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .carousel-slide {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
          background-size: cover;
          background-position: center;
        }

        .carousel-slide.active {
          opacity: 1;
          transform: scale(1.03);
        }

        .slide-content {
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 2rem;
          background: linear-gradient(45deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%);
          color: white;
        }

        .cta-button {
          background: linear-gradient(135deg, #e43e32 0%, #0c4c80 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
          .hero {
            grid-template-columns: 1fr;
            padding-top: 6rem;
          }

          .carousel-container {
            height: 300px;
          }

          .hero h1 {
            font-size: 2.5rem;
          }
        }
      `}</style>

      <section className="hero" id="hero">
        <div className="hero-content">
          <h1>Transformez votre startup avec ScaleUp</h1>
          <p>Plateforme intelligente d'accélération et de croissance pour entrepreneurs ambitieux</p>
          <button
            className="cta-button"
            onClick={() => setShowLoginModal(true)}
          >
            Commencer l'expérience
          </button>

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
        </div>

        <div
          className="carousel-container"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.image}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="slide-content">
                <h3>{slide.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Features />
      <Footer />
    </div>
  );
};

export default HomePage;
