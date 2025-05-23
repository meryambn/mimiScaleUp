import pool from '../../db.js'; // Chemin relatif depuis le dossier models
// Définit la classe Mentor
export class Mentor {
    constructor(utilisateur_id, nom, prenom, profession) {
        this.utilisateur_id = utilisateur_id;
        this.role = 'mentor'; // Rôle fixé
        this.nom = nom;
        this.prenom = prenom;
        this.profession = profession;
    }
//Insère les données de l'instance existante de Mentor dans la base de données.
    async save() {
        await pool.query(
            `INSERT INTO app_schema.mentors 
            (utilisateur_id, nom, prenom, profession)
            VALUES ($1, $2, $3, $4)`,
            [
              this.utilisateur_id,
              this.nom,
              this.prenom,
              this.profession
            ]
        );
    }

   // Crée une nouvelle instance de Mentor et l'enregistre immédiatement en base de données.
	static async create(utilisateurId, infosRole) { // il manquait cette classe lfruiti 

		const mentor = new Mentor(
			utilisateurId,
			infosRole.nom,
			infosRole.prenom,
			infosRole.profession
		);
		await mentor.save();
	}
    // Method to find a mentor by user ID
    static async findByUserId(utilisateur_id) {
        try {
            console.log(`Executing query: SELECT * FROM app_schema.mentors WHERE utilisateur_id = ${utilisateur_id}`);
            const result = await pool.query(
                'SELECT * FROM app_schema.mentors WHERE utilisateur_id = $1',
                [utilisateur_id]
            );
            console.log(`Query result:`, result.rows);
            return result.rows[0];
        } catch (error) {
            console.error(`Error in findByUserId: ${error.message}`);
            console.error(error.stack);
            throw error;
        }
    }
}

