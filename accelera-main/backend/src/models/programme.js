import pool from '../../db.js';


//definition de la classe programme
export class Programme{
    constructor(id,type,nom,description, date_debut, date_fin,phases_requises, industries_requises , documents_requis, taille_equipe_min ,taille_equipe_max, ca_min, ca_max , admin_id=1){
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
       this.ca_min=ca_min ;
       this.ca_max=ca_max;
       this.admin_id=1;
    }
    
 // 1 ere methode pour creer un programme
    static async create(programme) {
      //const { rows } permet de récupérer directement les résultats d'une requête et la stoker dans rows(daymen cest un tableau)
      const { rows }=  await pool.query(
          `INSERT INTO app_schema.programme
          (type,nom, description, date_debut, date_fin,phases_requises,industries_requises,documents_requis,taille_equipe_min,taille_equipe_max,ca_min, ca_max)
          VALUES ($1, $2, $3, $4, $5, $6,$7,$8,$9,$10,$11,$12)
           RETURNING id`,
           [programme.type,
            programme.nom,
            programme.description,
            programme.date_debut,
            programme.date_fin,
             programme.phases_requises , 
              programme.industries_requises , 
              programme.documents_requis, 
              programme.taille_equipe_min ,
              programme.taille_equipe_max, 
              programme.ca_min, 
              programme.ca_max,
           
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
static async addMentorToProgramme(programmeId,mentorId){
  await pool.query(
    `INSERT INTO app_schema.programme_mentors 
    (programme_id, mentor_id)
    VALUES ($1, $2)`,
    [programmeId, mentorId]
);

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
   nom:programme.nom,
   description:programme.description,
   date_debut:programme.date_debut,
   date_fin:programme.date_fin,
   phases_requises :programme.phases_requises , 
   industries_requises:programme.industries_requises , 
   documents_requis: programme.documents_requis, 
   taille_equipe_min:  programme.taille_equipe_min ,
   taille_equipe_max:  programme.taille_equipe_max, 
   ca_min:  programme.ca_min, 
   ca_max:  programme.ca_max,
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
 static async updateProgramme(programmeId,updatedProgramme) {
  await pool.query(

    `UPDATE app_schema.programme SET nom=$1, description=$2, date_debut=$3, date_fin=$4, phases_requises=$5, industries_requises=$6, documents_requis=$7, taille_equipe_min=$8, taille_equipe_max=$9, ca_min=$10, ca_max=$11
     WHERE id = $12`,
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
      programmeId
    ]
  );
}
}        
        
      
      
