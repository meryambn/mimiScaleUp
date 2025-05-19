import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Video,
  MessageSquare,
  Award,
  Star,
  PlusCircle,
  Download,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Users,
  Calendar as CalendarIcon,
  Tasks,
  ArrowUp,
  ArrowDown,
  LineChart,
  Lightbulb,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, isBefore, isToday } from 'date-fns';
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
  FaUserPlus,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage
} from 'react-icons/fa';
import { IconType } from 'react-icons';
import DynamicProgramTimeline from '@/components/widgets/DynamicProgramTimeline';
import ProgramDetailsWidget from '@/components/widgets/ProgramDetailsWidget';
import { useProgramme } from '@/hooks/useProgramme';
import { useDeliverables } from '@/context/DeliverablesContext';
import { getReunions, getTasks } from '../services/programService';
import { getProgramResources } from '../services/resourceService';

interface Deliverable {
  id: number;
  nom: string;
  description: string;
  date_echeance: string;
  types_fichiers: string[];
  phase_id: number;
  status?: 'submitted' | 'pending' | 'approved' | 'rejected';
}

interface Task {
  id: number;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignee: string;
}

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  isOnline: boolean;
  location?: string;
}

interface Resource {
  id: number;
  title: string;
  description?: string;
  type: string;
  is_external: boolean;
  file_path?: string;
  url?: string;
  created_at: string;
  program_id: number;
  category?: string;
}

interface DashboardProps {
  onCreateTeamClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateTeamClick }) => {
  const [activePhase, setActivePhase] = useState<number | string>(1);
  const [sidebarActive, setSidebarActive] = useState(false);
  const { programme, loading, error } = useProgramme();
  const { upcomingDeliverables, getStatusText } = useDeliverables();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loadingDeliverables, setLoadingDeliverables] = useState(true);
  const [errorDeliverables, setErrorDeliverables] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [errorResources, setErrorResources] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        setLoadingDeliverables(true);
        const response = await fetch(`/api/liverable/get/${activePhase}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des livrables');
        }
        const data = await response.json();
        setDeliverables(data);
      } catch (err) {
        setErrorDeliverables(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoadingDeliverables(false);
      }
    };

    fetchDeliverables();
  }, [activePhase]);

  useEffect(() => {
    const fetchResources = async () => {
      if (!programme?.id) {
        setLoadingResources(false);
        return;
      }

      try {
        setLoadingResources(true);
        const { resources, externalResources } = await getProgramResources(programme.id);
        
        // Combine regular and external resources with proper typing
        const allResources: Resource[] = [
          ...(resources || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            type: r.type,
            is_external: false,
            file_path: r.file_path,
            created_at: r.created_at,
            program_id: r.program_id,
            category: r.category
          })),
          ...(externalResources || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            type: r.type || 'Autre',
            is_external: true,
            url: r.url,
            created_at: r.created_at,
            program_id: r.program_id,
            category: r.category
          }))
        ];

        // Sort resources by creation date (newest first)
        allResources.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setResources(allResources);
      } catch (err) {
        console.error('Erreur lors de la récupération des ressources:', err);
        setErrorResources(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, [programme?.id]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasksData = await getTasks(activePhase);
        setTasks(tasksData.map((task: any) => ({
          id: task.id,
          title: task.nom,
          status: task.status || 'todo',
          priority: task.priorite || 'medium',
          dueDate: task.date_decheance,
          assignee: task.assignee || 'Non assigné'
        })));
      } catch (err) {
        console.error('Erreur lors de la récupération des tâches:', err);
      }
    };

    fetchTasks();
  }, [activePhase]);

  useEffect(() => {
    const fetchReunions = async () => {
      try {
        const reunionsData = await getReunions(activePhase);
        setMeetings(reunionsData.map((reunion: any) => ({
          id: reunion.id,
          title: reunion.nom_reunion,
          date: reunion.date,
          time: reunion.heure,
          isOnline: reunion.lieu.toLowerCase().includes('en ligne') || reunion.lieu.toLowerCase().includes('zoom') || reunion.lieu.toLowerCase().includes('teams'),
          location: reunion.lieu
        })));
      } catch (err) {
        console.error('Erreur lors de la récupération des réunions:', err);
      }
    };

    fetchReunions();
  }, [activePhase]);

  const handleDownload = async (resourceId: number) => {
    try {
      const response = await fetch(`/api/resources/download/${resourceId}`);
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ''; // Le nom du fichier sera celui du serveur
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'document':
        return <FileText size={16} className="text-blue-500" />;
      case 'tableur':
        return <FileSpreadsheet size={16} className="text-green-500" />;
      case 'vidéo':
        return <FileImage size={16} className="text-red-500" />;
      case 'présentation':
        return <FileImage size={16} className="text-orange-500" />;
      default:
        return <File size={16} className="text-gray-500" />;
    }
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': 
        return <FileText size={16} className="text-red-500" />;
      case 'doc':
      case 'docx': 
        return <FileText size={16} className="text-blue-500" />;
      case 'xls':
      case 'xlsx': 
        return <FileSpreadsheet size={16} className="text-green-500" />;
      case 'ppt':
      case 'pptx': 
        return <FileImage size={16} className="text-orange-500" />;
      default: 
        return <File size={16} className="text-gray-500" />;
    }
  };

  // Convert activePhase to a number for phaseEvaluationCriteria if it's a string
  const getPhaseKey = (phase: number | string): number => {
    if (typeof phase === 'string') {
      const numPhase = parseInt(phase, 10);
      return isNaN(numPhase) ? 1 : numPhase;
    }
    return phase;
  };

  // Données dynamiques pour les statistiques
  const statsData = {
    teamMembers: { 
      value: programme?.mentors?.length || 0, 
      change: programme?.mentors?.length || 0 
    },
    meetingsCompleted: { 
      value: programme?.meetings_completed || 0, 
      change: programme?.meetings_completed || 0 
    },
    tasks: { 
      completed: programme?.tasks_completed || 0, 
      pending: programme?.tasks_pending || 0 
    },
    funding: { 
      amount: `${programme?.ca_min || 0}K DA`, 
      target: `${programme?.ca_max || 0}K DA` 
    },
    kpis: [
      { 
        name: "Satisfaction", 
        value: programme?.satisfaction_rate || 0, 
        unit: "%", 
        trend: programme?.satisfaction_trend || "stable" 
      },
      { 
        name: "Engagement", 
        value: programme?.engagement_rate || 0, 
        unit: "%", 
        trend: programme?.engagement_trend || "stable" 
      },
      { 
        name: "Retention", 
        value: programme?.retention_rate || 0, 
        unit: "%", 
        trend: programme?.retention_trend || "stable" 
      }
    ]
  };

  // Données dynamiques pour les réunions à venir
  const upcomingMeetings = programme?.upcoming_meetings || [];

  // Données dynamiques pour les activités récentes
  const recentActivities = programme?.recent_activities || [];

  // Critères d'évaluation par phase
  const phaseEvaluationCriteria = programme?.phase_criteria || {
    1: [],
    2: [],
    3: [],
    4: []
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    todo: <Clock className="h-4 w-4 text-yellow-500" />,
    in_progress: <FaSpinner className="h-4 w-4 text-blue-500 animate-spin" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatTime = (time: string) => {
    return time;
  };

  if (loading) {
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
        <FaTimesCircle className="error-icon" />
        <p>{error}</p>
      </div>
    );
  }

  if (!programme) {
    return (
      <div className="no-program-container">
        <p>Aucun programme sélectionné</p>
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
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1>{programme?.nom}</h1>
            <p className="subtitle">{programme?.description}</p>
          </div>
          <div className="dashboard-actions">
            {onCreateTeamClick && (
              <button
                onClick={onCreateTeamClick}
                className="create-team-btn"
              >
                <FaUserPlus className="icon" />
                Créer une équipe
              </button>
            )}
            <div className="date-range">
              <span>Phase {activePhase} en cours</span>
              <span>Statut: {programme?.status}</span>
            </div>
          </div>
        </header>

        {/* Program Details Widget */}
        <section className="program-details-section">
          <h2>Détails du Programme</h2>
          <div className="program-details-container">
            <ProgramDetailsWidget isStartupInterface={true} />
          </div>
        </section>

        {/* Program Timeline Widget */}
        <section className="timeline-section">
          <h2>Progression du Programme</h2>
          <div className="timeline-container">
            <DynamicProgramTimeline
              onPhaseSelect={(phaseId) => setActivePhase(Number(phaseId))}
              viewType="vertical"
              showCard={false}
            />
          </div>
        </section>

        {/* Content Section */}
        <section className="content-section">
          {/* Tasks Section */}
          <div className="tasks-card">
            <div className="flex items-center justify-between mb-6">
              <h2>Tâches</h2>
              <MessageSquare className="h-5 w-5 text-pink-500" />
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-xl font-bold text-green-600">
                    {tasks.filter(t => t.status === 'completed').length}
                  </div>
                  <div className="text-xs text-green-600">Terminées</div>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xl font-bold text-blue-600">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </div>
                  <div className="text-xs text-blue-600">En cours</div>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <div className="text-xl font-bold text-yellow-600">
                    {tasks.filter(t => t.status === 'todo').length}
                  </div>
                  <div className="text-xs text-yellow-600">À faire</div>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[220px]">
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucune tâche trouvée</p>
                  </div>
                ) : (
                  tasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {statusIcons[task.status]}
                          <span className="text-sm font-medium">{task.title}</span>
                        </div>
                        <Badge className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Échéance: {formatDate(task.dueDate)}</span>
                        <span>{task.assignee}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Meetings Section */}
          <div className="meetings-card">
            <div className="flex items-center justify-between mb-6">
              <h2>Réunions à venir</h2>
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>

            {meetings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune réunion programmée</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {meetings.slice(0, 4).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="bg-white rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{meeting.title}</h4>
                        </div>
                        <button className="px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors">
                          Rejoindre
                        </button>
                      </div>

                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatDate(meeting.date)}, {formatTime(meeting.time)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {meeting.isOnline ? (
                            <>
                              <Video className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-600">Réunion en ligne</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4" />
                              <span>{meeting.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Deliverables Section */}
          <div className="deliverables-card">
            <div className="flex items-center justify-between mb-6">
              <h2>Livrables à venir</h2>
              <FaFileAlt className="h-5 w-5 text-indigo-500" />
            </div>
            {loadingDeliverables ? (
              <div className="flex justify-center items-center h-40">
                <FaSpinner className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : errorDeliverables ? (
              <div className="text-center py-8 text-red-500">
                <p>Erreur: {errorDeliverables}</p>
              </div>
            ) : deliverables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun livrable à venir</p>
                <p className="text-sm mt-2">Ajoutez des livrables dans la section Livrables</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliverables.slice(0, 5).map((deliverable) => {
                  const isLate = isBefore(new Date(deliverable.date_echeance), new Date()) &&
                                !isToday(new Date(deliverable.date_echeance)) &&
                                deliverable.status === 'pending';

                  return (
                    <div
                      key={deliverable.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        isLate ? "border-red-200 bg-red-50" :
                        deliverable.status === 'submitted' ? "border-green-200 bg-green-50" :
                        "border-gray-200 hover:bg-gray-50 transition-colors"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{deliverable.nom}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            Échéance {format(new Date(deliverable.date_echeance), 'dd/MM/yyyy')}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {deliverable.types_fichiers.map((type, index) => (
                              <span key={index} className="text-xs text-gray-500">
                                {getFileIcon(type.replace('.', ''))}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <div className="flex items-center text-sm">
                            {isLate ? (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : deliverable.status === 'submitted' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-500" />
                            )}
                            <span className={cn(
                              "ml-1.5",
                              isLate ? "text-red-600" :
                              deliverable.status === 'submitted' ? "text-green-600" :
                              "text-amber-600"
                            )}>
                              {getStatusText(deliverable.status, deliverable.date_echeance)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resources Section */}
          <div className="resources-card">
            <div className="flex items-center justify-between mb-6">
              <h2>Ressources</h2>
              <PlusCircle className="h-5 w-5 text-teal-500" />
            </div>

            {loadingResources ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
              </div>
            ) : errorResources ? (
              <div className="text-center py-8 text-red-500">
                <p>Erreur: {errorResources}</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune ressource disponible</p>
                <p className="text-sm mt-2">Ajoutez des ressources dans la section Ressources</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {resources.slice(0, 4).map((resource) => (
                    <div
                      key={resource.id}
                      className="bg-white rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {getResourceTypeIcon(resource.type)}
                          <div>
                            <h4 className="text-sm font-medium">{resource.title}</h4>
                            {resource.category && (
                              <Badge className="bg-teal-100 text-teal-800">
                                {resource.category}
                              </Badge>
                            )}
                            {resource.is_external && (
                              <Badge className="bg-blue-100 text-blue-800 ml-2">
                                Externe
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!resource.is_external && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDownload(resource.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {resource.is_external && resource.url && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => window.open(resource.url, '_blank')}
                          >
                            <FaFileAlt className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-500">{resource.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Ajouté le {new Date(resource.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Evaluation Criteria Section */}
          <div className="criteria-card">
            <div className="flex items-center justify-between mb-6">
              <h2>Critères d'évaluation</h2>
              <Award className="h-5 w-5 text-indigo-500" />
            </div>

            {phaseEvaluationCriteria[getPhaseKey(activePhase)]?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun critère d'évaluation pour cette phase</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {phaseEvaluationCriteria[getPhaseKey(activePhase)]?.map((criteria, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {criteria.status === 'fulfilled' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {criteria.status === 'pending' && <FaSpinner className="h-4 w-4 text-blue-500 animate-spin" />}
                          {criteria.status === 'not-met' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          <span className="font-medium">{criteria.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, starIndex) => (
                            <Star
                              key={starIndex}
                              className={cn(
                                "h-4 w-4",
                                starIndex < criteria.stars ? "text-amber-400 fill-amber-400" : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            criteria.status === 'fulfilled' ? "bg-green-100 text-green-800" :
                            criteria.status === 'pending' ? "bg-blue-100 text-blue-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {criteria.status === 'fulfilled' ? 'Atteint' :
                             criteria.status === 'pending' ? 'En cours' :
                             'Non atteint'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: #f9fafb;
        }

        .loading-container,
        .error-container,
        .no-program-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
        }

        .spinner {
          font-size: 2rem;
          color: #e43e32;
          animation: spin 2s linear infinite;
        }

        .error-icon {
          font-size: 2rem;
          color: #ef4444;
        }

        .main-content {
          flex: 1;
          padding: 2rem;
          padding-top: 100px;
          position: relative;
          margin-left: 280px;
          min-height: 100vh;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 1.4rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .subtitle {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

        .dashboard-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1rem;
        }

        .create-team-btn {
          background: linear-gradient(135deg, #e43e32 0%, #0c4c80 100%);
          color: white;
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          border: none;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .create-team-btn:hover {
          opacity: 0.9;
        }

        .create-team-btn .icon {
          margin-right: 8px;
          font-size: 0.9rem;
        }

        .date-range {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          color: #6b7280;
          font-size: 0.9rem;
        }

        /* Phases Section */
        .phases-section, .timeline-section, .program-details-section {
          margin-bottom: 2rem;
        }

        .phases-section h2, .timeline-section h2, .program-details-section h2 {
          font-size: 1.3rem;
          color: #111827;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .timeline-container, .program-details-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .phases-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .phase-card {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.3s ease;
          border-left: 4px solid #e5e7eb;
        }

        .phase-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }

        .phase-card.active {
          border-left-color: #e43e32;
          background-color: rgba(228, 62, 50, 0.05);
          box-shadow: 0 10px 15px rgba(228, 62, 50, 0.1);
        }

        .phase-number {
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .phase-name {
          font-size: 1.2rem;
          color: #374151;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .phase-progress {
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background-color: #e43e32;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .phase-status {
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
        }

        .status-completed {
          color: #10b981;
        }

        .status-in-progress {
          color: #f59e0b;
        }

        .status-upcoming {
          color: #6b7280;
        }

        .spin {
          animation: spin 2s linear infinite;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: rgba(228, 62, 50, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e43e32;
          font-size: 1.25rem;
        }

        .stat-content {
          flex: 1;
        }

        .stat-content h3 {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .stat-change {
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .stat-change.positive {
          color: #10b981;
        }

        .stat-change.negative {
          color: #ef4444;
        }

        .task-progress {
          margin-top: 0.75rem;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .progress-bar-container {
          height: 6px;
          background-color: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        /* Content Section */
        .content-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 1200px) {
          .content-section {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 1.5rem;
            padding-top: 100px;
            margin-left: 0;
          }

          .content-section {
            grid-template-columns: 1fr;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .dashboard-actions {
            width: 100%;
            align-items: flex-start;
          }

          .date-range {
            align-items: flex-start;
          }
        }

        .tasks-card,
        .meetings-card,
        .deliverables-card,
        .resources-card,
        .criteria-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .tasks-card h2,
        .meetings-card h2,
        .deliverables-card h2,
        .resources-card h2,
        .criteria-card h2 {
          font-size: 1.25rem;
          color: #111827;
          margin: 0;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;