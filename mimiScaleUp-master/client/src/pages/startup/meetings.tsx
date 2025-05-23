import React, { useState, useEffect } from 'react';
import {
  FaCalendarAlt,
  FaClock,
  FaUserFriends,
  FaVideo,
  FaChevronRight,
  FaPlus,
  FaTimes,
  FaBell,
  FaEllipsisV
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import ProgramPhaseTimeline from '@/components/widgets/ProgramPhaseTimeline';
import CalendarView from '@/components/meetings/CalendarView';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  ListFilter,
  Search,
  List,
} from "lucide-react";
import { useProgramContext } from '@/context/ProgramContext';
import { useMeetings, Meeting } from '@/context/MeetingsContext';
import { useAuth } from '@/context/AuthContext';
import { getAllPrograms, getProgram, getPhases, getReunions, updateProgramStatus } from '@/services/programService';
import { getSubmissionsByProgram } from '@/services/formService';
import { checkSubmissionAccepted } from '@/services/teamService';
import { FrontendStatus } from '@/utils/statusMapping';
import ProgramAccessGuard from '@/components/guards/ProgramAccessGuard';

// Interface spécifique pour les phases de la timeline
interface TimelinePhase {
  id: number | string;
  name: string;
  color: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'not_started';
}

const StartupMeetingsPage = () => {
  const { selectedProgram, selectedPhaseId, setSelectedPhaseId, setSelectedProgram } = useProgramContext();
  const { user } = useAuth();
  const {
    upcomingMeetings,
    pastMeetings,
    searchQuery,
    setSearchQuery,
    formatDate,
    formatTime,
    formatAttendees
  } = useMeetings();
  const [activePhase, setActivePhase] = useState<string>('all');
  const [activeView, setActiveView] = useState<"list" | "calendar">("list");
  const [viewTab, setViewTab] = useState<"upcoming" | "past">("upcoming");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [submissionProgram, setSubmissionProgram] = useState<any>(null);

  // Add debugging for phases
  useEffect(() => {
    console.log('Active Phase:', activePhase);
    console.log('Phases:', phases);
  }, [activePhase, phases]);

  // Fetch submission program info and details
  useEffect(() => {
    const fetchSubmissionProgramInfo = async () => {
      if (!user?.id) {
        console.log('Pas d\'utilisateur connecté');
        setError('Vous devez être connecté pour accéder aux réunions');
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

        // Set the submission program for ProgramAccessGuard
        setSubmissionProgram(programDetails);

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

        // Fetch meetings for all phases
        const allMeetings: Meeting[] = [];
        const phasesWithDetails = await Promise.all(
          phases.map(async (phase) => {
            try {
              // Update program status to active
              await updateProgramStatus(programDetails.id, 'active' as FrontendStatus);

              // Fetch meetings (reunions) for this phase
              console.log(`Fetching meetings for phase ${phase.id}...`);
              const meetings = await getReunions(phase.id);
              console.log(`Fetched ${meetings ? meetings.length : 0} meetings for phase ${phase.id}:`, meetings);

              // Format meetings for this phase
              const formattedMeetings = (meetings || []).map(meeting => ({
                id: String(meeting.id),
                title: meeting.nom_reunion || meeting.title || 'Réunion sans titre',
                date: meeting.date || new Date().toISOString(),
                time: meeting.heure || '09:00',
                duration: meeting.duration || 60,
                type: meeting.type || 'group',
                location: meeting.lieu || meeting.location || 'À déterminer',
                attendees: meeting.attendees || [],
                phaseId: String(phase.id),
                description: meeting.description || '',
                isCompleted: new Date(meeting.date) < new Date(),
                hasNotes: false,
                isOnline: (meeting.lieu?.toLowerCase().includes('online') || meeting.lieu?.toLowerCase().includes('zoom')) || false,
                programId: String(programDetails.id)
              }));

              // Add to all meetings
              allMeetings.push(...formattedMeetings);

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
                color: phase.color || '#818cf8',
                meetings: formattedMeetings
              };
            } catch (error) {
              console.error(`Error fetching details for phase ${phase.id}:`, error);
              return {
                ...phase,
                id: String(phase.id),
                name: phase.nom || phase.name || `Phase ${phase.id}`,
                description: phase.description || '',
                startDate: formatDateString(phase.date_debut),
                endDate: formatDateString(phase.date_fin),
                status: 'not_started',
                color: '#818cf8',
                meetings: []
              };
            }
          })
        );

        console.log('All meetings:', allMeetings);
        setMeetings(allMeetings);
        setPhases(phasesWithDetails);

        // Set the first phase as active by default if not already set
        if (phasesWithDetails.length > 0 && activePhase === 'all') {
          setActivePhase(phasesWithDetails[0].id);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du programme:', error);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissionProgramInfo();
  }, [user?.id, user?.role, activePhase]);

  // Filter meetings by active phase and search query
  const filterMeetings = (meetingsList: Meeting[]) => {
    return meetingsList.filter(meeting => {
      const matchesPhase = activePhase === 'all' || String(meeting.phaseId) === String(activePhase);
      const matchesSearch =
        searchQuery.trim() === '' ||
        meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (meeting.description && meeting.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesPhase && matchesSearch;
    });
  };

  // Separate upcoming and past meetings
  const now = new Date();
  const allFilteredMeetings = filterMeetings(meetings);
  const availableMeetings = allFilteredMeetings.filter(m => new Date(m.date) >= now);
  const allPastMeetings = allFilteredMeetings.filter(m => new Date(m.date) < now);

  const handlePhaseChange = (phase: string | null) => {
    if (phase === null) {
      setActivePhase('all');
    } else {
      setActivePhase(phase);
    }
  };

  // Format date helper
  const formatMeetingDate = (dateString: string | Date) => {
    try {
      if (!dateString) return 'Date non définie';
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      if (isNaN(date.getTime())) return 'Date non définie';

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

  // Format time helper
  const formatMeetingTime = (timeString: string) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5); // Just get HH:MM
  };

  const getPhaseById = (phaseId: string) => {
    return phases.find(phase => String(phase.id) === String(phaseId));
  };

  // Add loading state for phases
  const isLoadingPhases = !phases || phases.length === 0;

  return (
    <div className="meetings-container">
      <Sidebar />

      {/* Main Content */}
      <ProgramAccessGuard programId={submissionProgram?.id || ''}>
        <main className="main-content">
          {/* Header */}
          <header className="meetings-header">
            <div>
              <h1>Réunions</h1>
              <p className="subtitle">Vos sessions de collaboration par phase</p>
              <p className="text-xs text-gray-400">
                Total des réunions: {meetings.length} (À venir: {availableMeetings.length}, Passées: {allPastMeetings.length})
              </p>
            </div>
          <div className="flex space-x-2">
            <div className="flex bg-muted rounded-md p-1">
              <button
                onClick={() => setActiveView("list")}
                className={`rounded-sm flex items-center gap-2 px-3 py-1 ${
                  activeView === "list" ? 'bg-primary text-white' : 'text-primary'
                }`}
              >
                <List className="h-4 w-4" />
                Liste
              </button>
              <button
                onClick={() => setActiveView("calendar")}
                className={`rounded-sm flex items-center gap-2 px-3 py-1 ${
                  activeView === "calendar" ? 'bg-primary text-white' : 'text-primary'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Calendrier
              </button>
            </div>
          </div>
        </header>

        {/* Phases Navigation */}
        <section className="phases-section">
          {isLoadingPhases ? (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Chargement des phases...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Chronologie des phases du programme</h2>
                <p className="text-sm text-gray-500">Cliquez sur une phase pour filtrer les réunions</p>
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
                          ${activePhase === phase.id ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500 z-10' : ''}
                        `}
                        style={{
                          width,
                          backgroundColor: phase.color,
                          opacity: phase.status === 'not_started' ? 0.5 : 1,
                          zIndex: phases.length - i
                        }}
                        onClick={() => handlePhaseChange(phase.id)}
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
                      className={`text-xs p-2 rounded ${activePhase === phase.id ? 'bg-gray-100' : ''}`}
                    >
                      <div className="font-medium">{phase.name}</div>
                      <div className="text-gray-500">
                        {formatMeetingDate(phase.startDate)} - {formatMeetingDate(phase.endDate)}
                      </div>
                      <div className="mt-1 flex items-center">
                        <CalendarDays className="h-3 w-3 mr-1 text-gray-500" />
                        <span>{phase.meetings?.length || 0} Réunions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={`Rechercher des réunions ${activePhase === 'all' ? 'dans toutes les phases' : `pour la phase ${activePhase}`}...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <ListFilter className="h-4 w-4" />
              Filtrer
            </button>
          </div>
        </div>

        {activePhase !== 'all' && (
          <div className="mb-6 px-4 py-3 bg-blue-50 rounded-lg flex justify-between items-center">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: getPhaseById(activePhase)?.color }}
              ></div>
              <span className="font-medium">
                Filtré par phase : {getPhaseById(activePhase)?.name}
              </span>
            </div>
            <button
              onClick={() => handlePhaseChange(null)}
              className="text-primary hover:text-primary/80"
            >
              Effacer
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Chargement...</span>
              </div>
              <p className="mt-2 text-gray-600">Chargement des réunions...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Erreur!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Meeting Content */}
        {!isLoading && !error && (
          activeView === "calendar" ? (
            <CalendarView
              meetings={meetings}
              getPhaseById={getPhaseById}
            />
          ) : (
            <Tabs defaultValue="upcoming" onValueChange={(value) => setViewTab(value as "upcoming" | "past")}>
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming">
                  Réunions à venir {activePhase !== 'all' && `- Phase ${activePhase}`} ({availableMeetings.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Réunions passées {activePhase !== 'all' && `- Phase ${activePhase}`} ({allPastMeetings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                <section className="meetings-list">
                  <AnimatePresence>
                    {availableMeetings.length > 0 ? (
                      availableMeetings.map(meeting => (
                        <motion.div
                          key={meeting.id}
                          className="meeting-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ y: -5 }}
                        >
                          <div className="card-header">
                            <h3 className="meeting-title">{meeting.title}</h3>
                            <div className="card-actions">
                              <button className="icon-btn">
                                <FaBell />
                              </button>
                              <button className="icon-btn">
                                <FaEllipsisV />
                              </button>
                            </div>
                          </div>

                          <div className="meeting-details">
                            <div className="detail">
                              <FaCalendarAlt className="icon" />
                              <span>{formatMeetingDate(meeting.date)}</span>
                            </div>

                            <div className="detail">
                              <FaClock className="icon" />
                              <span>{formatMeetingTime(meeting.time)}</span>
                            </div>

                            <div className="detail">
                              <FaUserFriends className="icon" />
                              <span>{meeting.attendees?.length || 0} participants</span>
                            </div>
                          </div>

                          <div className="card-footer">
                            <motion.button
                              className="secondary-btn"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              Détails <FaChevronRight />
                            </motion.button>
                            <motion.button
                              className="primary-btn"
                              whileHover={{ scale: 1.03, boxShadow: "0 2px 10px rgba(228, 62, 50, 0.3)" }}
                              whileTap={{ scale: 0.97 }}
                              disabled={!meeting.isOnline}
                            >
                              <FaVideo /> {meeting.isOnline ? 'Rejoindre' : 'En présentiel'}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <p>Aucune réunion à venir {activePhase !== 'all' && `pour la phase ${activePhase}`}</p>
                      </div>
                    )}
                  </AnimatePresence>
                </section>
              </TabsContent>

              <TabsContent value="past">
                <section className="meetings-list">
                  <AnimatePresence>
                    {allPastMeetings.length > 0 ? (
                      allPastMeetings.map(meeting => (
                        <motion.div
                          key={meeting.id}
                          className="meeting-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ y: -5 }}
                        >
                          <div className="card-header">
                            <h3 className="meeting-title">{meeting.title}</h3>
                            <div className="card-actions">
                              <button className="icon-btn">
                                <FaBell />
                              </button>
                              <button className="icon-btn">
                                <FaEllipsisV />
                              </button>
                            </div>
                          </div>

                          <div className="meeting-details">
                            <div className="detail">
                              <FaCalendarAlt className="icon" />
                              <span>{formatMeetingDate(meeting.date)}</span>
                            </div>

                            <div className="detail">
                              <FaClock className="icon" />
                              <span>{formatMeetingTime(meeting.time)}</span>
                            </div>

                            <div className="detail">
                              <FaUserFriends className="icon" />
                              <span>{meeting.attendees?.length || 0} participants</span>
                            </div>
                          </div>

                          <div className="card-footer">
                            <motion.button
                              className="secondary-btn"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              Détails <FaChevronRight />
                            </motion.button>
                            <motion.button
                              className="primary-btn"
                              disabled={true}
                              style={{ backgroundColor: '#9ca3af', cursor: 'not-allowed' }}
                            >
                              <FaVideo /> {meeting.isOnline ? 'Terminée' : 'Indisponible'}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <p>Aucune réunion passée {activePhase !== 'all' && `pour la phase ${activePhase}`}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Les réunions passées apparaîtront ici.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </section>
              </TabsContent>
            </Tabs>
          )
        )}
      </main>
      </ProgramAccessGuard>

      {/* CSS Styles */}
      <style>{`
        .meetings-container {
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

        .meetings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .meetings-header h1 {
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
          background: #0c4c80;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-btn:hover {
          background: #0a3d66;
        }

        .primary-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        /* Phases Navigation */
        .phases-section {
          margin-bottom: 1.5rem;
        }

        /* Meetings List */
        .meetings-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .empty-state {
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

        .meeting-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border-left: 4px solid #0c4c80;
        }

        .meeting-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .meeting-title {
          font-size: 1.25rem;
          color: #111827;
          margin: 0;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.25rem;
          font-size: 1rem;
        }

        .meeting-details {
          margin: 1rem 0;
        }

        .detail {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
          color: #4a5568;
          font-size: 0.95rem;
        }

        .icon {
          margin-right: 0.75rem;
          color: #9ca3af;
          min-width: 20px;
        }

        .card-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .secondary-btn {
          background: none;
          color: #0c4c80;
          border: 1px solid #0c4c80;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .secondary-btn:hover {
          background: rgba(12, 76, 128, 0.1);
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 1rem;
            padding-top: 100px;
          }

          .meetings-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .card-footer {
            flex-direction: column;
          }

          .primary-btn, .secondary-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default StartupMeetingsPage;