import React, { useState, useEffect } from 'react';
import {
  FaUsers,
  FaCalendarAlt,
  FaTasks,
  FaCheckCircle,
  FaSpinner,
  FaTimesCircle,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaAward,
  FaLightbulb,
  FaComments,
  FaUserPlus
} from 'react-icons/fa';
import DynamicProgramTimeline from '@/components/widgets/DynamicProgramTimeline';
import ProgramDetailsWidget from '@/components/widgets/ProgramDetailsWidget';
import UpcomingMeetingsWidget from '@/components/widgets/UpcomingMeetingsWidget';
import OverallTasksWidget from '@/components/widgets/OverallTasksWidget';
import ResourcesWidget from '@/components/widgets/ResourcesWidget';
import DeliverablesWidget from '@/components/widgets/DeliverablesWidget';
import EvaluationCriteriaWidget from '@/components/widgets/EvaluationCriteriaWidget';
import EligibilityCriteriaWidget from '@/components/widgets/EligibilityCriteriaWidget';
import { useAuth } from '@/context/AuthContext';
import { checkSubmissionAccepted } from '@/services/teamService';
import { getSubmissionsByProgram } from '@/services/formService';
import {
  getAllPrograms,
  getProgram,
  getPhases,
  getTasks,
  getReunions,
  getLivrables,
  getResources
} from '@/services/programService';
import { useProgramContext } from '@/context/ProgramContext';
import './Dashboard.css';

interface User {
  teamId?: string;
  id?: string | number;
  role?: string;
  // Add other user properties as needed
}

interface Program {
  id: string | number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  phases: any[];
  mentors: any[];
  evaluationCriteria: any[];
  eligibilityCriteria: any;
  dashboardWidgets: any[];
  createdAt: string;
  updatedAt: string;
  is_template: boolean;
  resources?: any[];
}

interface Submission {
  id: number;
  userId: number;
  programId: number;
  status: string;
  submittedAt: string;
  updatedAt: string;
  answers: any[];
}

interface DashboardProps {
  onCreateTeamClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateTeamClick }) => {
  const [activePhase, setActivePhase] = useState<number | string>(1);
  const [sidebarActive, setSidebarActive] = useState(false);
  const { user } = useAuth() as { user: User };
  const [lastCheckedSubmissionId, setLastCheckedSubmissionId] = useState<string | null>(null);
  const [submissionProgramId, setSubmissionProgramId] = useState<string | number | null>(null);
  const [submissionProgram, setSubmissionProgram] = useState<Program | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setSelectedProgram } = useProgramContext();

  // Fetch submission program info and details
  useEffect(() => {
    const fetchSubmissionProgramInfo = async () => {
      if (!user?.id) {
        console.log('Pas d\'utilisateur connecté');
        setError('Vous devez être connecté pour accéder au tableau de bord');
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
        console.log('Dates du programme:', {
          startDate: lastProgram.startDate,
          endDate: lastProgram.endDate
        });

        const result = await getSubmissionsByProgram(lastProgram.id);
        console.log('Résultat complet des soumissions:', result);

        if (result.submissions && result.submissions.length > 0) {
          const userSubmission = result.submissions[0];
          console.log('Soumission trouvée:', userSubmission);

          const submissionId = userSubmission.id;
          const acceptanceResult = await checkSubmissionAccepted(submissionId, lastProgram.id);
          console.log('Résultat de la vérification d\'acceptation:', acceptanceResult);

          if (acceptanceResult.accepted) {
            const updatedSubmission = {
              ...userSubmission,
              status: 'approved'
            };
            setCurrentSubmission(updatedSubmission);
            setSubmissionProgramId(lastProgram.id);

            const programDetails = await getProgram(lastProgram.id);
            console.log('Détails du programme récupérés:', programDetails);

            if (programDetails) {
              // Fetch phases for this program
              console.log(`Fetching phases for program ${programDetails.id}...`);
              const phases = await getPhases(programDetails.id);
              console.log(`Fetched ${phases ? phases.length : 0} phases for program ${programDetails.id}:`, phases);

              // Fetch detailed data for each phase
              const phasesWithDetails = await Promise.all(
                (phases || []).map(async (phase) => {
                  try {
                    // Fetch tasks for this phase
                    console.log(`Fetching tasks for phase ${phase.id}...`);
                    const tasks = await getTasks(phase.id);
                    console.log(`Fetched ${tasks ? tasks.length : 0} tasks for phase ${phase.id}:`, tasks);

                    // Fetch meetings (reunions) for this phase
                    console.log(`Fetching meetings for phase ${phase.id}...`);
                    const meetings = await getReunions(phase.id);
                    console.log(`Fetched ${meetings ? meetings.length : 0} meetings for phase ${phase.id}:`, meetings);

                    // Fetch deliverables for this phase
                    console.log(`Fetching deliverables for phase ${phase.id}...`);
                    const deliverables = await getLivrables(phase.id);
                    console.log(`Fetched ${deliverables ? deliverables.length : 0} deliverables for phase ${phase.id}:`, deliverables);

                    // Return phase with all its details
                    return {
                      ...phase,
                      tasks: Array.isArray(tasks) ? tasks : [],
                      meetings: Array.isArray(meetings) ? meetings : [],
                      deliverables: Array.isArray(deliverables) ? deliverables : []
                    };
                  } catch (error) {
                    console.error(`Error fetching details for phase ${phase.id}:`, error);
                    return {
                      ...phase,
                      tasks: [],
                      meetings: [],
                      deliverables: []
                    };
                  }
                })
              );

              console.log(`Processed ${phasesWithDetails.length} phases with details:`, phasesWithDetails);

              // Fetch resources for this program
              console.log(`Fetching resources for program ${programDetails.id}...`);
              let resources = [];
              try {
                // Note: You'll need to implement or import the getResources function
                // resources = await getResources(programDetails.id);
                console.log(`Fetched ${resources.length} resources for program ${programDetails.id}:`, resources);
              } catch (error) {
                console.error(`Error fetching resources for program ${programDetails.id}:`, error);
              }

              // Vérifier et formater les dates si nécessaire
              const formattedProgram = {
                ...programDetails,
                startDate: programDetails.startDate || new Date().toISOString(),
                endDate: programDetails.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                // Ensure we have a name property that matches what the UI expects
                name: programDetails.nom || programDetails.name || "Programme sans nom",
                // Ensure we have a description property
                description: programDetails.description || "Aucune description disponible",
                // Add the detailed phases
                phases: phasesWithDetails,
                // Add resources
                resources: resources
              };
              console.log('Programme formaté avec phases et ressources:', formattedProgram);

              // Add additional debugging
              console.log('Setting submissionProgram with data:', {
                id: formattedProgram.id,
                name: formattedProgram.name,
                description: formattedProgram.description,
                startDate: formattedProgram.startDate,
                endDate: formattedProgram.endDate,
                phasesCount: formattedProgram.phases ? formattedProgram.phases.length : 0,
                resourcesCount: formattedProgram.resources ? formattedProgram.resources.length : 0
              });

              setSubmissionProgram(formattedProgram);
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
  }, [user?.id, user?.role]);

  // Check for new accepted submissions periodically
  useEffect(() => {
    const checkNewSubmissions = async () => {
      if (!user?.teamId || !submissionProgram?.id) return;

      try {
        const storedSubmissionId = localStorage.getItem('lastSubmissionId');
        if (storedSubmissionId && storedSubmissionId !== lastCheckedSubmissionId) {
          const result = await checkSubmissionAccepted(
            storedSubmissionId,
            submissionProgram.id
          );

          if (result.accepted) {
            setLastCheckedSubmissionId(storedSubmissionId);
          }
        }
      } catch (error) {
        console.error('Error checking new submissions:', error);
      }
    };

    const interval = setInterval(checkNewSubmissions, 30000);
    return () => clearInterval(interval);
  }, [user?.teamId, submissionProgram?.id, lastCheckedSubmissionId]);

  // Get phase descriptions from submission program
  const getPhaseDescription = (phaseId: number | string) => {
    if (submissionProgram && submissionProgram.phases) {
      const phase = submissionProgram.phases.find((p: any) => p.id === phaseId);
      if (phase) {
        return phase.description;
      }
    }
    return "Description non disponible";
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    console.log('Formatting date:', dateString); // Debug log
    try {
      if (!dateString) {
        console.log('No date string provided');
        return 'Date non définie';
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', dateString);
        return 'Date non définie';
      }
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date non définie';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Chargement du programme...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Add debugging before rendering
  console.log('Dashboard render - submissionProgram:', submissionProgram ? {
    id: submissionProgram.id,
    name: submissionProgram.name,
    description: submissionProgram.description,
    startDate: submissionProgram.startDate,
    endDate: submissionProgram.endDate
  } : null);

  if (!submissionProgram) {
    return (
      <div className="no-program-container">
        <h2>Aucun programme trouvé pour vos soumissions</h2>
        <p>Vous n'avez pas encore soumis de candidature à un programme.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarActive(!sidebarActive)}
      >
        ☰
      </button>

      {/* Main Content */}
      <main className="main-content" style={{ marginLeft: '290px' }}>
        {/* Header avec le nom et la description */}
        <header className="dashboard-header">
          <div className="header-content">
            <h1>{submissionProgram?.name || 'Programme ScaleUp'}</h1>
            <p className="program-description">
              {submissionProgram?.description || 'Description du programme en cours de chargement...'}
            </p>
            {currentSubmission && (
              <div className="submission-status">
                <p>Statut: <span className={`status-${currentSubmission.status.toLowerCase()}`}>{currentSubmission.status}</span></p>
                <p>Soumis le: {formatDate(currentSubmission.submittedAt)}</p>
              </div>
            )}
          </div>
          <div className="dashboard-actions">
            {onCreateTeamClick && (
              <button onClick={onCreateTeamClick} className="create-team-btn">
                <FaUserPlus className="icon" />
                Créer une équipe
              </button>
            )}
            <div className="date-range">
              <span>Phase {activePhase} en cours</span>
              <span>{getPhaseDescription(activePhase)}</span>
            </div>
          </div>
        </header>

        {/* Grille principale des widgets */}
        <div className="dashboard-grid">
          {/* Widget des détails du programme */}
          <div className="widget-card">
            <ProgramDetailsWidget
              isStartupInterface={true}
              submissionProgram={submissionProgram}
              programId={submissionProgram.id}
            />
          </div>

          {/* Widget de la timeline */}
          <div className="widget-card">
            <DynamicProgramTimeline
              onPhaseSelect={(phaseId) => setActivePhase(Number(phaseId))}
              viewType="vertical"
              showCard={false}
              phases={submissionProgram.phases || []}
              programId={submissionProgram.id}
              currentPhase={activePhase}
            />
          </div>

          {/* Widget des réunions à venir */}
          <div className="widget-card">
            <UpcomingMeetingsWidget
              programId={submissionProgram.id}
              currentPhase={activePhase}
            />
          </div>

          {/* Widget des tâches globales */}
          <div className="widget-card">
            <OverallTasksWidget
              programId={submissionProgram.id}
              currentPhase={activePhase}
            />
          </div>

          {/* Widget des ressources */}
          <div className="widget-card">
            <ResourcesWidget
              programId={submissionProgram.id}
              resources={submissionProgram.resources || []}
            />
          </div>

          {/* Widget des livrables */}
          <div className="widget-card">
            <DeliverablesWidget
              programId={submissionProgram.id}
              currentPhase={activePhase}
            />
          </div>

          {/* Widget des critères d'évaluation */}
          <div className="widget-card full-width">
            <EvaluationCriteriaWidget
              programId={submissionProgram.id}
              criteria={submissionProgram.evaluationCriteria || []}
            />
          </div>

          {/* Widget des critères d'éligibilité */}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;