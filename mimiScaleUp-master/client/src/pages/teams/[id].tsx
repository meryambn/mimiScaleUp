import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { useAuth } from '@/context/AuthContext';

import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, ArrowRight, Trash2, Download, Star, PaperclipIcon, Trophy, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import TeamMessageDialog from "@/components/messages/TeamMessageDialog";
import WinnerDialog from "@/components/teams/WinnerDialog";
import { useProgramContext } from '@/context/ProgramContext';
import { useToast } from '@/hooks/use-toast';

interface Deliverable {
  id: number;
  name: string;
  description: string;
  dueDate: string;
  submittedDate: string;
  status: 'pending' | 'submitted' | 'evaluated';
  fileUrl?: string;
  score?: number;
  phase?: string; // Phase à laquelle ce livrable appartient
}

interface EvaluationCriterion {
  id: number;
  name: string;
  weight: number;
  score?: number;
  phase?: string; // Phase à laquelle ce critère appartient
  type?: 'stars' | 'yesno' | 'numeric' | 'liste_deroulante'; // Type d'évaluation
  textValue?: string; // Pour les évaluations de type liste déroulante
  numericValue?: number; // Pour les évaluations de type numérique
  booleanValue?: boolean; // Pour les évaluations de type oui/non
  filledByTeam?: boolean; // Indique si le critère a été rempli par l'équipe
  validated?: boolean; // Indique si le critère a été validé par l'administrateur
  requiresValidation?: boolean; // Indique si le critère nécessite une validation
}

const StartupDetailPage = () => {
  const { id } = useParams();
  const [feedback, setFeedback] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [evaluationUpdated, setEvaluationUpdated] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const { selectedProgram } = useProgramContext();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  const [, setLocation] = useLocation(); // Add this line to use wouter's navigation

  // Check localStorage for teams first
  const [localStartup, setLocalStartup] = useState<any>(null);

  // Charger les données de l'équipe depuis localStorage
  const loadStartupFromLocalStorage = React.useCallback(() => {
    try {
      const storedStartups = localStorage.getItem('startups');
      if (storedStartups) {
        const parsedStartups = JSON.parse(storedStartups);
        if (Array.isArray(parsedStartups)) {
          const foundStartup = parsedStartups.find(s => String(s.id) === id);
          if (foundStartup) {
            console.log('Found startup in localStorage:', foundStartup);
            setLocalStartup(foundStartup);
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Error loading startup from localStorage:", error);
      return false;
    }
  }, [id]);

  // Charger les données au montage et lorsque l'ID change
  React.useEffect(() => {
    loadStartupFromLocalStorage();
  }, [id, loadStartupFromLocalStorage]);

  // Recharger les données lorsque l'URL change (paramètre t)
  React.useEffect(() => {
    const handleLocationChange = () => {
      loadStartupFromLocalStorage();
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [loadStartupFromLocalStorage]);

  const { data: startupData, isLoading } = useQuery({
    queryKey: ['startup', id, localStartup],
    queryFn: async () => {
      // If we found a startup in localStorage, use that
      if (localStartup) {
        return localStartup;
      }

      // Otherwise, use sample data
      const startups = {
        "1": {
          id: 1,
          name: "EcoTech Solutions",
          logo: "https://via.placeholder.com/100/00C853/FFFFFF?text=ET",
          industry: "Clean Technology",
          currentPhase: "Prototypage",
          progress: 65,
          status: 'active',
          programId: "1",
          description: "EcoTech Solutions is developing innovative solar energy storage solutions for residential and commercial applications. Their proprietary technology promises to increase energy storage efficiency by 40% while reducing costs.",
          team: [
            { name: 'Sarah Chen', role: 'CEO & Founder' },
            { name: 'Dr. Michael Rodriguez', role: 'CTO' },
            { name: 'Emma Thompson', role: 'Head of R&D' },
            { name: 'David Kim', role: 'Lead Engineer' }
          ],
          deliverables: [
            {
              id: 1,
              name: 'Analyse de Marché',
              description: 'Analyse complète du marché du stockage d\'\u00e9nergie renouvelable',
              dueDate: '2024-03-15',
              submittedDate: '2024-03-14',
              status: 'evaluated',
              fileUrl: '#',
              score: 92,
              phase: 'Idéation'
            },
            {
              id: 2,
              name: 'Plan d\'Affaires Initial',
              description: 'Plan d\'affaires préliminaire avec modèle économique',
              dueDate: '2024-03-20',
              submittedDate: '2024-03-19',
              status: 'evaluated',
              fileUrl: '#',
              score: 88,
              phase: 'Idéation'
            },
            {
              id: 3,
              name: 'Documentation du Prototype',
              description: 'Documentation technique du premier prototype fonctionnel',
              dueDate: '2024-04-01',
              submittedDate: '2024-03-30',
              status: 'submitted',
              fileUrl: '#',
              phase: 'Prototypage'
            },
            {
              id: 4,
              name: 'Rapport de Tests',
              description: 'Résultats des tests du prototype',
              dueDate: '2024-04-15',
              submittedDate: '2024-04-14',
              status: 'submitted',
              fileUrl: '#',
              phase: 'Prototypage'
            },
            {
              id: 5,
              name: 'Retours Utilisateurs',
              description: 'Synthèse des retours des premiers utilisateurs',
              dueDate: '2024-05-01',
              status: 'pending',
              phase: 'Validation'
            },
            {
              id: 6,
              name: 'Demande de Brevet',
              description: 'Demande provisoire de brevet pour la technologie de base',
              dueDate: '2024-05-15',
              status: 'pending',
              phase: 'Validation'
            },
            {
              id: 7,
              name: 'Plan de Lancement',
              description: 'Stratégie et calendrier de lancement du produit',
              dueDate: '2024-06-01',
              status: 'pending',
              phase: 'Lancement'
            }
          ],
          evaluationCriteria: [
            { id: 1, name: 'Idée Innovante', weight: 40, score: 5, phase: 'Idéation', type: 'stars' },
            { id: 2, name: 'Analyse de Marché', weight: 30, score: 4, phase: 'Idéation', type: 'stars' },
            { id: 3, name: 'Compétence de l\'Equipe', weight: 30, score: 5, phase: 'Idéation', type: 'stars' },

            { id: 4, name: 'Qualité du Prototype', weight: 35, score: 4, phase: 'Prototypage', type: 'stars' },
            { id: 5, name: 'Faisabilité Technique', weight: 35, score: 5, phase: 'Prototypage', type: 'yesno', booleanValue: true },
            { id: 6, name: 'Expérience Utilisateur', weight: 30, score: 4, phase: 'Prototypage', type: 'numeric', numericValue: 8 },

            { id: 7, name: 'Résultats des Tests', weight: 40, score: 5, phase: 'Validation', type: 'stars' },
            { id: 8, name: 'Retour Utilisateurs', weight: 30, score: 4, phase: 'Validation', type: 'numeric', numericValue: 85 },
            { id: 9, name: 'Potentiel de Croissance', weight: 30, score: 5, phase: 'Validation', type: 'text', textValue: 'Excellent potentiel avec une croissance estimée de 200% sur 2 ans.' },

            { id: 10, name: 'Stratégie de Lancement', weight: 25, score: 5, phase: 'Lancement', type: 'stars' },
            { id: 11, name: 'Plan Marketing', weight: 25, score: 4, phase: 'Lancement', type: 'yesno', booleanValue: true },
            { id: 12, name: 'Modèle Économique', weight: 25, score: 5, phase: 'Lancement', type: 'numeric', numericValue: 92 },
            { id: 13, name: 'Présentation Finale', weight: 25, score: 5, phase: 'Lancement', type: 'text', textValue: 'Présentation claire et convaincante avec démonstration efficace du produit.' }
          ],
          feedback: "The team has shown excellent technical capabilities and market understanding. Their product development timeline is on track, and they've responded well to mentorship."
        },
        "2": {
          id: 2,
          name: "HealthAI",
          logo: "https://via.placeholder.com/100/2196F3/FFFFFF?text=HAI",
          industry: "Healthcare Technology",
          currentPhase: "Validation",
          progress: 85,
          status: 'active',
          programId: "1",
          description: "HealthAI is revolutionizing medical diagnosis using advanced machine learning algorithms. Their platform can analyze medical imaging data to detect conditions with high accuracy.",
          team: [
            { name: 'Dr. James Wilson', role: 'CEO' },
            { name: 'Dr. Lisa Chang', role: 'Chief Medical Officer' },
            { name: 'Alex Kumar', role: 'AI Research Lead' },
            { name: 'Maria Garcia', role: 'Product Manager' }
          ],
          deliverables: [
            {
              id: 1,
              name: 'Clinical Trial Results',
              description: 'Results from initial clinical trials',
              dueDate: '2024-02-28',
              submittedDate: '2024-02-25',
              status: 'evaluated',
              fileUrl: '#',
              score: 95
            },
            {
              id: 2,
              name: 'FDA Application Draft',
              description: 'Draft of FDA approval application',
              dueDate: '2024-04-15',
              submittedDate: '2024-04-10',
              status: 'submitted',
              fileUrl: '#'
            }
          ],
          evaluationCriteria: [
            { id: 1, name: 'Idée Innovante', weight: 40, score: 5, phase: 'Idéation', type: 'stars' },
            { id: 2, name: 'Analyse de Marché', weight: 30, score: 4, phase: 'Idéation', type: 'stars' },
            { id: 3, name: 'Compétence de l\'Equipe', weight: 30, score: 5, phase: 'Idéation', type: 'stars' },

            { id: 4, name: 'Qualité du Prototype', weight: 35, score: 4, phase: 'Prototypage', type: 'stars' },
            { id: 5, name: 'Faisabilité Technique', weight: 35, score: 5, phase: 'Prototypage', type: 'yesno', booleanValue: true },
            { id: 6, name: 'Expérience Utilisateur', weight: 30, score: 4, phase: 'Prototypage', type: 'numeric', numericValue: 8 },

            { id: 7, name: 'Résultats des Tests', weight: 40, score: 5, phase: 'Validation', type: 'stars' },
            { id: 8, name: 'Retour Utilisateurs', weight: 30, score: 4, phase: 'Validation', type: 'numeric', numericValue: 85 },
            { id: 9, name: 'Potentiel de Croissance', weight: 30, score: 5, phase: 'Validation', type: 'text', textValue: 'Excellent potentiel avec une croissance estimée de 200% sur 2 ans.' },

            { id: 10, name: 'Stratégie de Lancement', weight: 25, score: 5, phase: 'Lancement', type: 'stars' },
            { id: 11, name: 'Plan Marketing', weight: 25, score: 4, phase: 'Lancement', type: 'yesno', booleanValue: true },
            { id: 12, name: 'Modèle Économique', weight: 25, score: 5, phase: 'Lancement', type: 'numeric', numericValue: 92 },
            { id: 13, name: 'Présentation Finale', weight: 25, score: 5, phase: 'Lancement', type: 'text', textValue: 'Présentation claire et convaincante avec démonstration efficace du produit.' }
          ],
          feedback: "Exceptional progress with clinical validation. The team has been responsive to feedback and effectively navigated regulatory challenges."
        },
        "5": {
          id: 5,
          name: "CyberShield",
          logo: "https://via.placeholder.com/100/F44336/FFFFFF?text=CS",
          industry: "Cybersecurity",
          currentPhase: "Lancement",
          progress: 95,
          status: 'active',
          programId: "1",
          description: "CyberShield a développé une solution de sécurité innovante qui utilise l'intelligence artificielle pour détecter et prévenir les cyberattaques en temps réel. Leur technologie a déjà été adoptée par plusieurs grandes entreprises.",
          team: [
            { name: 'Alexandre Dubois', role: 'CEO & Fondateur' },
            { name: 'Sophie Martin', role: 'CTO' },
            { name: 'Thomas Lefebvre', role: 'Responsable Sécurité' },
            { name: 'Julie Moreau', role: 'Développeur Principal' }
          ],
          deliverables: [
            {
              id: 1,
              name: 'Rapport de Tests de Pénétration',
              description: 'Résultats des tests de pénétration sur la plateforme',
              dueDate: '2024-01-15',
              submittedDate: '2024-01-10',
              status: 'evaluated',
              fileUrl: '#',
              score: 98
            },
            {
              id: 2,
              name: 'Documentation API',
              description: 'Documentation complète de l\'API pour l\'intégration avec d\'autres systèmes',
              dueDate: '2024-02-28',
              submittedDate: '2024-02-25',
              status: 'evaluated',
              fileUrl: '#',
              score: 95
            },
            {
              id: 3,
              name: 'Pitch Final',
              description: 'Présentation finale du produit et de la stratégie commerciale',
              dueDate: '2024-03-30',
              submittedDate: '2024-03-28',
              status: 'evaluated',
              fileUrl: '#',
              score: 99
            }
          ],
          evaluationCriteria: [
            { id: 1, name: 'Idée Innovante', weight: 40, score: 5, phase: 'Idéation', type: 'stars' },
            { id: 2, name: 'Analyse de Marché', weight: 30, score: 4, phase: 'Idéation', type: 'stars' },
            { id: 3, name: 'Compétence de l\'Equipe', weight: 30, score: 5, phase: 'Idéation', type: 'stars' },

            { id: 4, name: 'Qualité du Prototype', weight: 35, score: 4, phase: 'Prototypage', type: 'stars' },
            { id: 5, name: 'Faisabilité Technique', weight: 35, score: 5, phase: 'Prototypage', type: 'yesno', booleanValue: true },
            { id: 6, name: 'Expérience Utilisateur', weight: 30, score: 4, phase: 'Prototypage', type: 'numeric', numericValue: 8 },

            { id: 7, name: 'Résultats des Tests', weight: 40, score: 5, phase: 'Validation', type: 'stars' },
            { id: 8, name: 'Retour Utilisateurs', weight: 30, score: 4, phase: 'Validation', type: 'numeric', numericValue: 85 },
            { id: 9, name: 'Potentiel de Croissance', weight: 30, score: 5, phase: 'Validation', type: 'text', textValue: 'Excellent potentiel avec une croissance estimée de 200% sur 2 ans.' },

            { id: 10, name: 'Stratégie de Lancement', weight: 25, score: 5, phase: 'Lancement', type: 'stars' },
            { id: 11, name: 'Plan Marketing', weight: 25, score: 4, phase: 'Lancement', type: 'yesno', booleanValue: true },
            { id: 12, name: 'Modèle Économique', weight: 25, score: 5, phase: 'Lancement', type: 'numeric', numericValue: 92 },
            { id: 13, name: 'Présentation Finale', weight: 25, score: 5, phase: 'Lancement', type: 'text', textValue: 'Présentation claire et convaincante avec démonstration efficace du produit.' }
          ],
          feedback: "L'équipe CyberShield a démontré une excellence exceptionnelle tout au long du programme. Leur solution est non seulement innovante mais aussi extrêmement robuste. Ils ont été sélectionnés comme gagnants du programme Tech Accelerator 2023 pour leur impact potentiel sur l'industrie de la cybersécurité."
        }
      };

      return startups[id as keyof typeof startups] || startups["1"];
    }
  });

  // Utiliser localStartup comme source de vérité principale, avec startupData comme fallback
  const startup = React.useMemo(() => {
    return localStartup || startupData;
  }, [localStartup, startupData]);

  // State for evaluation criteria scores
  const [criteriaScores, setCriteriaScores] = useState<Record<number, number>>({});

  // Initialize scores when data is loaded
  React.useEffect(() => {
    if (startup?.evaluationCriteria && Array.isArray(startup.evaluationCriteria)) {
      const initialScores: Record<number, number> = {};
      startup.evaluationCriteria.forEach((criterion: any) => {
        if (criterion && criterion.score) {
          initialScores[criterion.id] = criterion.score;
        }
      });
      setCriteriaScores(initialScores);

      // Initialiser le score global saisi manuellement avec le score global calculé
      if (startup.overallScore !== undefined) {
        setManualOverallScore(startup.overallScore);
      } else {
        // Calculer le score global initial
        const initialOverallScore = startup.evaluationCriteria.reduce((total: number, criterion: any) => {
          const score = criterion.score || 0;
          return total + ((score / 5) * 100 * criterion.weight / 100);
        }, 0);
        setManualOverallScore(Math.round(initialOverallScore));
      }
    }

    if (startup?.feedback) {
      setFeedback(startup.feedback);
    }

    // Vérifier si l'équipe est déjà marquée comme gagnante
    if (startup?.status === 'completed') {
      setIsWinner(true);
    }

    // Initialiser la phase sélectionnée avec la phase actuelle de l'équipe
    if (startup?.currentPhase) {
      setSelectedPhase(startup.currentPhase);
    }
  }, [startup]);

  // Écouter les événements de changement de phase
  React.useEffect(() => {
    const handlePhaseChange = (event: CustomEvent) => {
      const { teamId, newPhase } = event.detail;

      // Vérifier si c'est cette équipe qui a changé de phase
      if (String(teamId) === id) {
        // Recharger les données depuis localStorage
        try {
          const storedStartups = localStorage.getItem('startups');
          if (storedStartups) {
            const parsedStartups = JSON.parse(storedStartups);
            if (Array.isArray(parsedStartups)) {
              const foundStartup = parsedStartups.find(s => String(s.id) === id);
              if (foundStartup) {
                setLocalStartup(foundStartup);

                // Forcer un rafraîchissement de la page après un court délai
                setTimeout(() => {
                  window.location.reload();
                }, 100);
              }
            }
          }
        } catch (error) {
          console.error("Error loading startup from localStorage:", error);
        }
      }
    };

    // Écouter les événements de stockage
    const handleStorageChange = () => {
      // Recharger les données depuis localStorage
      try {
        const storedStartups = localStorage.getItem('startups');
        if (storedStartups) {
          const parsedStartups = JSON.parse(storedStartups);
          if (Array.isArray(parsedStartups)) {
            const foundStartup = parsedStartups.find(s => String(s.id) === id);
            if (foundStartup) {
              setLocalStartup(foundStartup);

              // Forcer un rafraîchissement de la page après un court délai
              setTimeout(() => {
                window.location.reload();
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error("Error loading startup from localStorage:", error);
      }
    };

    // Ajouter les écouteurs d'événements
    document.addEventListener('team-phase-changed', handlePhaseChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Nettoyer les écouteurs d'événements lors du démontage
    return () => {
      document.removeEventListener('team-phase-changed', handlePhaseChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [id]);

  // Vérifier si l'équipe est dans la dernière phase et si cette phase a un gagnant
  const isInFinalPhase = React.useMemo(() => {
    if (!selectedProgram || !startup) return false;

    // Obtenir la dernière phase du programme
    const lastPhase = selectedProgram.phases[selectedProgram.phases.length - 1];

    // Vérifier si l'équipe est dans la dernière phase
    const isInLastPhase = startup.currentPhase.toLowerCase().includes(lastPhase.name.toLowerCase());

    // Vérifier si la dernière phase a un gagnant
    return isInLastPhase && lastPhase.hasWinner;
  }, [selectedProgram, startup]);

  // Fonction pour sélectionner l'équipe comme gagnante
  const handleSelectWinner = () => {
    if (!startup || !selectedProgram) return;

    // Mettre à jour l'état local
    setIsWinner(true);

    // Mettre à jour le statut de l'équipe dans localStorage
    try {
      const storedStartups = localStorage.getItem('startups');
      if (storedStartups) {
        const parsedStartups = JSON.parse(storedStartups);
        if (Array.isArray(parsedStartups)) {
          const updatedStartups = parsedStartups.map(s =>
            String(s.id) === id ? { ...s, status: 'completed' } : s
          );
          localStorage.setItem('startups', JSON.stringify(updatedStartups));

          // Mettre à jour l'équipe locale
          if (localStartup) {
            setLocalStartup({ ...localStartup, status: 'completed' });
          }
        }
      }

      // Afficher une notification
      toast({
        title: "Gagnant sélectionné",
        description: `${startup.name} a été sélectionné comme gagnant du programme.`,
      });

      // Ouvrir le dialogue de félicitations
      setWinnerDialogOpen(true);
    } catch (error) {
      console.error("Error updating startup in localStorage:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sélection du gagnant.",
        variant: "destructive"
      });
    }
  };

  // Fonction pour passer à la phase suivante
  const handleNextPhase = () => {
    if (!startup || !selectedProgram) return;

    // Trouver la phase actuelle et la phase suivante

    // Trouver l'index de la phase actuelle (méthode améliorée)
    let currentPhaseIndex = -1;

    // Méthode 1: Correspondance exacte
    currentPhaseIndex = selectedProgram.phases.findIndex(phase =>
      phase.name.toLowerCase() === startup.currentPhase.toLowerCase()
    );

    // Méthode 2: Inclusion partielle
    if (currentPhaseIndex === -1) {
      currentPhaseIndex = selectedProgram.phases.findIndex(phase =>
        startup.currentPhase.toLowerCase().includes(phase.name.toLowerCase()) ||
        phase.name.toLowerCase().includes(startup.currentPhase.toLowerCase())
      );
    }

    // Méthode 3: Recherche de numéro de phase
    if (currentPhaseIndex === -1) {
      const phaseNumberMatch = startup.currentPhase.match(/phase\s*(\d+)/i);
      if (phaseNumberMatch && phaseNumberMatch[1]) {
        const phaseNumber = parseInt(phaseNumberMatch[1]);
        if (phaseNumber > 0 && phaseNumber <= selectedProgram.phases.length) {
          currentPhaseIndex = phaseNumber - 1; // Les indices commencent à 0
        }
      }
    }

    // Méthode 4: Si aucune correspondance n'est trouvée, supposer que c'est la première phase
    if (currentPhaseIndex === -1 && selectedProgram.phases.length > 0) {
      currentPhaseIndex = 0;
    }

    // Si la phase actuelle est trouvée et ce n'est pas la dernière phase
    if (currentPhaseIndex !== -1 && currentPhaseIndex < selectedProgram.phases.length - 1) {
      // Obtenir la phase suivante
      const nextPhase = selectedProgram.phases[currentPhaseIndex + 1];

      // Mettre à jour l'équipe dans localStorage
      try {
        // Récupérer les équipes actuelles du localStorage
        let storedStartups = localStorage.getItem('startups');
        let parsedStartups = [];

        if (storedStartups) {
          parsedStartups = JSON.parse(storedStartups);
          if (!Array.isArray(parsedStartups)) {
            parsedStartups = [];
          }
        }

        // Vérifier si l'équipe existe déjà dans le localStorage
        const existingIndex = parsedStartups.findIndex(s => String(s.id) === String(id));

        // Créer une copie de l'équipe avec la nouvelle phase
        const updatedTeam = {
          ...(existingIndex >= 0 ? parsedStartups[existingIndex] : startup),
          id: id,
          currentPhase: nextPhase.name
        };

        // Mettre à jour ou ajouter l'équipe dans le tableau
        if (existingIndex >= 0) {
          parsedStartups[existingIndex] = updatedTeam;
        } else {
          parsedStartups.push(updatedTeam);
        }

        // Sauvegarder dans localStorage
        localStorage.setItem('startups', JSON.stringify(parsedStartups));

        // Mettre à jour directement l'état local avec la nouvelle phase
        if (startup) {
          const updatedStartup = { ...startup, currentPhase: nextPhase.name };
          setLocalStartup(updatedStartup);
        }

        // Forcer une mise à jour de toutes les équipes dans l'application
        window.dispatchEvent(new Event('storage'));
        // Créer un événement personnalisé pour notifier les autres composants
        const event = new CustomEvent('team-phase-changed', {
          detail: { teamId: id, newPhase: nextPhase.name }
        });
        document.dispatchEvent(event);

        // Afficher une notification
        toast({
          title: "Phase mise à jour",
          description: `${startup.name} est maintenant dans la phase "${nextPhase.name}".`,
        });
      } catch (error) {
        console.error("Error updating startup phase in localStorage:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du changement de phase.",
          variant: "destructive"
        });
      }
    } else {
      // Si c'est la dernière phase ou si la phase actuelle n'est pas trouvée
      toast({
        title: "Impossible de changer de phase",
        description: currentPhaseIndex === selectedProgram.phases.length - 1
          ? `${startup.name} est déjà dans la dernière phase.`
          : `Impossible de déterminer la phase actuelle de ${startup.name}.`,
        variant: "destructive"
      });
    }
  };

  // État local pour stocker les valeurs temporaires des critères en cours d'édition
  const [criteriaValues, setCriteriaValues] = useState<Record<number, any>>({});

  // État pour stocker le score global saisi manuellement
  const [manualOverallScore, setManualOverallScore] = useState<number>(0);

  // Fonction pour mettre à jour temporairement un critère d'évaluation sans provoquer de re-rendu
  const updateCriterion = (criterionId: number, updates: any) => {
    if (!startup || !startup.evaluationCriteria) return;

    // Mettre à jour les valeurs temporaires
    setCriteriaValues(prev => ({
      ...prev,
      [criterionId]: {
        ...(prev[criterionId] || {}),
        ...updates
      }
    }));

    // Mettre à jour les scores pour le calcul du score global
    if (updates.score !== undefined) {
      setCriteriaScores(prev => ({
        ...prev,
        [criterionId]: updates.score
      }));
    }

    console.log(`Critère ${criterionId} mis à jour temporairement:`, updates);
  };

  const handleScoreChange = (criterionId: number, score: number) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criterionId]: score
    }));

    // Mettre à jour le score dans l'objet startup
    updateCriterion(criterionId, { score });
  };

  // Fonction pour gérer la validation d'un critère
  const handleValidation = (criterionId: number, validated: boolean) => {
    // Trouver le critère concerné
    const criterion = startup?.evaluationCriteria?.find((c: any) => c.id === criterionId);
    if (!criterion) return;

    // Mettre à jour l'état de validation dans l'état temporaire
    updateCriterion(criterionId, { validated });

    // Afficher un message de confirmation
    toast({
      title: validated ? "Critère validé" : "Validation retirée",
      description: validated
        ? `Le critère "${criterion.name}" a été validé avec succès.`
        : `La validation du critère "${criterion.name}" a été retirée.`,
      variant: validated ? "default" : "destructive"
    });

    // Mettre à jour le score global si nécessaire
    if (validated && criterion.filledByTeam) {
      // Si le critère est validé et rempli par l'équipe, on peut augmenter le score
      const currentScore = criteriaScores[criterionId] || 0;
      if (currentScore < 3) { // Si le score est inférieur à 3, on l'augmente à 3 minimum
        handleScoreChange(criterionId, 3);
      }
    }
  };

  const calculateOverallScore = () => {
    const phaseCriteria = getPhaseCriteria();
    if (phaseCriteria.length === 0) {
      return 0;
    }

    return phaseCriteria.reduce((total: number, criterion: any) => {
      const score = criteriaScores[criterion.id] || 0;
      // Convert score from 0-5 scale to 0-100% scale, then apply weight
      return total + ((score / 5) * 100 * criterion.weight / 100);
    }, 0);
  };

  const handleUpdateEvaluation = () => {
    setIsUpdating(true);

    try {
      // Mettre à jour les critères d'évaluation dans le localStorage
      const storedStartups = localStorage.getItem('startups');
      if (storedStartups) {
        const parsedStartups = JSON.parse(storedStartups);
        if (Array.isArray(parsedStartups)) {
          // Trouver l'équipe à mettre à jour
          const updatedStartups = parsedStartups.map(s => {
            if (String(s.id) === id) {
              // Mettre à jour les critères d'évaluation avec les scores actuels
              const updatedCriteria = s.evaluationCriteria.map((criterion: any) => {
                // Forcer le type d'évaluation
                const forcedType = getEvaluationType(criterion.id);

                // Récupérer les valeurs temporaires pour ce critère
                const tempValues = criteriaValues[criterion.id] || {};

                // Conserver le type et les valeurs spécifiques au type
                return {
                  ...criterion,
                  score: criteriaScores[criterion.id] || criterion.score || 0,
                  // Forcer le type d'évaluation
                  type: forcedType,
                  // Appliquer les valeurs temporaires
                  booleanValue: tempValues.booleanValue !== undefined ? tempValues.booleanValue :
                               (criterion.booleanValue !== undefined ? criterion.booleanValue : false),
                  numericValue: tempValues.numericValue !== undefined ? tempValues.numericValue :
                               (criterion.numericValue !== undefined ? criterion.numericValue : 0),
                  textValue: tempValues.textValue !== undefined ? tempValues.textValue :
                           (criterion.textValue !== undefined ? criterion.textValue : ''),
                  // Inclure les champs de validation
                  filledByTeam: tempValues.filledByTeam !== undefined ? tempValues.filledByTeam :
                              (criterion.filledByTeam !== undefined ? criterion.filledByTeam : false),
                  validated: tempValues.validated !== undefined ? tempValues.validated :
                           (criterion.validated !== undefined ? criterion.validated : false),
                  requiresValidation: tempValues.requiresValidation !== undefined ? tempValues.requiresValidation :
                                    (criterion.requiresValidation !== undefined ? criterion.requiresValidation : true)
                };
              });

              // Retourner l'équipe mise à jour avec les nouveaux critères et le feedback
              return {
                ...s,
                evaluationCriteria: updatedCriteria,
                feedback: feedback,
                overallScore: manualOverallScore
              };
            }
            return s;
          });

          // Sauvegarder les équipes mises à jour dans le localStorage
          localStorage.setItem('startups', JSON.stringify(updatedStartups));

          // Mettre à jour l'équipe locale
          if (localStartup) {
            const updatedStartup = {
              ...localStartup,
              evaluationCriteria: localStartup.evaluationCriteria.map((criterion: any) => {
                // Forcer le type d'évaluation
                const forcedType = getEvaluationType(criterion.id);

                // Récupérer les valeurs temporaires pour ce critère
                const tempValues = criteriaValues[criterion.id] || {};

                // Conserver le type et les valeurs spécifiques au type
                return {
                  ...criterion,
                  score: criteriaScores[criterion.id] || criterion.score || 0,
                  // Forcer le type d'évaluation
                  type: forcedType,
                  // Appliquer les valeurs temporaires
                  booleanValue: tempValues.booleanValue !== undefined ? tempValues.booleanValue :
                               (criterion.booleanValue !== undefined ? criterion.booleanValue : false),
                  numericValue: tempValues.numericValue !== undefined ? tempValues.numericValue :
                               (criterion.numericValue !== undefined ? criterion.numericValue : 0),
                  textValue: tempValues.textValue !== undefined ? tempValues.textValue :
                           (criterion.textValue !== undefined ? criterion.textValue : ''),
                  // Inclure les champs de validation
                  filledByTeam: tempValues.filledByTeam !== undefined ? tempValues.filledByTeam :
                              (criterion.filledByTeam !== undefined ? criterion.filledByTeam : false),
                  validated: tempValues.validated !== undefined ? tempValues.validated :
                           (criterion.validated !== undefined ? criterion.validated : false),
                  requiresValidation: tempValues.requiresValidation !== undefined ? tempValues.requiresValidation :
                                    (criterion.requiresValidation !== undefined ? criterion.requiresValidation : true)
                };
              }),
              feedback: feedback,
              overallScore: manualOverallScore
            };
            setLocalStartup(updatedStartup);
          }

          // Réinitialiser les valeurs temporaires après la sauvegarde
          setCriteriaValues({});
        }
      }

      // Afficher un message de succès
      toast({
        title: "Evaluation mise à jour",
        description: "Les critères d'évaluation ont été mis à jour avec succès.",
      });

      setIsUpdating(false);
      setEvaluationUpdated(true);

      // Masquer le message de succès après un court délai
      setTimeout(() => {
        setEvaluationUpdated(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating evaluation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'évaluation.",
        variant: "destructive"
      });
      setIsUpdating(false);
    }
  };

  if (isLoading || !startup) {
    return <div>Loading...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'at_risk':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliverableStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'evaluated':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour filtrer les livrables en fonction de la phase sélectionnée
  const getPhaseDeliverables = () => {
    if (!startup?.deliverables || !Array.isArray(startup.deliverables)) {
      return [];
    }

    // Filtrer les livrables par phase sélectionnée
    if (selectedPhase) {
      return startup.deliverables.filter((deliverable: any) => deliverable.phase === selectedPhase);
    }

    // Si aucune phase n'est sélectionnée, retourner les livrables de la phase actuelle
    if (startup.currentPhase) {
      return startup.deliverables.filter((deliverable: any) => deliverable.phase === startup.currentPhase);
    }

    // Par défaut, retourner tous les livrables
    return startup.deliverables;
  };

  // Fonction pour déterminer le type d'évaluation en fonction de l'ID du critère
  const getEvaluationType = (criterionId: any) => {
    // Forcer le type en fonction de l'ID du critère
    const id = parseInt(criterionId);
    if (id % 4 === 0) return 'numeric';
    if (id % 4 === 1) return 'star_rating';
    if (id % 4 === 2) return 'yes_no';
    if (id % 4 === 3) return 'liste_deroulante';
    return 'star_rating'; // Par défaut
  };

  // Fonction pour filtrer les critères d'évaluation en fonction de la phase sélectionnée
  const getPhaseCriteria = () => {
    if (!startup?.evaluationCriteria || !Array.isArray(startup.evaluationCriteria)) {
      return [];
    }

    // Filtrer les critères par phase sélectionnée
    let criteria = [];
    if (selectedPhase) {
      criteria = startup.evaluationCriteria.filter((criterion: any) => criterion.phase === selectedPhase);
    } else if (startup.currentPhase) {
      // Si aucune phase n'est sélectionnée, retourner les critères de la phase actuelle
      criteria = startup.evaluationCriteria.filter((criterion: any) => criterion.phase === startup.currentPhase);
    } else {
      // Par défaut, retourner tous les critères
      criteria = startup.evaluationCriteria;
    }

    // Initialiser les valeurs pour chaque critère sans forcer le type
    criteria = criteria.map((criterion: any) => {
      // Utiliser le type existant du critère
      const type = criterion.type || 'star_rating'; // Par défaut, utiliser star_rating

      // Initialiser les valeurs spécifiques au type si elles n'existent pas
      return {
        ...criterion,
        // Assurer que le type est préservé
        type: type,
        // Initialiser les valeurs spécifiques au type si elles n'existent pas
        booleanValue: (type === 'yesno' || type === 'yes_no') ? (criterion.booleanValue !== undefined ? criterion.booleanValue : false) : undefined,
        numericValue: type === 'numeric' ? (criterion.numericValue !== undefined ? criterion.numericValue : 0) : undefined,
        textValue: type === 'liste_deroulante' ? (criterion.textValue !== undefined ? criterion.textValue : '') : undefined,
        // Initialiser les champs de validation
        filledByTeam: criterion.filledByTeam !== undefined ? criterion.filledByTeam : Math.random() > 0.5, // Simulation: certains critères sont remplis par l'équipe
        validated: criterion.validated !== undefined ? criterion.validated : false,
        requiresValidation: criterion.requiresValidation !== undefined ? criterion.requiresValidation : true
      };
    });

    // Afficher les critères dans la console pour déboguer
    console.log('Critères filtrés avec types préservés:', criteria);
    criteria.forEach((criterion: any) => {
      console.log(`Critère ${criterion.id} - ${criterion.name} - Type: ${criterion.type}`);
    });

    return criteria;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/teams')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste des équipes
        </Button>
      </div>
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center space-x-4">
          <img
            src={startup.logo}
            alt={`${startup.name} logo`}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <CardTitle className="text-2xl">{startup.name}</CardTitle>
              <Badge className={manualOverallScore > 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {manualOverallScore > 50 ? 'ACTIVE' : 'AT RISK'}
              </Badge>
            </div>
            <p className="text-gray-500">{startup.industry}</p>
            {startup.description && (
              <p className="text-sm mt-2">{startup.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessageDialogOpen(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
            <TeamMessageDialog
              open={messageDialogOpen}
              onOpenChange={setMessageDialogOpen}
              teamId={id || '1'}
              teamName={startup.name}
              teamMembers={startup.team || startup.members || []}
            />
            {!isMentor && (
              <>
                {isInFinalPhase && !isWinner ? (
                  <button
                    style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}
                    onClick={handleSelectWinner}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Sélectionner comme gagnant
                  </button>
                ) : isWinner ? (
                  <button
                    style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #22c55e', padding: '4px 8px', borderRadius: '4px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', fontSize: '0.875rem', opacity: '0.7' }}
                    disabled
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Gagnant sélectionné
                  </button>
                ) : (
                  <button
                    onClick={handleNextPhase}
                    style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: 'none', fontSize: '0.875rem' }}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Next Phase
                  </button>
                )}
                <button
                  style={{ backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: 'none', fontSize: '0.875rem' }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="deliverables">Livrables</TabsTrigger>
          <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Filtre de phase - Timeline */}
          {selectedProgram && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Programme Phase Timeline</CardTitle>
                <p className="text-sm text-gray-500">Cliquez sur une phase pour filtrer les évaluations et livrables</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <div className="flex w-full h-12 rounded-md overflow-hidden">
                    {selectedProgram.phases.map((phase, index) => {
                      // Définir une couleur pour chaque phase
                      const colors = [
                        'bg-indigo-400 hover:bg-indigo-500',  // Idéation
                        'bg-blue-400 hover:bg-blue-500',     // Prototypage
                        'bg-green-400 hover:bg-green-500',   // Validation
                        'bg-yellow-400 hover:bg-yellow-500', // Lancement
                        'bg-purple-400 hover:bg-purple-500', // Autre phase
                        'bg-pink-400 hover:bg-pink-500',     // Autre phase
                      ];

                      const color = colors[index % colors.length];

                      return (
                        <div
                          key={index}
                          className={`flex-1 flex items-center justify-center text-white font-medium cursor-pointer transition-all duration-300 transform ${color} ${
                            selectedPhase === phase.name ? 'ring-2 ring-offset-2 ring-blue-500 z-10 scale-105 shadow-lg' : ''
                          } ${
                            phase.name === startup.currentPhase ? 'border-b-4 border-white' : ''
                          }`}
                          onClick={() => setSelectedPhase(phase.name)}
                        >
                          {phase.name}
                          {phase.name === startup.currentPhase && (
                            <span className="ml-2 bg-white text-blue-800 text-xs px-1 py-0.5 rounded-full">Actuelle</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Indicateur de phase actuelle */}
                  <div className="flex w-full justify-between px-2">
                    <div className="text-xs text-gray-500">
                      Phase sélectionnée: <span className="font-medium">{selectedPhase}</span>
                    </div>
                    {startup.currentPhase && (
                      <div className="text-xs text-gray-500">
                        Phase actuelle: <span className="font-medium">{startup.currentPhase}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Phase:</span>
                    <span className="font-medium">{startup.currentPhase}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{startup.progress}%</span>
                    </div>
                    <Progress value={startup.progress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {startup.team ? (
                    // For sample data with team array
                    startup.team.map((member: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{member.name}</span>
                        <span className="text-gray-500">{member.role}</span>
                      </div>
                    ))
                  ) : startup.members ? (
                    // For teams created from submissions
                    startup.members.map((member: any, index: number) => (
                      <div key={member.id} className="flex justify-between text-sm">
                        <span>{member.name}</span>
                        <span className="text-gray-500">{member.email}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No team members found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deliverables">
          <div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Livrables pour la phase: <span className="font-medium">{selectedPhase}</span>
            </p>
            <div className="text-xs text-gray-500">
              Pour changer de phase, utilisez la timeline dans l'onglet <span className="font-medium">Aperçu</span>
            </div>
          </div>
          <div className="space-y-4">
            {getPhaseDeliverables().length > 0 ? getPhaseDeliverables().map((deliverable: any) => (
              <Card key={deliverable.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{deliverable.name}</CardTitle>
                    <p className="text-sm text-gray-500">{deliverable.description}</p>
                  </div>
                  <Badge className={getDeliverableStatusColor(deliverable.status)}>
                    {deliverable.status.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 text-sm">
                      <div>Due: {deliverable.dueDate}</div>
                      {deliverable.submittedDate && (
                        <div>Submitted: {deliverable.submittedDate}</div>
                      )}
                      {deliverable.score && (
                        <div>Score: {deliverable.score}%</div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {deliverable.fileUrl && (
                        <a href={deliverable.fileUrl} download style={{ backgroundColor: 'white', color: '#e43e32', border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem', textDecoration: 'none' }}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Aucun livrable disponible pour la phase <span className="font-medium">{selectedPhase}</span>.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="evaluation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Team Evaluation</CardTitle>
                  <p className="text-sm text-gray-500">Overall assessment of the team's performance for phase: <span className="font-medium">{selectedPhase}</span></p>
                </div>
                <div className="text-xs text-gray-500">
                  Pour changer de phase, utilisez la timeline dans l'onglet <span className="font-medium">Aperçu</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {getPhaseCriteria().length > 0 ? (
                <div className="space-y-6">
                  {getPhaseCriteria().map((criterion: any) => (
                    <div key={criterion.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{criterion.name}</h3>
                            {criterion.filledByTeam && (
                              <Badge className="bg-blue-100 text-blue-800">
                                Rempli par l'équipe
                              </Badge>
                            )}
                            {criterion.requiresValidation && (
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="checkbox"
                                    id={`validate-${criterion.id}`}
                                    checked={(criteriaValues[criterion.id]?.validated !== undefined ? criteriaValues[criterion.id].validated : criterion.validated) || false}
                                    onChange={(e) => handleValidation(criterion.id, e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <label htmlFor={`validate-${criterion.id}`} className="text-sm text-gray-700">
                                    Valider
                                  </label>
                                </div>
                                {(criteriaValues[criterion.id]?.validated !== undefined ? criteriaValues[criterion.id].validated : criterion.validated) ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    Validé
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    En attente de validation
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">Weight: {criterion.weight}% | Type: {criterion.type}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {/* Affichage du critère */}
                          {criterion.type === 'yesno' || criterion.type === 'yes_no' ? (
                            // Affichage Oui/Non
                            <div className="flex items-center space-x-4">
                              <div className="flex space-x-2">
                                <button
                                  style={{
                                    backgroundColor: (criteriaValues[criterion.id]?.booleanValue !== undefined ? criteriaValues[criterion.id].booleanValue : criterion.booleanValue) ? '#16a34a' : 'white',
                                    color: (criteriaValues[criterion.id]?.booleanValue !== undefined ? criteriaValues[criterion.id].booleanValue : criterion.booleanValue) ? 'white' : '#16a34a',
                                    border: (criteriaValues[criterion.id]?.booleanValue !== undefined ? criteriaValues[criterion.id].booleanValue : criterion.booleanValue) ? 'none' : '1px solid #16a34a',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.875rem'
                                  }}
                                  onClick={() => {
                                    // Mettre à jour le score et la valeur booléenne directement
                                    updateCriterion(criterion.id, { score: 5, booleanValue: true });
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Oui
                                </button>
                                <button
                                  style={{
                                    backgroundColor: !(criteriaValues[criterion.id]?.booleanValue !== undefined ? criteriaValues[criterion.id].booleanValue : criterion.booleanValue) ? '#dc2626' : 'white',
                                    color: !(criteriaValues[criterion.id]?.booleanValue !== undefined ? criteriaValues[criterion.id].booleanValue : criterion.booleanValue) ? 'white' : '#dc2626',
                                    border: !(criteriaValues[criterion.id]?.booleanValue !== undefined ? criteriaValues[criterion.id].booleanValue : criterion.booleanValue) ? 'none' : '1px solid #dc2626',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.875rem'
                                  }}
                                  onClick={() => {
                                    // Mettre à jour le score et la valeur booléenne directement
                                    updateCriterion(criterion.id, { score: 0, booleanValue: false });
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Non
                                </button>
                              </div>
                              {(criteriaValues[criterion.id]?.booleanValue !== undefined ? criteriaValues[criterion.id].booleanValue : criterion.booleanValue) !== undefined && (
                                <Badge className={(criteriaValues[criterion.id]?.booleanValue !== undefined ? criteriaValues[criterion.id].booleanValue : criterion.booleanValue) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                  {(criteriaValues[criterion.id]?.booleanValue !== undefined ? criteriaValues[criterion.id].booleanValue : criterion.booleanValue) ? "Critère validé" : "Critère non validé"}
                                </Badge>
                              )}
                            </div>
                          ) : criterion.type === 'numeric' ? (
                            // Affichage Numérique
                            <div className="flex flex-col items-end space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={(criteriaValues[criterion.id]?.numericValue !== undefined ? criteriaValues[criterion.id].numericValue : criterion.numericValue) || 0}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    // Calculer le score sur une échelle de 0 à 5 en fonction de la valeur numérique
                                    const score = Math.min(5, Math.max(0, Math.round(value / 20)));
                                    // Mettre à jour le score et la valeur numérique dans l'état temporaire
                                    updateCriterion(criterion.id, { score, numericValue: value });
                                  }}
                                  className="w-20 p-2 border rounded-md text-center focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                                />
                                <span className="text-sm font-medium text-gray-700">/ 100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${(criteriaValues[criterion.id]?.numericValue !== undefined ? criteriaValues[criterion.id].numericValue : criterion.numericValue) || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : criterion.type === 'liste_deroulante' ? (
                            // Affichage Liste déroulante
                            <div className="w-full ml-4">
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium">Sélection dans la liste déroulante:</label>
                                {((criteriaValues[criterion.id]?.textValue !== undefined ? criteriaValues[criterion.id].textValue : criterion.textValue) || '').length > 0 && (
                                  <Badge className="bg-green-100 text-green-800">
                                    Évaluation complétée
                                  </Badge>
                                )}
                              </div>
                              <select
                                value={(criteriaValues[criterion.id]?.textValue !== undefined ? criteriaValues[criterion.id].textValue : criterion.textValue) || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Mettre à jour le score en fonction de la sélection
                                  const score = value.length > 0 ? 5 : 0;
                                  // Mettre à jour le score et la valeur texte dans l'état temporaire
                                  updateCriterion(criterion.id, { score, textValue: value });
                                }}
                                className="w-full p-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                              >
                                <option value="">Sélectionnez une option...</option>
                                {criterion.options && criterion.options.length > 0 ? (
                                  // Afficher les options personnalisées si elles existent
                                  criterion.options.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                  ))
                                ) : (
                                  // Options par défaut si aucune option personnalisée n'est définie
                                  <>
                                    <option value="Excellent">Excellent</option>
                                    <option value="Très bien">Très bien</option>
                                    <option value="Bien">Bien</option>
                                    <option value="Moyen">Moyen</option>
                                    <option value="Insuffisant">Insuffisant</option>
                                  </>
                                )}
                              </select>
                            </div>
                          ) : criterion.type === 'star_rating' || criterion.type === 'stars' ? (
                            // Affichage Étoiles
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-6 w-6 cursor-pointer transition-colors ${
                                    (criteriaScores[criterion.id] || 0) >= star
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300 hover:text-yellow-200'
                                  }`}
                                  onClick={() => handleScoreChange(criterion.id, star)}
                                />
                              ))}
                            </div>
                          ) : (
                            // Fallback display (stars)
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-6 w-6 cursor-pointer transition-colors ${
                                    (criteriaScores[criterion.id] || 0) >= star
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300 hover:text-yellow-200'
                                  }`}
                                  onClick={() => handleScoreChange(criterion.id, star)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 mt-4 border-t">
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-lg">Score Global</span>
                        <div className="flex items-center gap-2">
                          {manualOverallScore <= 50 ? (
                            <Badge className="bg-red-100 text-red-800">
                              AT RISK
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              ACTIVE
                            </Badge>
                          )}
                          <span className="text-2xl font-bold text-blue-600">
                            {manualOverallScore}%
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Score calculé automatiquement:</span>
                          <span className="text-sm text-gray-700">
                            {calculateOverallScore().toFixed(1)}%
                          </span>
                          <button
                            onClick={() => setManualOverallScore(Math.round(calculateOverallScore()))}
                            className="ml-2 text-xs"
                            style={{ backgroundColor: 'white', color: '#e43e32', border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            Utiliser ce score
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Score saisi manuellement:</span>
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={manualOverallScore}
                              onChange={(e) => setManualOverallScore(parseInt(e.target.value) || 0)}
                              className="w-20 p-2 border rounded-md text-center focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                            />
                            <span className="ml-1 text-sm font-medium text-gray-700">%</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 italic">
                        Note: Le score global est utilisé pour déterminer le statut de l'équipe (Active ou At Risk) et peut être saisi manuellement pour tenir compte de facteurs qualitatifs non mesurables par les critères d'évaluation.
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-md font-medium mb-2">Feedback</h3>
                    <textarea
                      className="w-full p-3 border rounded-md focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide detailed feedback about the team's performance..."
                    />
                    <div className="flex justify-between mt-4">
                      {evaluationUpdated && (
                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md">
                          Evaluation successfully updated!
                        </div>
                      )}
                      <button
                        onClick={handleUpdateEvaluation}
                        disabled={isUpdating}
                        style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 24px', borderRadius: '4px', cursor: 'pointer', border: 'none', opacity: isUpdating ? '0.7' : '1' }}
                      >
                        {isUpdating ? 'Updating...' : 'Update Evaluation'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Aucun critère d'évaluation disponible pour la phase <span className="font-medium">{selectedPhase}</span>.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogue de félicitations pour le gagnant */}
      <WinnerDialog
        open={winnerDialogOpen}
        onOpenChange={setWinnerDialogOpen}
        teamName={startup.name}
        programName={selectedProgram?.name || ""}
      />
    </div>
  );
};

export default StartupDetailPage;