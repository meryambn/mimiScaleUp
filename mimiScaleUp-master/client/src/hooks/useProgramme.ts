import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useProgramContext } from '@/context/ProgramContext';

interface Mentor {
  utilisateur_id: number;
  nom: string;
  prenom: string;
  profession: string;
}

interface Task {
  id: string;
  nom: string;
  description: string;
  date_echeance: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface Meeting {
  id: string;
  nom_reunion: string;
  date: string;
  heure: string;
  lieu: string;
}

interface Critere {
  id: number;
  nom_critere: string;
  type: 'etoiles' | 'numerique' | 'oui_non' | 'liste_deroulante';
  poids: number;
}

interface Programme {
  id: string;
  nom: string;
  description: string;
  status: string;
  activePhase: number;
  tasks: Task[];
  reunions: Meeting[];
  mentors: any[];
  meetings_completed: number;
  tasks_completed: number;
  tasks_pending: number;
  ca_min: number;
  ca_max: number;
  satisfaction_rate: number;
  satisfaction_trend: string;
  engagement_rate: number;
  engagement_trend: string;
  retention_rate: number;
  retention_trend: string;
  criteres: Critere[];
}

interface RouteParams {
  id?: string;
}

export const useProgramme = () => {
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProgram } = useProgramContext();
  const params = useParams<RouteParams>();

  useEffect(() => {
    const fetchProgramme = async () => {
      try {
        setLoading(true);
        const programmeId = params?.id || selectedProgram?.id;
        
        if (!programmeId) {
          setError('Aucun programme sélectionné');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/programmes/${programmeId}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du programme');
        }
        const data = await response.json();
        setProgramme(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchProgramme();
  }, [params?.id, selectedProgram?.id]);

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la tâche');
      }

      const updatedTask = await response.json();
      setProgramme(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tasks: prev.tasks.map(task => 
            task.id === taskId ? { ...task, ...updatedTask } : task
          ),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const updateMeeting = async (meetingId: string, updates: Partial<Meeting>) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la réunion');
      }

      const updatedMeeting = await response.json();
      setProgramme(prev => {
        if (!prev) return null;
        return {
          ...prev,
          reunions: prev.reunions.map(meeting => 
            meeting.id === meetingId ? { ...meeting, ...updatedMeeting } : meeting
          ),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  return {
    programme,
    loading,
    error,
    updateTask,
    updateMeeting,
  };
}; 