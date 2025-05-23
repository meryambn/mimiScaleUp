import React, { useState, useEffect } from 'react';
import {
  FaFileUpload,
  FaFilePdf,
  FaCheckCircle,
  FaSpinner,
  FaTimesCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import { useProgramContext } from '@/context/ProgramContext';

import { useAuth } from '@/context/AuthContext';
import { getLivrables } from '@/services/programService';
import { getAllPrograms, getProgram, getPhases } from '@/services/programService';
import { getSubmissionsByProgram } from '@/services/formService';
import { checkSubmissionAccepted } from '@/services/teamService';
import { getCandidatureIdForUser } from '@/services/userTeamMappingService';
import { getTeamDeliverableSubmissions } from '@/services/deliverableService';
import ProgramAccessGuard from '@/components/guards/ProgramAccessGuard';


interface ProgramPhase {
  id: number;
  name: string;
  description: string;
  color: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface Deliverable {
  id: number;
  nom: string;
  description: string;
  date_echeance: string;
  types_fichiers: string[];
  phase_id: number;
  candidature_id?: number;
  submission?: any; // For deliverables with submission status
}

const Deliverables: React.FC = () => {
  const { user } = useAuth();
  const { selectedProgram } = useProgramContext();

  const [activePhase, setActivePhase] = useState<number>(1);
  const [activeTab, setActiveTab] = useState('pending');
  const [phases, setPhases] = useState<ProgramPhase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawDeliverables, setRawDeliverables] = useState<Deliverable[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionProgram, setSubmissionProgram] = useState<any | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<any | null>(null);
  const [teamSubmissions, setTeamSubmissions] = useState<any[]>([]);

  // Fetch submission program info and details
  useEffect(() => {
    const fetchSubmissionProgramInfo = async () => {
      if (!user?.id) {
        console.log('Pas d\'utilisateur connecté');
        setError('Vous devez être connecté pour accéder aux livrables');
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
        console.log('Récupération des programmes...');
        const programs = await getAllPrograms();
        console.log('Programmes récupérés:', programs);

        if (!programs || programs.length === 0) {
          console.log('Aucun programme trouvé');
          setError('Aucun programme disponible');
          setIsLoading(false);
          return;
        }

        // Cherche le dernier programme où la soumission de l'utilisateur est acceptée
        let lastAcceptedProgram = null;
        for (const prog of programs) {
          console.log(`Vérification du programme ${prog.id}...`);
          const result = await getSubmissionsByProgram(prog.id);
          if (result.submissions && result.submissions.length > 0) {
            const userSubmission = result.submissions[0];
            console.log(`Soumission trouvée pour le programme ${prog.id}:`, userSubmission);
            const acceptanceResult = await checkSubmissionAccepted(userSubmission.id, prog.id);
            console.log(`Résultat de l'acceptation pour le programme ${prog.id}:`, acceptanceResult);
            if (acceptanceResult.accepted) {
              lastAcceptedProgram = { program: prog, submission: userSubmission };
              console.log(`Programme ${prog.id} accepté, on l'utilise.`);
              setCurrentSubmission(userSubmission);
              break;
            }
          }
        }

        if (!lastAcceptedProgram) {
          console.log('Aucun programme accepté trouvé');
          setError('Aucun programme accepté trouvé');
          setIsLoading(false);
          return;
        }

        const programDetails = await getProgram(lastAcceptedProgram.program.id);
        console.log('Détails du programme récupérés:', programDetails);

        if (!programDetails) {
          console.log('Aucun détail de programme trouvé');
          setError('Impossible de récupérer les détails du programme');
          setIsLoading(false);
          return;
        }

        // Fetch phases for this program
        console.log(`Fetching phases for program ${programDetails.id}...`);
        const phases = await getPhases(programDetails.id);
        console.log(`Fetched ${phases ? phases.length : 0} phases for program ${programDetails.id}:`, phases);

        if (!phases || phases.length === 0) {
          console.log('Aucune phase trouvée pour ce programme');
          setError('Aucune phase trouvée pour ce programme');
          setIsLoading(false);
          return;
        }

        // Format date function to get only the date part
        const formatDateString = (dateStr: string) => {
          if (!dateStr) return new Date().toISOString().split('T')[0];
          // If it's already just a date (YYYY-MM-DD), return it
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
          // Otherwise, extract the date part from the timestamp
          return dateStr.split('T')[0];
        };

        // Format phases with details
        const phasesWithDetails = phases.map(phase => {
          // Determine phase status based on dates
          const now = new Date();
          const startDate = new Date(phase.date_debut);
          const endDate = new Date(phase.date_fin);

          let phaseStatus: "not_started" | "in_progress" | "completed" = "not_started";
          if (now > endDate) {
            phaseStatus = "completed";
          } else if (now >= startDate && now <= endDate) {
            phaseStatus = "in_progress";
          }

          return {
            ...phase,
            id: String(phase.id),
            name: phase.nom || phase.name || `Phase ${phase.id}`,
            description: phase.description || '',
            startDate: formatDateString(phase.date_debut),
            endDate: formatDateString(phase.date_fin),
            status: phaseStatus,
            color: phase.color || '#818cf8'
          };
        });

        setPhases(phasesWithDetails);
        setSubmissionProgram(programDetails);
        setCurrentSubmission(lastAcceptedProgram.submission);

        // Set the first phase as active by default if not already set
        if (phasesWithDetails.length > 0 && !activePhase) {
          setActivePhase(Number(phasesWithDetails[0].id));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du programme:', error);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissionProgramInfo();
  }, [user?.id, user?.role]);

  // Fetch deliverables
  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        console.log('Fetching deliverables for phase:', activePhase);
        const deliverables = await getLivrables(String(activePhase));
        console.log('Raw deliverables:', deliverables);
        setRawDeliverables(deliverables);
      } catch (error) {
        console.error('Error fetching deliverables:', error);
      }
    };

    fetchDeliverables();
  }, [activePhase]);

  // Fetch team submissions
  useEffect(() => {
    const fetchTeamSubmissions = async () => {
      try {
        if (!user?.id || !submissionProgram?.id) {
          return;
        }

        // Get the team ID for the current user
        const teamId = await getCandidatureIdForUser(user.id, submissionProgram.id);
        console.log('Fetching submissions for team ID:', teamId);

        // Fetch submissions for this team
        const submissions = await getTeamDeliverableSubmissions(teamId.toString());
        console.log('Team submissions:', submissions);

        setTeamSubmissions(submissions);
      } catch (error) {
        console.error('Error fetching team submissions:', error);
      }
    };

    fetchTeamSubmissions();
  }, [user?.id, submissionProgram?.id]);

  const handlePhaseChange = (phase: number) => {
    setActivePhase(phase);
    setActiveTab('pending');
  };

  // Check if a deliverable has been submitted and get its status
  const getDeliverableSubmissionStatus = (deliverableId: number) => {
    if (!teamSubmissions || teamSubmissions.length === 0) {
      return null;
    }

    const submission = teamSubmissions.find(s => s.livrable_id === deliverableId);
    return submission || null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non soumis";
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Add debugging useEffect
  useEffect(() => {
    console.log('Selected Program:', selectedProgram);
    console.log('Program Phases:', selectedProgram?.phases);

    console.log('Phases for timeline:', (selectedProgram?.phases || []).map(phase => ({
      id: Number(phase.id),
      name: phase.name,
      description: phase.description,
      color: phase.color || '#818cf8',
      status: phase.status === 'completed' ? 'completed' :
             phase.status === 'in_progress' ? 'in-progress' :
             phase.status === 'not_started' ? 'not_started' : 'upcoming'
    })));
  }, [selectedProgram]);

  // Filter deliverables by active phase
  const phaseDeliverables = rawDeliverables.filter(d =>
    Number(d.phase_id) === activePhase
  );

  // Categorize deliverables based on their submission status
  const pendingDeliverables = [];
  const validatedDeliverables = [];
  const rejectedDeliverables = [];

  // Process each deliverable to determine its status
  for (const deliverable of phaseDeliverables) {
    const submission = getDeliverableSubmissionStatus(deliverable.id);

    if (!submission) {
      // No submission found, it's pending
      pendingDeliverables.push(deliverable);
    } else if (submission.statut === 'valide') {
      // Submission is validated
      validatedDeliverables.push({
        ...deliverable,
        submission
      });
    } else if (submission.statut === 'rejete') {
      // Submission is rejected
      rejectedDeliverables.push({
        ...deliverable,
        submission
      });
    } else {
      // Submission is pending review (en attente)
      pendingDeliverables.push({
        ...deliverable,
        submission
      });
    }
  }

  // Categories are filtered directly in the UI based on activeTab

  return (
    <div className="deliverables-container">
      <Sidebar />

      {/* Main Content */}
      <ProgramAccessGuard programId={submissionProgram?.id || ''}>
        <main className="main-content">
          {/* Header */}
          <header className="deliverables-header">
            <div>
              <h1>Livrables - {selectedProgram?.name || 'Programme'}</h1>
              <p className="subtitle">Documents à soumettre pour votre startup</p>
            </div>
          </header>
  <section className="phases-section">
          {isLoading ? (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Chargement des phases...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Chronologie des phases du programme</h2>
                <p className="text-sm text-gray-500">Cliquez sur une phase pour filtrer les livrables</p>
              </div>
              <div className="flex flex-col space-y-2">
                {/* Phase Timeline Bar */}
                <div className="relative h-12 bg-gray-100 rounded-md overflow-hidden flex">
                  {phases.map((phase, i) => {
                    const width = `${100 / phases.length}%`;
                    return (
                      <div
                        key={phase.id}
                        className={`h-full cursor-pointer hover:opacity-90 flex items-center justify-center
                          ${activePhase === Number(phase.id) ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500 z-10' : ''}
                        `}
                        style={{
                          width,
                          backgroundColor: phase.color,
                          opacity: phase.status === 'not_started' ? 0.5 : 1,
                          zIndex: phases.length - i
                        }}
                        onClick={() => handlePhaseChange(Number(phase.id))}
                      >
                        <span className="text-white font-medium text-xs md:text-sm truncate px-2">
                          {phase.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Phase Details */}
                <div className="grid grid-cols-5 gap-2">
                  {phases.map((phase) => (
                    <div
                      key={`details-${phase.id}`}
                      className={`text-xs p-2 rounded ${activePhase === Number(phase.id) ? 'bg-gray-100' : ''}`}
                    >
                      <div className="font-medium">{phase.name}</div>
                      <div className="text-gray-500">
                        {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                      </div>
                      <div className="mt-1 flex items-center">
                        <FaFileUpload className="h-3 w-3 mr-1 text-gray-500" />
                        <span>{phaseDeliverables.filter(d => Number(d.phase_id) === Number(phase.id)).length} Livrables</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
        {/* Deliverables Section */}
        <section className="deliverables-section mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Livrables</h2>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <FaSpinner className="animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Chargement des livrables...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 rounded-lg text-red-700 flex items-center">
                <span className="mr-2">⚠️</span>
                <span>{error}</span>
              </div>
            ) : rawDeliverables.length === 0 ? (
              <p className="text-gray-500">Aucun livrable pour cette phase.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rawDeliverables.map(deliverable => (
                  <div key={deliverable.id} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900">{deliverable.nom}</h3>
                    <p className="text-sm text-gray-500 mt-1">{deliverable.description}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <FaFileUpload className="mr-2" />
                      <span>Date d'échéance: {formatDate(deliverable.date_echeance)}</span>
                    </div>
                    {deliverable.types_fichiers && deliverable.types_fichiers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {deliverable.types_fichiers.map((type: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex justify-end">
                      {(() => {
                        // Check if this deliverable has been submitted
                        const submission = getDeliverableSubmissionStatus(deliverable.id);

                        if (submission) {
                          // Deliverable has been submitted, show status
                          return (
                            <div className="flex items-center gap-2">
                              {submission.statut === 'en attente' && (
                                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md flex items-center gap-1">
                                  <FaSpinner className="animate-spin" />
                                  En attente
                                </span>
                              )}
                              {submission.statut === 'valide' && (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md flex items-center gap-1">
                                  <FaCheckCircle />
                                  Validé
                                </span>
                              )}
                              {submission.statut === 'rejete' && (
                                <button
                                  onClick={() => {
                                    setSelectedDeliverable(deliverable);
                                    setShowUploadModal(true);
                                  }}
                                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors flex items-center gap-2"
                                >
                                  <FaFileUpload />
                                  Resoumettre
                                </button>
                              )}
                            </div>
                          );
                        } else {
                          // Deliverable has not been submitted, show submit button
                          return (
                            <button
                              onClick={() => {
                                setSelectedDeliverable(deliverable);
                                setShowUploadModal(true);
                              }}
                              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
                            >
                              <FaFileUpload />
                              Soumettre
                            </button>
                          );
                        }
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && selectedDeliverable && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
            >
              <motion.div
                className="bg-white rounded-lg p-6 w-[400px] max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">
                  Soumettre un fichier pour {selectedDeliverable.nom}
                </h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedFile || !selectedDeliverable) return;

                  try {
                    // Log des valeurs pour débogage
                    console.log('Valeurs actuelles:', {
                      selectedDeliverable,
                      submissionProgram,
                      currentSubmission,
                      activePhase,
                      selectedFile
                    });

                    // Vérification des champs requis avec plus de détails
                    if (!selectedDeliverable.id) {
                      throw new Error('ID du livrable manquant');
                    }

                    if (!submissionProgram?.id) {
                      throw new Error('ID du programme manquant');
                    }

                    if (!activePhase || activePhase === 0) {
                      throw new Error('Phase active non sélectionnée');
                    }

                    // Get the team ID dynamically for the current user and program
                    let teamId;

                    try {
                      if (user?.id) {
                        console.log('Fetching team ID for user:', user.id);

                        // Use our service to get the candidature ID (team ID) for the user
                        teamId = await getCandidatureIdForUser(user.id, submissionProgram.id);

                        console.log(`Using team ID: ${teamId} for user ${user.id} in program ${submissionProgram.id}`);
                      } else {
                        throw new Error('Utilisateur non identifié. Veuillez vous reconnecter.');
                      }
                    } catch (error) {
                      console.error('Error fetching team ID:', error);
                      throw new Error('Impossible de déterminer votre équipe. Veuillez contacter l\'administrateur.');
                    }

                    if (!teamId) {
                      throw new Error('Vous n\'êtes pas associé à une équipe. Veuillez contacter l\'administrateur.');
                    }

                    const formData = new FormData();
                    formData.append('fichier', selectedFile);
                    formData.append('livrable_id', selectedDeliverable.id.toString());
                    formData.append('candidature_id', teamId.toString()); // Use actual team ID instead of hardcoded value
                    formData.append('programme_id', submissionProgram.id.toString());
                    formData.append('phase_id', activePhase.toString());
                    // Ajouter les types de fichiers autorisés
                    if (selectedDeliverable.types_fichiers && selectedDeliverable.types_fichiers.length > 0) {
                      formData.append('types_fichiers', selectedDeliverable.types_fichiers.join(','));
                    }

                    console.log('Données envoyées:', {
                      livrable_id: selectedDeliverable.id,
                      candidature_id: teamId,
                      programme_id: submissionProgram.id,
                      phase_id: activePhase,
                      types_fichiers: selectedDeliverable.types_fichiers
                    });

                    const response = await fetch('/api/livrable-soumissions/soumettre', {
                      method: 'POST',
                      body: formData,
                      credentials: 'include'
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Erreur lors de l\'upload du fichier');
                    }

                    // Fermer le modal et réinitialiser
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setSelectedDeliverable(null);

                    // Recharger les livrables
                    const deliverables = await getLivrables(String(activePhase));
                    setRawDeliverables(deliverables);

                    // Recharger les soumissions
                    if (user?.id && submissionProgram?.id) {
                      const teamId = await getCandidatureIdForUser(user.id, submissionProgram.id);
                      const submissions = await getTeamDeliverableSubmissions(teamId.toString());
                      setTeamSubmissions(submissions);
                    }

                    // Afficher un message de succès
                    alert('Livrable soumis avec succès');
                  } catch (error) {
                    console.error('Error submitting file:', error);
                    alert(error instanceof Error ? error.message : 'Une erreur est survenue lors de la soumission du fichier');
                  }
                }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélectionner un fichier
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full p-2 border rounded"
                      accept={selectedDeliverable.types_fichiers.join(',')}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Types acceptés: {selectedDeliverable.types_fichiers.join(', ')}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedFile}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Soumettre
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DeliverablesWidget en haut */}


        {/* Phases Navigation */}


        {/* DeliverablesWidget en bas de la chronologie */}


        {/* Active Phase Filter */}
        {activePhase && (
          <div className="mb-6 px-4 py-3 bg-blue-50 rounded-lg flex justify-between items-center">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: phases.find(p => Number(p.id) === activePhase)?.color }}
              ></div>
              <span className="font-medium">
                Filtré par phase : {phases.find(p => Number(p.id) === activePhase)?.name}
              </span>
            </div>
            <button
              onClick={() => handlePhaseChange(1)}
              className="text-primary hover:text-primary/80"
            >
              Effacer
            </button>
          </div>
        )}

        {/* Status Tabs Section */}
        <section className="tabs-section">
          <div className="tabs">
            <motion.button
              className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              En attente
            </motion.button>
            <motion.button
              className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Validés
            </motion.button>
            <motion.button
              className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejected')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Rejetés
            </motion.button>
          </div>
        </section>

        {/* Deliverables List */}
        <section className="deliverables-list">
          <AnimatePresence>
            {phaseDeliverables.length === 0 ? (
              <div className="empty-state">
                <FaFileUpload className="empty-icon" />
                <h3 className="empty-title">Aucun livrable</h3>
                <p className="empty-text">
                  Aucun livrable disponible pour la phase {activePhase}.
                </p>
              </div>
            ) : (
              <>
                {/* En attente */}
                {/* En attente */}
                {activeTab === 'pending' && (
                  <div className="status-section">
                    <h3 className="status-title">
                      <FaSpinner className="status-icon pending" /> En attente
                    </h3>
                    <div className="deliverables-grid">
                      {pendingDeliverables.map(deliverable => (
                        <motion.div
                          key={deliverable.id}
                          className="deliverable-card pending"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          whileHover={{ y: -5 }}
                        >
                          <div className="card-header">
                            <div className="file-info">
                              <FaFilePdf className="file-icon pdf" />
                              <div>
                                <h3 className="file-name">{deliverable.nom}</h3>
                                <p className="file-meta">
                                  {formatDate(deliverable.date_echeance)} • {deliverable.types_fichiers?.join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="card-actions">
                            {deliverable.submission ? (
                              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md flex items-center gap-1">
                                <FaSpinner className="animate-spin" />
                                En attente de validation
                              </span>
                            ) : (
                              <button
                                className="action-btn submit"
                                onClick={() => {
                                  setSelectedDeliverable(deliverable);
                                  setShowUploadModal(true);
                                }}
                              >
                                <FaFileUpload /> Soumettre
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {pendingDeliverables.length === 0 && (
                        <div className="empty-state">
                          <FaFileUpload className="empty-icon" />
                          <h3 className="empty-title">Aucun livrable en attente</h3>
                          <p className="empty-text">
                            Tous les livrables ont été soumis ou il n'y a pas de livrables pour cette phase.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Validés */}
                {activeTab === 'approved' && (
                  <div className="status-section">
                    <h3 className="status-title">
                      <FaCheckCircle className="status-icon approved" /> Validés
                    </h3>
                    <div className="deliverables-grid">
                      {validatedDeliverables.map(deliverable => (
                        <motion.div
                          key={deliverable.id}
                          className="deliverable-card approved"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          whileHover={{ y: -5 }}
                        >
                          <div className="card-header">
                            <div className="file-info">
                              <FaFilePdf className="file-icon pdf" />
                              <div>
                                <h3 className="file-name">{deliverable.nom}</h3>
                                <p className="file-meta">
                                  {formatDate(deliverable.date_echeance)} • {deliverable.types_fichiers?.join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="card-actions">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md flex items-center gap-1">
                              <FaCheckCircle />
                              Validé le {formatDate(deliverable.submission.date_soumission)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      {validatedDeliverables.length === 0 && (
                        <div className="empty-state">
                          <FaCheckCircle className="empty-icon" />
                          <h3 className="empty-title">Aucun livrable validé</h3>
                          <p className="empty-text">
                            Vous n'avez pas encore de livrables validés pour cette phase.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejetés */}
                {activeTab === 'rejected' && (
                  <div className="status-section">
                    <h3 className="status-title">
                      <FaTimesCircle className="status-icon rejected" /> Rejetés
                    </h3>
                    <div className="deliverables-grid">
                      {rejectedDeliverables.map(deliverable => (
                        <motion.div
                          key={deliverable.id}
                          className="deliverable-card rejected"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          whileHover={{ y: -5 }}
                        >
                          <div className="card-header">
                            <div className="file-info">
                              <FaFilePdf className="file-icon pdf" />
                              <div>
                                <h3 className="file-name">{deliverable.nom}</h3>
                                <p className="file-meta">
                                  {formatDate(deliverable.date_echeance)} • {deliverable.types_fichiers?.join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="card-actions">
                            <button
                              className="action-btn resubmit"
                              onClick={() => {
                                setSelectedDeliverable(deliverable);
                                setShowUploadModal(true);
                              }}
                            >
                              <FaFileUpload /> Resoumettre
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      {rejectedDeliverables.length === 0 && (
                        <div className="empty-state">
                          <FaTimesCircle className="empty-icon" />
                          <h3 className="empty-title">Aucun livrable rejeté</h3>
                          <p className="empty-text">
                            Vous n'avez pas de livrables rejetés pour cette phase.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </AnimatePresence>
        </section>
      </main>
      </ProgramAccessGuard>

      {/* CSS Styles */}
      <style>{`
        .deliverables-container {
          display: flex;
          min-height: 100vh;
          background-color: #f9fafb;
          position: relative;
        }

        .main-content {
          flex: 1;
          padding: 2rem;
          padding-top: 100px;
          margin-left: 280px;
          min-height: 100vh;
        }

        .deliverables-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .deliverables-header h1 {
          font-size: 1.5rem;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .subtitle {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

        .primary-btn {
          background: var(--gradient);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 300;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-btn:hover {
          background: var(--gradient);
          opacity: 0.9;
        }

        /* Phases Navigation */
        .phases-section {
          margin-bottom: 1.5rem;
        }

        /* Required Documents Section */
        .required-docs-section {
          margin-bottom: 2rem;
        }

        .required-docs-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border-left: 4px solid #e43e32;
        }

        .required-docs-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          margin-bottom: 1rem;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-icon {
          font-size: 2rem;
          color: #e43e32;
        }

        .file-name {
          font-size: 1.1rem;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .file-meta {
          color: #6b7280;
          font-size: 0.85rem;
          margin: 0;
        }

        .card-content {
          padding-top: 1rem;
        }

        .documents-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .document-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 4px;
          background: #f9fafb;
          margin-bottom: 0.5rem;
        }

        .document-icon {
          color: #e43e32;
          font-size: 1.25rem;
        }

        .empty-state {
          text-align: center;
          padding: 2rem 0;
        }

        /* Tabs Section */
        .tabs-section {
          margin-bottom: 2rem;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
        }

        .tab.active {
          color: #e43e32;
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #e43e32;
        }

        /* Deliverables List */
        .deliverables-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .deliverable-card {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border-left: 4px solid #e43e32;
        }

        .deliverable-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .deliverable-card.required {
          border-left: 4px solid rgb(255, 3, 3);
          background-color: rgba(255, 0, 0, 0.05);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-icon {
          font-size: 2rem;
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

        .file-icon.ppt {
          color: #d24726;
        }

        .file-icon.generic {
          color: #6b7280;
        }

        .file-name {
          font-size: 1.1rem;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .file-meta {
          color: #6b7280;
          font-size: 0.85rem;
          margin: 0;
        }

        .file-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-icon {
          font-size: 1.2rem;
        }

        .status-icon.approved {
          color: #10b981;
        }

        .status-icon.pending {
          color: #f59e0b;
          animation: spin 2s linear infinite;
        }

        .status-icon.rejected {
          color: #ef4444;
        }

        .status-icon.not-submitted {
          color: #6b7280;
        }

        .status-text {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .status-text.approved {
          color: #10b981;
        }

        .status-text.pending {
          color: #f59e0b;
        }

        .status-text.rejected {
          color: #ef4444;
        }

        .status-text.not-submitted {
          color: #6b7280;
        }

        .card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-btn.download {
          background: #e0e7ff;
          color: #4f46e5;
          border: none;
        }

        .action-btn.delete {
          background: #fee2e2;
          color: #ef4444;
          border: none;
        }

        .action-btn.resubmit {
          background: #fef3c7;
          color: #d97706;
          border: none;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          width: 90%;
          max-width: 500px;
          position: relative;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0.25rem;
        }

        .modal-content h2 {
          margin-top: 0;
          color: #111827;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #4b5563;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }

        .secondary-btn {
          background: none;
          color: #e43e32;
          border: 1px solid #e43e32;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .secondary-btn:hover {
          background: rgba(228, 62, 50, 0.1);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 1rem;
            padding-top: 100px;
          }

          .deliverables-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .primary-btn {
            width: 100%;
          }

          .card-actions {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column;
          }

          .primary-btn, .secondary-btn {
            width: 100%;
          }
        }

        .status-section {
          margin-bottom: 2rem;
        }

        .status-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          color: #111827;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .status-icon {
          font-size: 1.2rem;
        }

        .status-icon.pending {
          color: #f59e0b;
          animation: spin 2s linear infinite;
        }

        .status-icon.approved {
          color: #10b981;
        }

        .status-icon.rejected {
          color: #ef4444;
        }

        .deliverables-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .deliverable-card {
          background: white;
          border-radius: 8px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .deliverable-card.pending {
          border-left: 4px solid #f59e0b;
        }

        .deliverable-card.approved {
          border-left: 4px solid #10b981;
        }

        .deliverable-card.rejected {
          border-left: 4px solid #ef4444;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          background: #f9fafb;
          border-radius: 8px;
          margin: 2rem 0;
        }

        .empty-icon {
          font-size: 3rem;
          color: #9ca3af;
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.25rem;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .empty-text {
          color: #6b7280;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .deliverables-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Deliverables;