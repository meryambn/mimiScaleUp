// components/Features.tsx
import React, { useEffect } from 'react';

const cardsData = [
  {
    front: {
      icon: 'fas fa-rocket',
      title: 'Accélération Intelligente',
      text: 'Optimisez votre croissance'
    },
    back: {
      title: 'Notre Technologie',
      items: [
        'Gestion multi-programmes',
        'Suivi en temps réel',
        'Analytique prédictive'
      ]
    }
  },
  {
    front: {
      icon: 'fas fa-network-wired',
      title: 'Réseau Global',
      text: 'Connectez-vous à l\'écosystème'
    },
    back: {
      title: 'Notre Réseau',
      items: [
        '500+ mentors experts',
        '1000+ investisseurs actifs',
        'Portée mondiale'
      ]
    }
  },
  {
    front: {
      icon: 'fas fa-chart-line',
      title: 'Suivi Intelligent',
      text: 'Analysez votre progression'
    },
    back: {
      title: 'Analytics Suite',
      items: [
        'KPIs personnalisés',
        'Benchmarking automatique',
        'Alertes intelligentes'
      ]
    }
  },
];

const Features: React.FC = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    });

    document.querySelectorAll('.flip-card').forEach(card => {
      (card as HTMLElement).style.opacity = '0';
      (card as HTMLElement).style.transform = 'translateY(50px)';
      observer.observe(card);
    });
  }, []);

  return (
    <>
      <style jsx>{`
        :root {
          --primary: #e43e32;
          --secondary: #0c4c80;
          --dark: #2d2d34;
          --light: #f5f5f5;
          --gradient: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        }

        /* Cartes à Flip */
        .cards-section {
          padding: 4rem 5%;
        }

        .cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .flip-card {
          perspective: 1000px;
          height: 400px;
        }

        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s;
          transform-style: preserve-3d;
          border-radius: 20px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }

        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          border-radius: 20px;
          background: white;
        }

        .flip-card-back {
          background: var(--gradient);
          color: white;
          transform: rotateY(180deg);
        }

        .flip-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .flip-card-icon {
          font-size: 3rem;
          margin-bottom: 1.5rem;
          background: var(--gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <section className="cards-section" id="features">
        <div className="cards-container">
          {cardsData.map((card, index) => (
            <div key={index} className="flip-card">
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <i className={`${card.front.icon} flip-card-icon`} />
                  <h3>{card.front.title}</h3>
                  <p>{card.front.text}</p>
                </div>
                <div className="flip-card-back">
                  <h3>{card.back.title}</h3>
                  <ul>
                    {card.back.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Features;
