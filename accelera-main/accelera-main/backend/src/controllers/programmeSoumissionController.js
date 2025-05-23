import { ProgrammeSoumission } from '../models/programmeSoumission.js'; // Importe le modèle
import { Candidature } from '../models/candidature.js';
import { CandidatureMembre } from '../models/candidatureMembre.js';
import { Notification } from '../models/notification.js';
import pool from '../../db.js';

// Contrôleur pour gérer les routes d'association Programme-Soumission
export const ProgrammeSoumissionController = {
  // Ajoute une startup à un programme
  async ajouterSoumissionAuProgramme(req, res) {
    try {
      const { soumissionId, programmeId, nom_entreprise } = req.body; // Récupère les IDs et le nom de l'entreprise du corps

      // Étape 1 : Vérifie si la soumission existe
      const soumission = await ProgrammeSoumission.checkSoumissionExists(soumissionId);
      if (!soumission) return res.status(404).json({ error: "Soumission introuvable" });

      // Si un nom d'entreprise est fourni dans la requête, l'ajouter à l'objet soumission
      if (nom_entreprise) {
        console.log(`Nom d'entreprise reçu dans la requête: ${nom_entreprise}`);
        soumission.nom_entreprise = nom_entreprise;
      }

      // Étape 2 : Vérifie le rôle "startup"
      if (soumission.role !== 'startup')
        return res.status(400).json({ error: "Action réservée aux startups" });

      // Étape 3 : Vérifie l'existence du programme
      const programme = await ProgrammeSoumission.checkProgrammeExists(programmeId);
      if (!programme) return res.status(404).json({ error: "Programme introuvable" });


       // Étape 4 (NOUVELLE ÉTAPE) : Vérifie si le formulaire de la soumission appartient au programme
    const isSubmissionValid = await ProgrammeSoumission.checkSubmissionBelongsToProgram(
      soumissionId,
      programmeId
    );
    if (!isSubmissionValid) {
      return res.status(400).json({ error: "La soumission ne correspond pas au programme" });
    }

      // Étape 4 : Vérifie les doublons
      const isAlreadyInProgramme = await ProgrammeSoumission.checkSoumissionInProgramme(
        programmeId,
        soumissionId
      );
      if (isAlreadyInProgramme)
        return res.status(400).json({ error: "Association déjà existante" });

      // Étape 5 : Crée l'association
      await ProgrammeSoumission.create(programmeId, soumissionId);

      // Étape 6 : Récupérer le nom du programme pour la notification
      const { rows: programRows } = await pool.query(
        "SELECT nom FROM app_schema.programme WHERE id = $1",
        [programmeId]
      );
      const programmeName = programRows.length > 0 ? programRows[0].nom : "Programme";

      // Étape 7 : Créer une notification pour la startup
      try {
        await Notification.create({
          user_id: soumission.utilisateur_id,
          user_role: 'startup',
          type: 'program_addition',
          title: 'Ajout à un programme',
          message: `Votre startup a été ajoutée au programme "${programmeName}".`,
          related_id: parseInt(programmeId),
          is_read: false
        });
        console.log(`Notification créée pour la startup ${soumission.utilisateur_id}`);
      } catch (notifError) {
        console.error(`Erreur lors de la création de la notification pour la startup ${soumission.utilisateur_id}:`, notifError.message);
        // Continuer même si la création de notification échoue
      }

      res.status(200).json({
        success: true,
        message: "Startup ajoutée au programme avec succès"
      });

    } catch (err) {
      console.error("Erreur:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

// Dans programmeSoumissionController.js
async getStartupsAndTeams(req, res) {
  try {
    const { programmeId } = req.params;
console.log('programme id:',programmeId)
    // 1. Vérifier l'existence du programme
    const programmeExists = await ProgrammeSoumission.checkProgrammeExists(programmeId);
    if (!programmeExists) {
      return res.status(404).json({ error: "Programme introuvable" });
    }

    // 2. Récupérer les startups individuelles (soumissions non liées à une équipe)
    const individualStartups = await ProgrammeSoumission.getIndividualSubmissions(programmeId);

    // 3. Récupérer les équipes du programme avec leur nom depuis candidatures
    const teams = await Candidature.getByProgramme(programmeId);

    // 4. Ajouter les membres (soumission_ids) à chaque équipe
    const teamsWithMembers = await Promise.all(
  teams.map(async (team) => ({
    id: team.id,
    nom_equipe: team.nom_equipe, // Utiliser la colonne correcte depuis la BDD
    membres: await CandidatureMembre.getByCandidature(team.id)
  }))
);

  res.status(200).json({
  startups_individuelles: individualStartups.map(s => ({
    id: s.soumission_id,
    nom: s.nom // Utilise nom_entreprise renommé en "nom"
  })),
  equipes: teamsWithMembers
});

  } catch (err) {
    console.error("Erreur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}



}