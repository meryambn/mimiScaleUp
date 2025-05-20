import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { getAllPrograms, getProgram, getPhases, updateProgramStatus } from '@/services/programService';
import { getProgramResources } from '@/services/resourceService';
import { getSubmissionsByProgram } from '@/services/formService';
import { checkSubmissionAccepted } from '@/services/teamService';
import { FrontendStatus } from '@/utils/statusMapping';
import { Resource, Program } from '@/types/program';

interface ExternalResource {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  nom: string;
}

const StartupResourcePage = () => {
  const { selectedProgram, setSelectedProgram } = useProgramContext();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [resources, setResources] = useState<Resource[]>([]);
  const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch submission program info and details
  useEffect(() => {
    const fetchSubmissionProgramInfo = async () => {
      if (!user?.id) {
        console.log('Pas d\'utilisateur connecté');
        setError('Vous devez être connecté pour accéder aux ressources');
        setIsLoading(false);
        return;
      }

      if (user.role !== 'startup') {
        console.log('Utilisateur n\'est pas une startup');
        setError('Cette page est réservée aux startups');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        console.log('Récupération du dernier programme...');
        const programs = await getAllPrograms();
        console.log('Programmes récupérés:', programs);

        if (!programs || programs.length === 0) {
          console.log('Aucun programme trouvé');
          setError('Aucun programme disponible');
          return;
        }

        const lastProgram = programs[0];
        console.log('Dernier programme:', lastProgram);

        const result = await getSubmissionsByProgram(lastProgram.id);
        console.log('Résultat complet des soumissions:', result);

        if (result.submissions && result.submissions.length > 0) {
          const userSubmission = result.submissions[0];
          console.log('Soumission trouvée:', userSubmission);

          const submissionId = userSubmission.id;
          const acceptanceResult = await checkSubmissionAccepted(submissionId, lastProgram.id);
          console.log('Résultat de la vérification d\'acceptation:', acceptanceResult);

          if (acceptanceResult.accepted) {
            const programDetails = await getProgram(lastProgram.id);
            console.log('Détails du programme récupérés:', programDetails);

            if (programDetails) {
              // Fetch phases for this program
              console.log(`Fetching phases for program ${programDetails.id}...`);
              const phases = await getPhases(programDetails.id);
              console.log(`Fetched ${phases ? phases.length : 0} phases for program ${programDetails.id}:`, phases);

              // Update program status to active
              await updateProgramStatus(programDetails.id, 'active' as FrontendStatus);

              // Fetch resources for the program
              console.log(`Fetching resources for program ${programDetails.id}...`);
              const resourcesResult = await getProgramResources(programDetails.id);
              console.log('Resources retrieved:', resourcesResult);

              // Format resources
              const formattedResources: Resource[] = resourcesResult.resources.map(resource => ({
                id: String(resource.id),
                title: resource.title || 'Ressource sans titre',
                description: resource.description || '',
                type: resource.type || 'document',
                url: resource.url || '',
                is_external: false,
                created_at: resource.created_at || new Date().toISOString(),
                program_id: Number(programDetails.id),
                category: resource.type
              }));

              // Format external resources
              const formattedExternalResources: ExternalResource[] = resourcesResult.externalResources.map(resource => ({
                id: String(resource.id),
                title: resource.title || 'Ressource externe sans titre',
                description: resource.description || '',
                type: 'external',
                url: resource.url || '',
                nom: resource.nom || resource.title
              }));

              console.log('Formatted resources:', formattedResources);
              console.log('Formatted external resources:', formattedExternalResources);
              setResources(formattedResources);
              setExternalResources(formattedExternalResources);

              // Format the program
              const formattedProgram: Program = {
                ...programDetails,
                id: String(programDetails.id),
                name: programDetails.nom || programDetails.name || "Programme sans nom",
                description: programDetails.description || "Aucune description disponible",
                phases: phases
              };

              console.log('Programme formaté:', formattedProgram);
              setSelectedProgram(formattedProgram);
            }
          } else {
            setError('Votre soumission est en cours d\'examen');
          }
        } else {
          setError('Aucune soumission trouvée pour ce programme');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du programme:', error);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissionProgramInfo();
  }, [user?.id, user?.role, setSelectedProgram]);

  // Filter resources based on search and active filter
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || resource.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredExternalResources = externalResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getFileIcon = (type: string) => {
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
  const formatDate = (dateString: string) => {
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
              {filteredResources.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-gray-500">
                    Aucun matériel disponible pour ce programme.
                  </CardContent>
                </Card>
              ) : (
                <div className="resources-list">
                  {filteredResources.map(resource => (
                    <motion.div
                      key={resource.id}
                      className="resource-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className="resource-icon">
                        {getFileIcon(resource.type)}
                      </div>
                      <div className="resource-info">
                        <h3>{resource.title}</h3>
                        <p>{resource.description}</p>
                        <div className="resource-meta">
                          <span className="file-format">{resource.type.toUpperCase()}</span>
                          {resource.created_at && (
                            <span className="file-date">Ajouté le {formatDate(resource.created_at)}</span>
                          )}
                        </div>
                      </div>
                      <div className="resource-actions">
                        {resource.is_external ? (
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="action-button">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Accéder
                          </a>
                        ) : (
                          <a href={resource.url} download className="action-button">
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                          </a>
                        )}
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
                  {filteredExternalResources.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      Aucune ressource externe disponible pour ce programme.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredExternalResources.map((resource) => (
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

        .resource-icon {
          font-size: 2rem;
          display: flex;
          align-items: center;
        }

        .resource-info {
          flex: 1;
        }

        .resource-info h3 {
          font-size: 1.1rem;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .resource-info p {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 0.8rem;
        }

        .resource-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .resource-actions {
          display: flex;
          align-items: center;
        }

        .action-button {
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

        .action-button:hover {
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