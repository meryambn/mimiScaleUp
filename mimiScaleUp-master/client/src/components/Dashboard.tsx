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
import StartupEvaluationWidget from '@/components/widgets/StartupEvaluationWidget';
import EligibilityCriteriaWidget from '@/components/widgets/EligibilityCriteriaWidget';
import TeamWidget from '@/components/widgets/TeamWidget';
import { useAuth } from '@/context/AuthContext';
import { checkSubmissionAccepted } from '@/services/teamService';
import { getSubmissionsByProgram } from '@/services/formService';
import {
  getAllPrograms,
  getProgram,
  getPhases,
  getTasks,
  getReunions,
  getLivrables
} from '@/services/programService';
import { getProgramResources } from '@/services/resourceService';
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
  // Default to 0 (no phase selected) to show all data
  const [activePhase, setActivePhase] = useState<number | string>(0);
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
              console.log(`DASHBOARD: About to fetch resources for program ${programDetails.id}...`);
              let resources = [];
              try {
                // Log the function we're about to call
                console.log(`DASHBOARD: Calling getProgramResources(${programDetails.id})`);

                // Try a direct fetch to the API endpoint first to check if it's working
                try {
                  console.log(`DASHBOARD: Trying direct fetch to /api/resources/program/${programDetails.id}`);
                  const directResponse = await fetch(`/api/resources/program/${programDetails.id}`, {
                    method: 'GET',
                    headers: {
                      'Accept': 'application/json'
                    },
                    credentials: 'include'
                  });

                  console.log(`DASHBOARD: Direct fetch response status:`, directResponse.status);
                  if (directResponse.ok) {
                    const directResult = await directResponse.json();
                    console.log(`DASHBOARD: Direct fetch result:`, directResult);
                  } else {
                    console.error(`DASHBOARD: Direct fetch failed with status ${directResponse.status}`);
                    const errorText = await directResponse.text();
                    console.error(`DASHBOARD: Direct fetch error text:`, errorText);
                  }
                } catch (directFetchError) {
                  console.error(`DASHBOARD: Direct fetch threw an error:`, directFetchError);
                }

                // Call the function with explicit error handling
                let resourcesResult;
                try {
                  resourcesResult = await getProgramResources(programDetails.id);
                  console.log(`DASHBOARD: getProgramResources returned:`, resourcesResult);
                } catch (fetchError) {
                  console.error(`DASHBOARD: getProgramResources threw an error:`, fetchError);
                  throw fetchError;
                }

                // Check if we got a valid result
                if (!resourcesResult) {
                  console.warn(`DASHBOARD: getProgramResources returned null or undefined`);
                  resourcesResult = { resources: [], externalResources: [] };
                }

                // Check if the result has the expected properties
                if (!Array.isArray(resourcesResult.resources)) {
                  console.warn(`DASHBOARD: resourcesResult.resources is not an array:`, resourcesResult.resources);
                  resourcesResult.resources = [];
                }

                if (!Array.isArray(resourcesResult.externalResources)) {
                  console.warn(`DASHBOARD: resourcesResult.externalResources is not an array:`, resourcesResult.externalResources);
                  resourcesResult.externalResources = [];
                }

                console.log(`DASHBOARD: Fetched resources for program ${programDetails.id}:`, {
                  resources: resourcesResult.resources.length,
                  externalResources: resourcesResult.externalResources.length
                });

                // Combine both types of resources
                resources = [
                  ...resourcesResult.resources,
                  ...resourcesResult.externalResources.map(r => ({
                    ...r,
                    type: 'link',
                    is_external: true
                  }))
                ];

                console.log(`DASHBOARD: Combined ${resources.length} resources for program ${programDetails.id}`);
              } catch (error) {
                console.error(`DASHBOARD: Error fetching resources for program ${programDetails.id}:`, error);
                resources = [];
              } finally {
                console.log(`DASHBOARD: Final resources array:`, resources);
              }

              // Format date function to get only the date part
              const formatDateString = (dateStr) => {
                if (!dateStr) return new Date().toISOString().split('T')[0];
                // If it's already just a date (YYYY-MM-DD), return it
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
                // Otherwise, extract the date part from the timestamp
                return dateStr.split('T')[0];
              };

              // Vérifier et formater les dates si nécessaire
              const formattedProgram = {
                ...programDetails,
                startDate: formatDateString(programDetails.startDate || programDetails.date_debut || new Date().toISOString()),
                endDate: formatDateString(programDetails.endDate || programDetails.date_fin || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
                // Ensure we have a name property that matches what the UI expects
                name: programDetails.nom || programDetails.name || "Programme sans nom",
                // Ensure we have a description property
                description: programDetails.description || "Aucune description disponible",
                // Add the detailed phases
                phases: phasesWithDetails,
                // Add resources
                resources: resources
              };

              // Log the resources in the formatted program
              console.log('DASHBOARD: Resources in formattedProgram:', {
                resourcesArray: resources,
                resourcesLength: resources.length,
                resourcesInProgram: formattedProgram.resources,
                resourcesInProgramLength: formattedProgram.resources ? formattedProgram.resources.length : 'undefined'
              });
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
              {activePhase && Number(activePhase) > 0 ? (
                <>
                 
                  <span>{getPhaseDescription(activePhase)}</span>
                </>
              ) : (
                <span>Toutes les phases</span>
              )}
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

          {/* Widget des équipes et startups */}
         

          {/* Widget de la timeline */}
            <div className="widget-card">
            {/* Add debugging for phases */}
            {console.log('Dashboard - Phases being passed to DynamicProgramTimeline:',
              submissionProgram.phases ?
                `${submissionProgram.phases.length} phases: ${JSON.stringify(submissionProgram.phases.map(p => ({ id: p.id, name: p.name })))}` :
                'No phases'
            )}
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
            {console.log('Dashboard - Meetings being passed to UpcomingMeetingsWidget:',
              submissionProgram.phases ?
                submissionProgram.phases.flatMap(phase => phase.meetings || []) :
                'No meetings'
            )}
            <UpcomingMeetingsWidget
              programId={submissionProgram.id}
              currentPhase={activePhase}
              meetings={submissionProgram.phases ?
                submissionProgram.phases.flatMap(phase =>
                  (phase.meetings || []).map(meeting => ({
                    ...meeting,
                    phaseId: phase.id,
                    title: meeting.nom_reunion || meeting.title || 'Réunion sans titre',
                    date: meeting.date || new Date().toISOString(),
                    time: meeting.heure || '09:00',
                    location: meeting.lieu || 'À déterminer',
                    isOnline: meeting.is_online || false
                  }))
                ) : []
              }
            />
          </div>

          {/* Widget des tâches globales */}
          <div className="widget-card">
            {console.log('Dashboard - Tasks being passed to OverallTasksWidget:',
              submissionProgram.phases ?
                submissionProgram.phases.flatMap(phase => phase.tasks || []) :
                'No tasks'
            )}
            <OverallTasksWidget
              programId={submissionProgram.id}
              currentPhase={activePhase}
              tasks={submissionProgram.phases ?
                submissionProgram.phases.flatMap(phase =>
                  (phase.tasks || []).map(task => ({
                    ...task,
                    phaseId: phase.id,
                    title: task.nom || task.title || 'Tâche sans titre',
                    description: task.description || '',
                    status: task.status || 'todo',
                    priority: task.priority || 'medium',
                    dueDate: task.date_echeance || task.dueDate || new Date().toISOString(),
                    assignee: task.assignee || 'Non assigné'
                  }))
                ) : []
              }
            />
          </div>

          {/* Widget des ressources */}
          <div className="widget-card">
            {console.log('Dashboard - Resources being passed to ResourcesWidget:',
              submissionProgram.resources ?
                `${submissionProgram.resources.length} resources` :
                'No resources'
            )}
            {console.log('Dashboard - Resources details:', submissionProgram.resources)}
            <ResourcesWidget
              programId={submissionProgram.id}
              resources={submissionProgram.resources || []}
            />
          </div>

          {/* Widget des livrables */}
          <div className="widget-card">
            {console.log('Dashboard - Deliverables being passed to DeliverablesWidget:',
              submissionProgram.phases ?
                submissionProgram.phases.flatMap(phase => phase.deliverables || []) :
                'No deliverables'
            )}
            <DeliverablesWidget
              programId={submissionProgram.id}
              currentPhase={activePhase}
              deliverables={submissionProgram.phases ?
                submissionProgram.phases.flatMap(phase =>
                  (phase.deliverables || []).map(deliverable => ({
                    ...deliverable,
                    phaseId: phase.id,
                    name: deliverable.nom || deliverable.name || 'Livrable sans titre',
                    description: deliverable.description || '',
                    status: deliverable.status || 'pending',
                    dueDate: deliverable.date_echeance || deliverable.dueDate || new Date().toISOString()
                  }))
                ) : []
              }
            />
          </div>
         < div className="widget-card">
            <TeamWidget programId={submissionProgram?.id} />
          </div>

          {/* Widget des critères d'évaluation */}
          <div className="widget-card full-width">
            <StartupEvaluationWidget />
          </div>

          {/* Widget des critères d'éligibilité */}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;