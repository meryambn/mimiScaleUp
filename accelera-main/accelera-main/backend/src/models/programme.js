import pool from '../../db.js';
import { phase } from './phase.js';  // Import the phase module
import {tache} from './tache.js';
import{ liverable } from './liverable.js';
import { critere } from './critere.js';
import { Formulaire } from './formulaire.js';
import { question } from './question.js';


//definition de la classe programme
export class Programme{
    constructor(id,type,nom,description, date_debut, date_fin,phases_requises, industries_requises , documents_requis, taille_equipe_min ,taille_equipe_max, ca_min, ca_max, admin_id=1, status='Brouillon', is_template='Non-Modèle'){
        this.id= id;
        this.type=type; // Type de programme ya aykon Accélération, Incubation, etc...
        this.nom=nom;
        this.description=description;
        this.date_debut = date_debut;
        this.date_fin = date_fin;
        this.phases_requises=phases_requises|| []; //[] cest une valeur par defaut
        this.industries_requises=industries_requises|| [];
        this.documents_requis= documents_requis || [];
        this.taille_equipe_min=taille_equipe_min;
        this.taille_equipe_max=taille_equipe_max;
        this.ca_min=ca_min;
        this.ca_max=ca_max;
        this.admin_id=admin_id;
        this.status=status; // Statut du programme: Brouillon, Actif, Terminé
        this.is_template=is_template; // Si le programme est un modèle: Modèle, Non-Modèle
    }

 // 1 ere methode pour creer un programme
    static async create(programme) {
      //const { rows } permet de récupérer directement les résultats d'une requête et la stoker dans rows(daymen cest un tableau)
      const { rows }=  await pool.query(
          `INSERT INTO app_schema.programme
          (type, nom, description, date_debut, date_fin, phases_requises, industries_requises, documents_requis,
           taille_equipe_min, taille_equipe_max, ca_min, ca_max, admin_id, status, is_template)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id`,
           [programme.type,
            programme.nom,
            programme.description,
            programme.date_debut,
            programme.date_fin,
            programme.phases_requises,
            programme.industries_requises,
            programme.documents_requis,
            programme.taille_equipe_min,
            programme.taille_equipe_max,
            programme.ca_min,
            programme.ca_max,
            programme.admin_id || 1,
            programme.status || 'Brouillon',
            programme.is_template || 'Non-Modèle'
          ]
        );
          // Retourne l'id du nouveau programme cree
        return rows[0].id;}


// 2 eme methode pour recuperer un programme par son id
        static async findById(id) {
          const { rows } = await pool.query(
            //be select el  bdd
            'SELECT * FROM app_schema.programme WHERE id = $1',
            [id]
          );
          return rows[0]; // Retourne le premier résultat ou undefined
        };



// 3 eme methode pour associe un mentor á un programme
// programmeId cest l'id du programme qu'on lui associe un mentorId
static async addMentorToProgramme(programmeId, mentorId){
  try {
    // Vérifier si l'association existe déjà
    const checkQuery = `SELECT 1 FROM app_schema.programme_mentors
                        WHERE programme_id = $1 AND mentor_id = $2`;
    const checkResult = await pool.query(checkQuery, [programmeId, mentorId]);

    if (checkResult.rows.length > 0) {
      return; // Déjà associé, ne rien faire
    }

    // Ajouter l'association
    const insertQuery = `INSERT INTO app_schema.programme_mentors
                        (programme_id, mentor_id)
                        VALUES ($1, $2)`;
    await pool.query(insertQuery, [programmeId, mentorId]);
  } catch (error) {
    throw error;
  }
}


// Méthode pour récupérer tous les programmes
static async getAllProgrammes(admin_id = null) {
  let query, queryParams;

  if (admin_id) {
    query = `
      SELECT p.*
      FROM app_schema.programme p
      WHERE p.admin_id = $1
      ORDER BY p.id DESC
    `;
    queryParams = [admin_id];
  } else {
    query = `
      SELECT p.*
      FROM app_schema.programme p
      ORDER BY p.id DESC
    `;
    queryParams = [];
  }

  const { rows } = await pool.query(query, queryParams);

  // Pour chaque programme, récupérer ses mentors associés
  const programsWithMentors = await Promise.all(
    rows.map(async (program) => {
      const mentorQuery = `SELECT
          m.utilisateur_id,
          m.nom,
          m.prenom,
          m.profession
      FROM app_schema.mentors m
      INNER JOIN app_schema.programme_mentors pm
          ON m.utilisateur_id = pm.mentor_id
      WHERE pm.programme_id = $1`;

      const { rows: mentors } = await pool.query(mentorQuery, [program.id]);

      return {
        ...program,
        mentors
      };
    })
  );

  return programsWithMentors;
}

// Méthode pour récupérer tous les programmes auxquels un mentor est assigné
static async getProgrammesByMentorId(mentorId) {
  // Vérifier d'abord si le mentor existe dans la table programme_mentors
  const mentorCheck = await pool.query(
    `SELECT 1 FROM app_schema.programme_mentors WHERE mentor_id = $1 LIMIT 1`,
    [mentorId]
  );

  if (mentorCheck.rows.length === 0) {
    return [];
  }

  const query = `SELECT p.*
     FROM app_schema.programme p
     INNER JOIN app_schema.programme_mentors pm ON p.id = pm.programme_id
     WHERE pm.mentor_id = $1`;

  const { rows } = await pool.query(query, [mentorId]);

  if (rows.length === 0) {
    return [];
  }

  // Pour chaque programme, récupérer ses mentors associés
  const programsWithMentors = await Promise.all(
    rows.map(async (program) => {
      const mentorQuery = `SELECT
          m.utilisateur_id,
          m.nom,
          m.prenom,
          m.profession
      FROM app_schema.mentors m
      INNER JOIN app_schema.programme_mentors pm
          ON m.utilisateur_id = pm.mentor_id
      WHERE pm.programme_id = $1`;

      const { rows: mentors } = await pool.query(mentorQuery, [program.id]);

      return {
        ...program,
        mentors
      };
    })
  );

  return programsWithMentors;
}


//4 eme methode recuperer un programme avec ses mentors associés
static async getProgrammeWithMentors(id) {//(lhna id ta3 programme )
  // Recuperer le programme de base
  const programme = await this.findById(id);
  //si programme nexiste pas -> nul
  if (!programme) return null;
// si non(programme existe) Recuperer les mentors liés (avec un select a la)
//rows retourne un tableau de donnees de mentors(ici on la rennomer en mentors)
  const { rows: mentors } = await pool.query(
    // JOIN : pour recuperer les donnees des mentors , on le fait avec id  (doit etre =)
      `SELECT
          m.utilisateur_id,
          m.nom,
          m.prenom,
          m.profession
      FROM app_schema.mentors m
      INNER JOIN app_schema.programme_mentors pm
          ON m.utilisateur_id = pm.mentor_id
      WHERE pm.programme_id = $1`,
      [id]
  );

  // retourner les donnees du programme+ les mentors
  return {
    id: programme.id,
    type: programme.type,
    nom: programme.nom,
    description: programme.description,
    date_debut: programme.date_debut,
    date_fin: programme.date_fin,
    phases_requises: programme.phases_requises,
    industries_requises: programme.industries_requises,
    documents_requis: programme.documents_requis,
    taille_equipe_min: programme.taille_equipe_min,
    taille_equipe_max: programme.taille_equipe_max,
    ca_min: programme.ca_min,
    ca_max: programme.ca_max,
    status: programme.status,
    is_template: programme.is_template,
    mentors,
  };
}


//5 eme methode pour supprimer un mentor d'un programme de BDD
 static async deletementor (programmeId, mentorId){
  await pool.query(
    `DELETE FROM app_schema.programme_mentors WHERE programme_id=$1 AND mentor_id=$2`,
    [programmeId, mentorId]
  )
 }
 //6 eme methode pour modifier un programme
 static async updateProgramme(programmeId, updatedProgramme) {
  await pool.query(
    `UPDATE app_schema.programme
     SET nom=$1, description=$2, date_debut=$3, date_fin=$4, phases_requises=$5,
         industries_requises=$6, documents_requis=$7, taille_equipe_min=$8, taille_equipe_max=$9,
         ca_min=$10, ca_max=$11, status=$12, is_template=$13
     WHERE id = $14`,
    [
      updatedProgramme.nom,
      updatedProgramme.description,
      updatedProgramme.date_debut,
      updatedProgramme.date_fin,
      updatedProgramme.phases_requises,
      updatedProgramme.industries_requises,
      updatedProgramme.documents_requis,
      updatedProgramme.taille_equipe_min,
      updatedProgramme.taille_equipe_max,
      updatedProgramme.ca_min,
      updatedProgramme.ca_max,
      updatedProgramme.status,
      updatedProgramme.is_template,
      programmeId
    ]
  );
}
// 7 eme methode pour mettre à jour uniquement le statut d'un programme
static async updateStatus(programmeId, newStatus, isTemplate) {
  // Vérifier si le programme existe
  const programme = await this.findById(programmeId);
  if (!programme) {
    throw new Error('Programme non trouvé');
  }

  // Vérifier les règles de transition de statut
  if (programme.status === 'Terminé' && newStatus !== 'Terminé') {
    throw new Error('Impossible de changer le statut d\'un programme terminé');
  }

  if (programme.status === 'Actif' && newStatus === 'Brouillon') {
    throw new Error('Impossible de changer un programme actif en brouillon');
  }

  // Mettre à jour le statut
  const updateQuery = isTemplate
    ? 'UPDATE app_schema.programme SET status = $1, is_template = $2 WHERE id = $3 RETURNING *'
    : 'UPDATE app_schema.programme SET status = $1 WHERE id = $2 RETURNING *';

  const queryParams = isTemplate
    ? [newStatus, isTemplate, programmeId]
    : [newStatus, programmeId];

  const { rows } = await pool.query(updateQuery, queryParams);
  return rows[0];
}

// methode pour delete un programme
static async delete(programmeId) {
  //recuperation de toutes les phases du programme
  const phases = await phase.getByProgramme(programmeId);

  //  suppression en cascade des elements lies aux phases passe que phase dkhelin fiha plusieurs truc
  for (const ph of phases) {
    //Suppression des taches de la phase
    await tache.delete(ph.id);
    //Suppression des livrables de la phase
    await liverable.delete(ph.id);
    //suppression des crit d'evaluation de la phase
    await critere. delete(ph.id);
  }
  //supprimer les phases lier (dkhel el) programme
  await phase.delete(programmeId);
  // neho les qsts
  await question.deletetouteqst(programmeId);
  //neho forms
  await Formulaire.delete(programmeId);

  //neho el programme
  await pool.query('DELETE FROM app_schema.programme WHERE id = $1', [programmeId]);
}
}



