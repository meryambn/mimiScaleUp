import React, { useState } from 'react';
import { 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFilePowerpoint, 
  FaFileDownload,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import Sidebar from '@/components/sidebar';

const StartupResourcePage = () => {
  const [activePhase, setActivePhase] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Ressources organisées par phase pour les startups
  const resourcesByPhase = {
    1: [
      {
        id: 1,
        title: "Guide de démarrage Phase 1",
        description: "Document détaillant les objectifs et livrables de la phase 1",
        type: "pdf",
        size: "2.4 MB",
        url: "#"
      },
      {
        id: 2,
        title: "Template Business Plan",
        description: "Modèle à compléter pour votre business plan initial",
        type: "word",
        size: "1.1 MB",
        url: "#"
      },
      {
        id: 3,
        title: "Modèle étude de marché",
        description: "Structure pour votre analyse de marché",
        type: "word",
        size: "1.5 MB",
        url: "#"
      }
    ],
    2: [
      {
        id: 4,
        title: "Guide développement MVP",
        description: "Méthodologie pour développer votre produit minimum viable",
        type: "pdf",
        size: "3.2 MB",
        url: "#"
      },
      {
        id: 5,
        title: "Tableau de suivi technique",
        description: "Template pour le suivi de votre développement",
        type: "excel",
        size: "2.8 MB",
        url: "#"
      }
    ],
    3: [
      {
        id: 6,
        title: "Guide levée de fonds",
        description: "Processus et conseils pour votre levée de fonds",
        type: "pdf",
        size: "4.1 MB",
        url: "#"
      },
      {
        id: 7,
        title: "Pitch Deck Template",
        description: "Modèle pour votre présentation aux investisseurs",
        type: "powerpoint",
        size: "5.7 MB",
        url: "#"
      },
      {
        id: 8,
        title: "Modèle contrat investisseur",
        description: "Structure de contrat type pour levée de fonds",
        type: "word",
        size: "2.3 MB",
        url: "#"
      }
    ],
    4: [
      {
        id: 9,
        title: "Guide scaling et croissance",
        description: "Stratégies pour scaler votre entreprise",
        type: "pdf",
        size: "3.5 MB",
        url: "#"
      },
      {
        id: 10,
        title: "Tableau de bord croissance",
        description: "Modèle Excel pour suivre vos KPI de croissance",
        type: "excel",
        size: "4.2 MB",
        url: "#"
      },
      {
        id: 11,
        title: "Template rapport final",
        description: "Structure pour votre rapport de fin de programme",
        type: "word",
        size: "1.8 MB",
        url: "#"
      }
    ]
  };

  const currentResources = resourcesByPhase[activePhase];

  // Filtrer les ressources selon la recherche et le filtre actif
  const filteredResources = currentResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || resource.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getFileIcon = (type) => {
    switch(type) {
      case 'pdf':
        return <FaFilePdf className="file-icon pdf" />;
      case 'word':
        return <FaFileWord className="file-icon word" />;
      case 'excel':
        return <FaFileExcel className="file-icon excel" />;
      case 'powerpoint':
        return <FaFilePowerpoint className="file-icon powerpoint" />;
      default:
        return <FaFilePdf className="file-icon" />;
    }
  };

  const handlePhaseChange = (phase) => {
    setActivePhase(phase);
    setSearchTerm('');
    setActiveFilter('all');
  };

  return (
    <div className="resources-container">
      <Sidebar />
      
      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="resources-header">
          <div>
            <h1>Ressources </h1>
            <p className="subtitle">Documents et templates pour votre startup</p>
          </div>
        </header>

      
        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher une ressource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-buttons">
            <span className="filter-label"><FaFilter /> Filtrer :</span>
            <motion.button
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Tous
            </motion.button>
            <motion.button
              className={`filter-btn ${activeFilter === 'pdf' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pdf')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              PDF
            </motion.button>
            <motion.button
              className={`filter-btn ${activeFilter === 'word' ? 'active' : ''}`}
              onClick={() => setActiveFilter('word')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Word
            </motion.button>
            <motion.button
              className={`filter-btn ${activeFilter === 'excel' ? 'active' : ''}`}
              onClick={() => setActiveFilter('excel')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Excel
            </motion.button>
            <motion.button
              className={`filter-btn ${activeFilter === 'powerpoint' ? 'active' : ''}`}
              onClick={() => setActiveFilter('powerpoint')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              PowerPoint
            </motion.button>
          </div>
        </div>

        {/* Resources List */}
        <section className="resources-list">
          {filteredResources.length > 0 ? (
            filteredResources.map(resource => (
              <motion.div
                key={resource.id}
                className="resource-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5 }}
              >
                <div className="file-type">
                  {getFileIcon(resource.type)}
                </div>
                <div className="file-info">
                  <h3>{resource.title}</h3>
                  <p className="file-description">{resource.description}</p>
                  <div className="file-meta">
                    <span className="file-size">{resource.size}</span>
                    <span className="file-format">{resource.type.toUpperCase()}</span>
                  </div>
                </div>
                <div className="download-btn">
                  <motion.a 
                    href={resource.url} 
                    download 
                    className="download-link"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaFileDownload /> Télécharger
                  </motion.a>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="empty-state">
              <p>Aucune ressource trouvée pour cette phase</p>
              {searchTerm || activeFilter !== 'all' ? (
                <button 
                  className="clear-filters"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveFilter('all');
                  }}
                >
                  Effacer les filtres
                </button>
              ) : null}
            </div>
          )}
        </section>
      </main>

      {/* CSS Styles */}
      <style jsx>{`
        .resources-container {
          display: flex;
          min-height: 100vh;
          background-color: #f9fafb;
          position: relative;
        }

        .main-content {
          flex: 1;
          padding: 2rem;
          margin-left: 280px;
          min-height: 100vh;
        }

        .resources-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .resources-header h1 {
          font-size: 1.8rem;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .subtitle {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

        /* Phases Navigation */
        .phases-section {
          margin-bottom: 1.5rem;
        }

        .phases-tabs {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .phase-tab {
          padding: 0.75rem 1.5rem;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.3s;
        }

        .phase-tab.active {
          background: #e43e32;
          color: white;
        }

        /* Search and Filters */
        .search-filters {
          margin-bottom: 2rem;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem;
          max-width: 500px;
        }

        .search-icon {
          color: #9ca3af;
          margin-right: 0.5rem;
        }

        .search-bar input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 1rem;
        }

        .filter-buttons {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-label {
          color: #6b7280;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .filter-btn.active {
          background: #e43e32;
          color: white;
          border-color: #e43e32;
        }

        /* Resources List */
        .resources-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .resource-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          gap: 1rem;
          transition: all 0.3s ease;
        }

        .resource-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .file-type {
          font-size: 2rem;
          display: flex;
          align-items: center;
        }

        .file-icon {
          color: #6b7280;
        }

        .file-icon.pdf {
          color: #e43e32;
        }

        .file-icon.word {
          color: #2b579a;
        }

        .file-icon.excel {
          color: #217346;
        }

        .file-icon.powerpoint {
          color: #d24726;
        }

        .file-info {
          flex: 1;
        }

        .file-info h3 {
          font-size: 1.1rem;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .file-description {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 0.8rem;
        }

        .file-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .download-btn {
          display: flex;
          align-items: center;
        }

        .download-link {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          background: #e43e32;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          text-decoration: none;
          font-size: 0.9rem;
          transition: background 0.2s ease;
        }

        .download-link:hover {
          background: #c0352a;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .clear-filters {
          background: none;
          color: #e43e32;
          border: 1px solid #e43e32;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-filters:hover {
          background: rgba(228, 62, 50, 0.1);
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 1rem;
          }
          
          .resources-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .resources-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StartupResourcePage; 