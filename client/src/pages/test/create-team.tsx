import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { useProgramContext } from '@/context/ProgramContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreateTestTeamPage = () => {
  const { toast } = useToast();
  const { programs } = useProgramContext();
  const [teamCreated, setTeamCreated] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  // Mettre à jour le programme sélectionné lorsque l'ID change
  useEffect(() => {
    if (selectedProgramId && programs) {
      const program = programs.find(p => p.id === selectedProgramId);
      if (program) {
        setSelectedProgram(program);
      }
    }
  }, [selectedProgramId, programs]);

  // Fonction pour générer des livrables pour chaque phase du programme
  const generateDeliverablesForProgram = (program) => {
    if (!program || !program.phases || !Array.isArray(program.phases)) {
      return [];
    }

    let deliverables = [];
    let id = 1;

    // Pour chaque phase du programme, créer des livrables spécifiques
    program.phases.forEach(phase => {
      // Livrables pour la phase d'Idéation ou équivalent (première phase)
      if (phase.name.includes('Idéation') || program.phases.indexOf(phase) === 0) {
        deliverables.push({
          id: id++,
          name: 'Présentation du Concept',
          description: 'Présentation détaillée du concept et de la vision du projet',
          dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
          submittedDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
          status: 'evaluated',
          fileUrl: '#',
          score: 90,
          phase: phase.name
        });

        deliverables.push({
          id: id++,
          name: 'Étude de Marché',
          description: 'Analyse complète du marché cible et des concurrents',
          dueDate: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString().split('T')[0],
          submittedDate: new Date(new Date().setDate(new Date().getDate() + 18)).toISOString().split('T')[0],
          status: 'submitted',
          fileUrl: '#',
          phase: phase.name
        });
      }

      // Livrables pour la phase de Prototypage ou équivalent (deuxième phase)
      else if (phase.name.includes('Prototypage') || phase.name.includes('Prototype') || program.phases.indexOf(phase) === 1) {
        deliverables.push({
          id: id++,
          name: 'Prototype Initial',
          description: 'Premier prototype fonctionnel du produit',
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
          status: 'pending',
          phase: phase.name
        });
      }

      // Livrables pour la phase de Validation ou équivalent (troisième phase)
      else if (phase.name.includes('Validation') || phase.name.includes('Test') || program.phases.indexOf(phase) === 2) {
        deliverables.push({
          id: id++,
          name: 'Résultats des Tests',
          description: 'Résultats des tests utilisateurs et retours du marché',
          dueDate: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString().split('T')[0],
          status: 'pending',
          phase: phase.name
        });
      }

      // Livrables pour la phase de Lancement ou équivalent (dernière phase)
      else if (phase.name.includes('Lancement') || phase.name.includes('Scaling') || program.phases.indexOf(phase) === program.phases.length - 1) {
        deliverables.push({
          id: id++,
          name: 'Plan de Lancement',
          description: 'Stratégie détaillée pour le lancement du produit',
          dueDate: new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().split('T')[0],
          status: 'pending',
          phase: phase.name
        });
      }

      // Pour toute autre phase, créer un livrable générique
      else {
        deliverables.push({
          id: id++,
          name: `Livrable pour ${phase.name}`,
          description: `Livrable spécifique pour la phase ${phase.name}`,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
          status: 'pending',
          phase: phase.name
        });
      }
    });

    return deliverables;
  };

  // Fonction pour déterminer le type d'évaluation en fonction de l'ID du critère
  const getEvaluationType = (criterionId) => {
    // Forcer le type en fonction de l'ID du critère
    const id = parseInt(criterionId);
    if (id % 4 === 0) return 'numeric';
    if (id % 4 === 1) return 'stars';
    if (id % 4 === 2) return 'yesno';
    if (id % 4 === 3) return 'text';
    return 'stars'; // Par défaut
  };

  // Fonction pour générer des critères d'évaluation pour chaque phase du programme
  const generateEvaluationCriteriaForProgram = (program) => {
    if (!program || !program.phases || !Array.isArray(program.phases)) {
      return [];
    }

    let criteria = [];
    let id = 1;

    // Pour chaque phase du programme, créer des critères d'évaluation spécifiques
    program.phases.forEach(phase => {
      // Vérifier si la phase a déjà des critères d'évaluation définis
      if (phase.evaluationCriteria && Array.isArray(phase.evaluationCriteria) && phase.evaluationCriteria.length > 0) {
        // Utiliser les critères existants, mais ajouter la propriété 'phase'
        phase.evaluationCriteria.forEach(criterion => {
          const type = getEvaluationType(id);
          criteria.push({
            ...criterion,
            id: id++,
            phase: phase.name,
            score: 0, // Réinitialiser le score pour l'équipe de test
            type: type,
            booleanValue: type === 'yesno' ? false : undefined,
            numericValue: type === 'numeric' ? 0 : undefined,
            textValue: type === 'text' ? '' : undefined
          });
        });
      } else {
        // Critères pour la phase d'Idéation ou équivalent (première phase)
        if (phase.name.includes('Idéation') || program.phases.indexOf(phase) === 0) {
          // Premier critère: étoiles
          criteria.push({
            id: id,
            name: 'Idée Innovante',
            weight: 40,
            score: 4,
            phase: phase.name,
            type: 'stars',
            filledByTeam: true,
            validated: true,
            requiresValidation: true
          });
          id++;

          // Deuxième critère: oui/non
          criteria.push({
            id: id,
            name: 'Analyse de Marché',
            weight: 30,
            score: 3,
            phase: phase.name,
            type: 'yesno',
            booleanValue: true,
            filledByTeam: true,
            validated: false,
            requiresValidation: true
          });
          id++;

          // Troisième critère: numérique
          criteria.push({
            id: id,
            name: 'Compétence de l\'Equipe',
            weight: 30,
            score: 5,
            phase: phase.name,
            type: 'numeric',
            numericValue: 85,
            filledByTeam: false,
            validated: false,
            requiresValidation: false
          });
          id++;

          // Quatrième critère: texte
          criteria.push({
            id: id,
            name: 'Vision du Projet',
            weight: 25,
            score: 5,
            phase: phase.name,
            type: 'text',
            textValue: 'Projet prometteur avec une vision claire.',
            filledByTeam: true,
            validated: false,
            requiresValidation: true
          });
          id++;
        }

        // Critères pour la phase de Prototypage ou équivalent (deuxième phase)
        else if (phase.name.includes('Prototypage') || phase.name.includes('Prototype') || program.phases.indexOf(phase) === 1) {
          // Premier critère: étoiles
          criteria.push({
            id: id,
            name: 'Qualité du Prototype',
            weight: 35,
            score: 0,
            phase: phase.name,
            type: 'stars',
            filledByTeam: false,
            validated: false,
            requiresValidation: true // Critère qui nécessite une validation mais qui n'est pas rempli par l'équipe
          });
          id++;

          // Deuxième critère: oui/non
          criteria.push({
            id: id,
            name: 'Faisabilité Technique',
            weight: 35,
            score: 0,
            phase: phase.name,
            type: 'yesno',
            booleanValue: false,
            filledByTeam: true,
            validated: false,
            requiresValidation: true
          });
          id++;

          // Troisième critère: numérique
          criteria.push({
            id: id,
            name: 'Expérience Utilisateur',
            weight: 30,
            score: 0,
            phase: phase.name,
            type: 'numeric',
            numericValue: 0,
            filledByTeam: true,
            validated: true,
            requiresValidation: true
          });
          id++;

          // Quatrième critère: texte
          criteria.push({
            id: id,
            name: 'Retours Techniques',
            weight: 25,
            score: 0,
            phase: phase.name,
            type: 'text',
            textValue: '',
            filledByTeam: false,
            validated: false,
            requiresValidation: false
          });
          id++;
        }

        // Critères pour la phase de Validation ou équivalent (troisième phase)
        else if (phase.name.includes('Validation') || phase.name.includes('Test') || program.phases.indexOf(phase) === 2) {
          // Premier critère: étoiles
          criteria.push({ id: id, name: 'Résultats des Tests', weight: 40, score: 0, phase: phase.name, type: 'stars' });
          id++;

          // Deuxième critère: oui/non
          criteria.push({ id: id, name: 'Validation du Marché', weight: 30, score: 0, phase: phase.name, type: 'yesno', booleanValue: false });
          id++;

          // Troisième critère: numérique
          criteria.push({ id: id, name: 'Retour Utilisateurs', weight: 30, score: 0, phase: phase.name, type: 'numeric', numericValue: 0 });
          id++;

          // Quatrième critère: texte
          criteria.push({ id: id, name: 'Potentiel de Croissance', weight: 30, score: 0, phase: phase.name, type: 'text', textValue: '' });
          id++;
        }

        // Critères pour la phase de Lancement ou équivalent (dernière phase)
        else if (phase.name.includes('Lancement') || phase.name.includes('Scaling') || program.phases.indexOf(phase) === program.phases.length - 1) {
          // Premier critère: étoiles
          criteria.push({ id: id, name: 'Stratégie de Lancement', weight: 25, score: 0, phase: phase.name, type: 'stars' });
          id++;

          // Deuxième critère: oui/non
          criteria.push({ id: id, name: 'Plan Marketing', weight: 25, score: 0, phase: phase.name, type: 'yesno', booleanValue: false });
          id++;

          // Troisième critère: numérique
          criteria.push({ id: id, name: 'Modèle Économique', weight: 25, score: 0, phase: phase.name, type: 'numeric', numericValue: 0 });
          id++;

          // Quatrième critère: texte
          criteria.push({ id: id, name: 'Présentation Finale', weight: 25, score: 0, phase: phase.name, type: 'text', textValue: '' });
          id++;
        }

        // Pour toute autre phase, créer des critères génériques
        else {
          // Premier critère: étoiles
          criteria.push({ id: id, name: `Critère 1 pour ${phase.name}`, weight: 34, score: 0, phase: phase.name, type: 'stars' });
          id++;

          // Deuxième critère: oui/non
          criteria.push({ id: id, name: `Critère 2 pour ${phase.name}`, weight: 33, score: 0, phase: phase.name, type: 'yesno', booleanValue: false });
          id++;

          // Troisième critère: numérique
          criteria.push({ id: id, name: `Critère 3 pour ${phase.name}`, weight: 33, score: 0, phase: phase.name, type: 'numeric', numericValue: 0 });
          id++;

          // Quatrième critère: texte
          criteria.push({ id: id, name: `Critère 4 pour ${phase.name}`, weight: 33, score: 0, phase: phase.name, type: 'text', textValue: '' });
          id++;
        }
      }
    });

    // Afficher les critères dans la console pour déboguer
    console.log('Critères générés pour le programme:', criteria);
    criteria.forEach(criterion => {
      console.log(`Critère ${criterion.id} - ${criterion.name} - Type: ${criterion.type}`);
    });

    return criteria;
  };

  const createTestTeam = () => {
    if (!selectedProgram) {
      setError("Veuillez sélectionner un programme avant de créer une équipe de test.");
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un programme avant de créer une équipe de test.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Récupérer les équipes existantes du localStorage
      let existingTeams = [];
      try {
        const storedTeams = localStorage.getItem('startups');
        if (storedTeams) {
          existingTeams = JSON.parse(storedTeams);
          if (!Array.isArray(existingTeams)) {
            existingTeams = [];
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des équipes:", error);
        existingTeams = [];
      }

      // Générer un ID unique pour la nouvelle équipe
      const newId = existingTeams.length > 0
        ? Math.max(...existingTeams.map(team => parseInt(team.id || '0'))) + 1
        : 10;

      // Déterminer la phase initiale (première phase du programme)
      const initialPhase = selectedProgram.phases && selectedProgram.phases.length > 0
        ? selectedProgram.phases[0].name
        : "Idéation";

      // Créer une nouvelle équipe de test
      const testTeam = {
        id: newId.toString(),
        name: `Équipe Test - ${selectedProgram.name}`,
        logo: "https://via.placeholder.com/100/9333EA/FFFFFF?text=TI",
        industry: "Innovation Technologique",
        currentPhase: initialPhase, // Phase initiale du programme sélectionné
        progress: 25,
        status: 'active',
        programId: selectedProgram.id, // ID du programme sélectionné
        description: "Équipe de test créée pour vérifier le fonctionnement des critères d'évaluation spécifiques à chaque phase.",
        team: [
          { name: 'Jean Dupont', role: 'CEO & Fondateur' },
          { name: 'Marie Martin', role: 'CTO' },
          { name: 'Pierre Durand', role: 'Responsable Marketing' },
          { name: 'Sophie Lefebvre', role: 'Designer UX/UI' }
        ],
        deliverables: generateDeliverablesForProgram(selectedProgram),
        evaluationCriteria: generateEvaluationCriteriaForProgram(selectedProgram),
        feedback: "L'équipe a présenté un concept innovant avec un bon potentiel de marché. La phase d'idéation a été bien exécutée, avec une analyse de marché solide et une vision claire du produit."
      };

      // Ajouter la nouvelle équipe à la liste existante
      existingTeams.push(testTeam);

      // Sauvegarder la liste mise à jour dans localStorage
      localStorage.setItem('startups', JSON.stringify(existingTeams));

      console.log(`Équipe de test créée avec succès! ID: ${newId}`);
      setTeamCreated(true);
      setTeamId(newId.toString());

      toast({
        title: "Équipe créée avec succès",
        description: `L'équipe de test a été créée avec l'ID: ${newId}`,
      });

      // Forcer une mise à jour de toutes les équipes dans l'application
      window.dispatchEvent(new Event('storage'));

      return testTeam;
    } catch (err) {
      console.error("Erreur lors de la création de l'équipe de test:", err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue s'est produite");

      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la création de l'équipe de test",
        variant: "destructive"
      });

      return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Créer une équipe de test</CardTitle>
          <CardDescription>
            Créez une équipe de test pour vérifier le fonctionnement des critères d'évaluation spécifiques à chaque phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamCreated ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800">Équipe créée avec succès!</AlertTitle>
              <AlertDescription className="text-green-700">
                L'équipe de test a été créée avec l'ID: {teamId}. Vous pouvez maintenant la consulter dans la liste des équipes.
              </AlertDescription>
            </Alert>
          ) : error ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-800">Erreur</AlertTitle>
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Sélectionnez un programme et cliquez sur le bouton ci-dessous pour créer une équipe de test avec des critères d'évaluation spécifiques à chaque phase.
                Cette équipe sera visible dans la liste des équipes.
              </p>

              <div className="space-y-2">
                <label htmlFor="program-select" className="text-sm font-medium">Sélectionnez un programme :</label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger id="program-select" className="w-full">
                    <SelectValue placeholder="Sélectionnez un programme" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={createTestTeam}
            disabled={teamCreated || !selectedProgram}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {teamCreated ? "Équipe créée" : "Créer l'équipe de test"}
          </Button>

          {teamCreated && (
            <Link href="/teams">
              <Button variant="outline">
                Voir toutes les équipes
              </Button>
            </Link>
          )}

          {teamCreated && teamId && (
            <Link href={`/teams/${teamId}`}>
              <Button>
                Voir l'équipe créée
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateTestTeamPage;
