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

const StartupResourcePage = () => {
  const { selectedProgram } = useProgramContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
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

  // Filter resources based on search and active filter
  const localFilteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || resource.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const localFilteredExternalResources = externalResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Use either API resources or local filtered resources
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
            <h1>Ressources - {selectedProgram?.name || 'Programme'}</h1>
            <p className="subtitle">Documents et templates pour votre startup</p>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher des ressources..."
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
          padding-top: 100px; /* Add padding to account for the navbar height */
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
            padding-top: 100px; /* Maintain padding for navbar on mobile */
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