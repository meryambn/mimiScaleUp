// Script pour créer une équipe de test et l'ajouter au localStorage

function createTestTeam() {
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
    ? Math.max(...existingTeams.map(team => parseInt(team.id))) + 1 
    : 10;

  // Créer une nouvelle équipe de test
  const testTeam = {
    id: newId.toString(),
    name: "Équipe Test Innovation",
    logo: "https://via.placeholder.com/100/9333EA/FFFFFF?text=TI",
    industry: "Innovation Technologique",
    currentPhase: "Idéation", // Phase initiale
    progress: 25,
    status: 'active',
    programId: "1", // ID du programme Tech Accelerator 2023
    description: "Équipe de test créée pour vérifier le fonctionnement des critères d'évaluation spécifiques à chaque phase.",
    team: [
      { name: 'Jean Dupont', role: 'CEO & Fondateur' },
      { name: 'Marie Martin', role: 'CTO' },
      { name: 'Pierre Durand', role: 'Responsable Marketing' },
      { name: 'Sophie Lefebvre', role: 'Designer UX/UI' }
    ],
    deliverables: [
      {
        id: 1,
        name: 'Présentation du Concept',
        description: 'Présentation détaillée du concept et de la vision du projet',
        dueDate: '2024-05-15',
        submittedDate: '2024-05-10',
        status: 'evaluated',
        fileUrl: '#',
        score: 90,
        phase: 'Idéation'
      },
      {
        id: 2,
        name: 'Étude de Marché',
        description: 'Analyse complète du marché cible et des concurrents',
        dueDate: '2024-05-20',
        submittedDate: '2024-05-18',
        status: 'submitted',
        fileUrl: '#',
        phase: 'Idéation'
      },
      {
        id: 3,
        name: 'Prototype Initial',
        description: 'Premier prototype fonctionnel du produit',
        dueDate: '2024-06-15',
        status: 'pending',
        phase: 'Prototypage'
      },
      {
        id: 4,
        name: 'Résultats des Tests',
        description: 'Résultats des tests utilisateurs et retours du marché',
        dueDate: '2024-07-10',
        status: 'pending',
        phase: 'Validation'
      },
      {
        id: 5,
        name: 'Plan de Lancement',
        description: 'Stratégie détaillée pour le lancement du produit',
        dueDate: '2024-08-01',
        status: 'pending',
        phase: 'Lancement'
      }
    ],
    evaluationCriteria: [
      // Critères pour la phase d'Idéation
      { id: 1, name: 'Idée Innovante', weight: 40, score: 4, phase: 'Idéation' },
      { id: 2, name: 'Analyse de Marché', weight: 30, score: 3, phase: 'Idéation' },
      { id: 3, name: 'Compétence de l\'Equipe', weight: 30, score: 5, phase: 'Idéation' },
      
      // Critères pour la phase de Prototypage
      { id: 4, name: 'Qualité du Prototype', weight: 35, score: 0, phase: 'Prototypage' },
      { id: 5, name: 'Faisabilité Technique', weight: 35, score: 0, phase: 'Prototypage' },
      { id: 6, name: 'Expérience Utilisateur', weight: 30, score: 0, phase: 'Prototypage' },
      
      // Critères pour la phase de Validation
      { id: 7, name: 'Résultats des Tests', weight: 40, score: 0, phase: 'Validation' },
      { id: 8, name: 'Retour Utilisateurs', weight: 30, score: 0, phase: 'Validation' },
      { id: 9, name: 'Potentiel de Croissance', weight: 30, score: 0, phase: 'Validation' },
      
      // Critères pour la phase de Lancement
      { id: 10, name: 'Stratégie de Lancement', weight: 25, score: 0, phase: 'Lancement' },
      { id: 11, name: 'Plan Marketing', weight: 25, score: 0, phase: 'Lancement' },
      { id: 12, name: 'Modèle Économique', weight: 25, score: 0, phase: 'Lancement' },
      { id: 13, name: 'Présentation Finale', weight: 25, score: 0, phase: 'Lancement' }
    ],
    feedback: "L'équipe a présenté un concept innovant avec un bon potentiel de marché. La phase d'idéation a été bien exécutée, avec une analyse de marché solide et une vision claire du produit."
  };

  // Ajouter la nouvelle équipe à la liste existante
  existingTeams.push(testTeam);

  // Sauvegarder la liste mise à jour dans localStorage
  localStorage.setItem('startups', JSON.stringify(existingTeams));

  console.log(`Équipe de test créée avec succès! ID: ${newId}`);
  return testTeam;
}

// Exécuter la fonction pour créer l'équipe de test
const testTeam = createTestTeam();
console.log("Détails de l'équipe de test:", testTeam);
