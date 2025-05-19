import { useState, useEffect } from 'react';
import { useProgramContext } from '@/context/ProgramContext';

interface Phase {
  id: number;
  nom: string;
  description: string;
  date_debut: string;
  date_fin: string;
  programme_id: number;
  gagnant: boolean;
}

interface ProgrammePhases {
  phases: Phase[];
  loading: boolean;
  error: string | null;
}

export const useProgrammePhases = (): ProgrammePhases => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProgramId } = useProgramContext();

  useEffect(() => {
    const fetchPhases = async () => {
      try {
        setLoading(true);
        if (!selectedProgramId) {
          setPhases([]);
          return;
        }
        const response = await fetch(`/api/phase/${selectedProgramId}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des phases');
        }
        const data = await response.json();
        setPhases(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchPhases();
  }, [selectedProgramId]);

  return { phases, loading, error };
}; 