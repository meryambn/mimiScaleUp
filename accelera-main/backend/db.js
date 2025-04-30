//Le fichier db.js a un rôle central : configurer et gérer la connexion à votre base de données PostgreSQL.
import pg from 'pg';// Importe le module PostgreSQL pour Node.js
import dotenv from 'dotenv';// Importe le module pour charger les variables d'environnement


dotenv.config({ path: './vrbl.env' }); // I
console.log('USER =', process.env.DB_USER);


const { Pool } = pg;

// Crée une instance de pool de connexions avec la configuration (pool permet un groupe de cnx réutilisable)
const pool = new Pool({
  user: String(process.env.DB_USER),
  password: String(process.env.DB_PASSWORD), // Mot de passe de la DB
  host: process.env.DB_HOST,// Adresse du serveur PostgreSQL
  port: Number(process.env.DB_PORT),// Port converti en nombre
  database: process.env.DB_NAME,// Nom de la base de données
  
});
// Exporte le pool configuré pour être utilisé dans d'autres modules
export default pool;
