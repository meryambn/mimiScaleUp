import { useState, useEffect } from 'react';

interface Reunion {
  id: number;
  nom_reunion: string;
  date: string;
  heure: string;
  lieu: string;
  phase_id: number;
}

export const useReunions = (phaseId: number) => {
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReunions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reunion/get/${phaseId}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des réunions');
        }
        const data = await response.json();
        setReunions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    if (phaseId) {
      fetchReunions();
    }
  }, [phaseId]);

  const createReunion = async (reunionData: Omit<Reunion, 'id'>) => {
    try {
      const response = await fetch(`/api/reunion/create/${phaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reunionData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la réunion');
      }

      const newReunion = await response.json();
      setReunions(prev => [...prev, newReunion]);
      return newReunion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  const deleteReunion = async (reunionId: number) => {
    try {
      const response = await fetch(`/api/reunion/delete/${reunionId}/${phaseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la réunion');
      }

      setReunions(prev => prev.filter(r => r.id !== reunionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  return {
    reunions,
    loading,
    error,
    createReunion,
    deleteReunion,
  };
}; 