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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Video, Download, ExternalLink, X } from "lucide-react";
import { useResources } from '@/context/ResourcesContext';
import { useProgramContext } from '@/context/ProgramContext';

const ParticulierResourcePage = () => {
  const [activePhase, setActivePhase] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const { selectedProgram } = useProgramContext();
  const {
    resources,
    externalResources,
    filteredResources,
    filteredExternalResources,
    searchQuery,
    setSearchQuery,
    getResourceTypeIcon,
    isLoading,
    error
  } = useResources();

  // Ressources organisées par phase pour les particuliers (fallback mock data)
  const resourcesByPhase = {
    1: [
      {
        id: "1",
        title: "Guide de démarrage Phase 1",
        description: "Document détaillant les objectifs et livrables de la phase 1",
        type: "document",
        size: "2.4 MB",
        url: "#",
        createdAt: "2023-05-10"
      },
      {
        id: "2",
        title: "Template CV",
        description: "Modèle à compléter pour votre CV",
        type: "document",
        size: "1.1 MB",
        url: "#",
        createdAt: "2023-05-15"
      },
      {
        id: "3",
        title: "Modèle lettre de motivation",
        description: "Structure pour votre lettre de motivation",
        type: "document",
        size: "1.5 MB",
        url: "#",
        createdAt: "2023-05-20"
      }
    ],
    2: [
      {
        id: "4",
        title: "Guide développement compétences",
        description: "Méthodologie pour développer vos compétences",
        type: "document",
        size: "3.2 MB",
        url: "#",
        createdAt: "2023-06-10"
      },
      {
        id: "5",
        title: "Tableau de suivi formation",
        description: "Template pour le suivi de votre formation",
        type: "spreadsheet",
        size: "2.8 MB",
        url: "#",
        createdAt: "2023-06-15"
      }
    ],
    3: [
      {
        id: "6",
        title: "Guide recherche d'emploi",
        description: "Processus et conseils pour votre recherche d'emploi",
        type: "document",
        size: "4.1 MB",
        url: "#",
        createdAt: "2023-07-10"
      },
      {
        id: "7",
        title: "Template portfolio",
        description: "Modèle pour votre portfolio professionnel",
        type: "presentation",
        size: "5.7 MB",
        url: "#",
        createdAt: "2023-07-15"
      },
      {
        id: "8",
        title: "Modèle rapport de stage",
        description: "Structure de rapport type pour stage",
        type: "document",
        size: "2.3 MB",
        url: "#",
        createdAt: "2023-07-20"
      }
    ],
    4: [
      {
        id: "9",
        title: "Guide développement carrière",
        description: "Stratégies pour développer votre carrière",
        type: "document",
        size: "3.5 MB",
        url: "#",
        createdAt: "2023-08-10"
      },
      {
        id: "10",
        title: "Tableau de bord compétences",
        description: "Modèle Excel pour suivre vos compétences",
        type: "spreadsheet",
        size: "4.2 MB",
        url: "#",
        createdAt: "2023-08-15"
      },
      {
        id: "11",
        title: "Template rapport final",
        description: "Structure pour votre rapport de fin de formation",
        type: "document",
        size: "1.8 MB",
        url: "#",
        createdAt: "2023-08-20"
      }
    ]
  };

  // Mock external resources
  const externalResourcesByPhase = {
    1: [
      { id: "e1", title: "Conseils pour rédiger un CV efficace", url: "https://www.cadremploi.fr/editorial/conseils/conseils-candidature/cv" },
      { id: "e2", title: "Exemples de lettres de motivation", url: "https://www.modeles-de-cv.com/lettre-de-motivation/" }
    ],
    2: [
      { id: "e3", title: "Plateforme de formation en ligne", url: "https://www.coursera.org/" },
      { id: "e4", title: "Développement de compétences professionnelles", url: "https://www.linkedin.com/learning/" }
    ],
    3: [
      { id: "e5", title: "Conseils pour la recherche d'emploi", url: "https://www.pole-emploi.fr/candidat/vos-recherches/conseils-a-lemploi.html" },
      { id: "e6", title: "Créer un portfolio en ligne", url: "https://www.behance.net/" }
    ],
    4: [
      { id: "e7", title: "Stratégies de développement de carrière", url: "https://www.cadremploi.fr/editorial/conseils/conseils-carriere" },
      { id: "e8", title: "Outils d'évaluation de compétences", url: "https://www.assessment-training.com/fr" }
    ]
  };

  const currentResources = resourcesByPhase[activePhase];
  const currentExternalResources = externalResourcesByPhase[activePhase];

  // Filtrer les ressources selon la recherche et le filtre actif
  const localFilteredResources = currentResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || resource.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const localFilteredExternalResources = currentExternalResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Use either API resources or local mock resources
  const displayResources = filteredResources.length > 0 ? filteredResources : localFilteredResources;
  const displayExternalResources = filteredExternalResources.length > 0 ? filteredExternalResources : localFilteredExternalResources;

  const getFileIcon = (type) => {
    if (getResourceTypeIcon) {
      return getResourceTypeIcon(type);
    }

    switch(type) {
      case 'document':
      case 'pdf':
      case 'word':
        return <FaFileWord className="file-icon word" />;
      case 'spreadsheet':
      case 'excel':
        return <FaFileExcel className="file-icon excel" />;
      case 'presentation':
      case 'powerpoint':
        return <FaFilePowerpoint className="file-icon powerpoint" />;
      case 'video':
        return <Video className="h-5 w-5 text-blue-500" />;
      default:
        return <FaFilePdf className="file-icon" />;
    }
  };

  const handlePhaseChange = (phase) => {
    setActivePhase(phase);
    setSearchTerm('');
    setActiveFilter('all');
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="resources-container">
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="resources-header">
          <div>
            <h1>Ressources</h1>
            <p className="subtitle">Documents et templates pour votre parcours</p>
            {selectedProgram && (
              <p className="text-gray-500 text-sm">
                Programme: <span className="font-medium">{selectedProgram.name}</span>
              </p>
            )}
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
              className={`filter-btn ${activeFilter === 'document' ? 'active' : ''}`}
              onClick={() => setActiveFilter('document')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Documents
            </motion.button>
            <motion.button
              className={`filter-btn ${activeFilter === 'spreadsheet' ? 'active' : ''}`}
              onClick={() => setActiveFilter('spreadsheet')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Tableurs
            </motion.button>
            <motion.button
              className={`filter-btn ${activeFilter === 'presentation' ? 'active' : ''}`}
              onClick={() => setActiveFilter('presentation')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Présentations
            </motion.button>
            <motion.button
              className={`filter-btn ${activeFilter === 'video' ? 'active' : ''}`}
              onClick={() => setActiveFilter('video')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Vidéos
            </motion.button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Chargement...</span>
              </div>
              <p className="mt-2 text-gray-600">Chargement des ressources...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Erreur!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <>
            {/* Program Resources */}
            <div className="mb-8">
              <h2 className="text-xl font-medium mb-4">Matériels du Programme</h2>
              {displayResources.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-gray-500">
                    Aucun matériel disponible pour ce programme.
                  </CardContent>
                </Card>
              ) : (
                <div className="resources-list">
                  {displayResources.map(resource => (
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
                          {resource.size && <span className="file-size">{resource.size}</span>}
                          <span className="file-format">{resource.type.toUpperCase()}</span>
                          {resource.createdAt && (
                            <span className="file-date">Ajouté le {formatDate(resource.createdAt)}</span>
                          )}
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
                          <Download className="h-4 w-4" /> Télécharger
                        </motion.a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* External Resources */}
            <div>
              <h2 className="text-xl font-medium mb-4">Ressources Externes</h2>
              <Card>
                <CardContent className="pt-6">
                  {displayExternalResources.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      Aucune ressource externe disponible pour ce programme.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayExternalResources.map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="font-medium">{resource.title}</div>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: 'transparent',
                              color: '#0c4c80',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.875rem',
                              textDecoration: 'none'
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Visiter
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
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
          background: var(--gradient);
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
          background: var(--gradient);
          color: white;
          border-color: transparent;
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
          background: var(--gradient);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .download-link:hover {
          background: var(--gradient);
          opacity: 0.9;
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

export default ParticulierResourcePage;