import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useLocation } from 'wouter';
import { useProgramContext } from '@/context/ProgramContext';

interface Team {
  id: number | string;
  name: string;
  logo?: string;
  industry?: string;
  currentPhase: string;
  progress: number;
  status: string;
  programId: string;
}

const WinnerTeamWidget = () => {
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null);
  const { selectedProgramId } = useProgramContext();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Charger les équipes depuis localStorage
    try {
      const storedStartups = localStorage.getItem('startups');
      let foundWinner = false;

      if (storedStartups) {
        const parsedStartups = JSON.parse(storedStartups);
        if (Array.isArray(parsedStartups)) {
          // Filtrer les équipes du programme sélectionné qui sont marquées comme gagnantes
          const winners = parsedStartups.filter(
            startup => startup.programId === selectedProgramId && startup.status === 'completed'
          );

          if (winners.length > 0) {
            setWinnerTeam(winners[0]);
            foundWinner = true;
          }
        }
      }

      // Si aucun gagnant n'a été trouvé dans localStorage, vérifier les équipes par défaut
      if (!foundWinner) {
        // Exemple d'équipes par défaut
        const sampleStartups = [
          {
            id: 5,
            name: "CyberShield",
            logo: "https://via.placeholder.com/100/F44336/FFFFFF?text=CS",
            industry: "Cybersecurity",
            currentPhase: "Lancement",
            progress: 95,
            status: 'completed',
            programId: "1"
          }
        ];

        // Vérifier si l'une des équipes par défaut est un gagnant pour le programme sélectionné
        const sampleWinner = sampleStartups.find(
          startup => startup.programId === selectedProgramId && startup.status === 'completed'
        );

        if (sampleWinner) {
          setWinnerTeam(sampleWinner);
          foundWinner = true;
        }
      }

      // Si aucun gagnant n'a été trouvé, vérifier les équipes par défaut pour le programme "1"
      if (!foundWinner && selectedProgramId === "1") {
        setWinnerTeam({
          id: 5,
          name: "CyberShield",
          logo: "https://via.placeholder.com/100/F44336/FFFFFF?text=CS",
          industry: "Cybersecurity",
          currentPhase: "Lancement",
          progress: 95,
          status: 'completed',
          programId: "1"
        });
      } else if (!foundWinner) {
        setWinnerTeam(null);
      }
    } catch (error) {
      console.error("Error loading startups from localStorage:", error);

      // En cas d'erreur, utiliser l'équipe par défaut pour le programme "1"
      if (selectedProgramId === "1") {
        setWinnerTeam({
          id: 5,
          name: "CyberShield",
          logo: "https://via.placeholder.com/100/F44336/FFFFFF?text=CS",
          industry: "Cybersecurity",
          currentPhase: "Lancement",
          progress: 95,
          status: 'completed',
          programId: "1"
        });
      }
    }
  }, [selectedProgramId]);

  if (!winnerTeam) {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-100 p-4 rounded-full">
            <Trophy className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">Aucun gagnant sélectionné</h3>
        <p className="text-sm text-gray-500">
          Sélectionnez un gagnant dans la dernière phase du programme.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-2">
        <div className="bg-amber-100 p-2 rounded-full mr-3">
          <Trophy className="h-5 w-5 text-amber-600" />
        </div>
        <h3 className="text-lg font-medium">Équipe gagnante du programme</h3>
      </div>

      <div
        className="flex items-center p-4 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors mt-3"
        onClick={() => setLocation(`/teams/${winnerTeam.id}`)}
      >
        {winnerTeam.logo ? (
          <img
            src={winnerTeam.logo}
            alt={`${winnerTeam.name} logo`}
            className="w-16 h-16 rounded-full object-cover mr-4"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center mr-4">
            {winnerTeam.name.charAt(0)}
          </div>
        )}

        <div className="flex-1">
          <h4 className="font-medium text-lg text-amber-800">{winnerTeam.name}</h4>
          {winnerTeam.industry && (
            <p className="text-sm text-amber-700">{winnerTeam.industry}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">Cliquez pour voir plus de détails</p>
        </div>

        <div className="bg-amber-200 text-amber-800 px-4 py-2 rounded-full text-sm font-medium">
          GAGNANT
        </div>
      </div>
    </div>
  );
};

export default WinnerTeamWidget;
