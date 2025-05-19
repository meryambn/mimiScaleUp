import { useState, useEffect } from 'react';

interface Livrable {
  id: number;
  nom: string;
  description: string;
  date_echeance: string;
  types_fichiers: string[];
  phase_id: number;
  status?: 'approved' | 'pending' | 'rejected' | 'not-submitted';
  size?: string;
}

export const useLivrables = (phaseId: number) => {
  const [livrables, setLivrables] = useState<Livrable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLivrables = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/liverable/get/${phaseId}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des livrables');
        }
        const data = await response.json();
        setLivrables(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    if (phaseId) {
      fetchLivrables();
    }
  }, [phaseId]);

  const createLivrable = async (livrableData: Omit<Livrable, 'id'>) => {
    try {
      const response = await fetch(`/api/liverable/create/${phaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(livrableData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du livrable');
      }

      const newLivrable = await response.json();
      setLivrables(prev => [...prev, newLivrable]);
      return newLivrable;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  const deleteLivrable = async (livrableId: number) => {
    try {
      const response = await fetch(`/api/liverable/delete/${livrableId}/${phaseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du livrable');
      }

      setLivrables(prev => prev.filter(l => l.id !== livrableId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  return {
    livrables,
    loading,
    error,
    createLivrable,
    deleteLivrable,
  };
}; 