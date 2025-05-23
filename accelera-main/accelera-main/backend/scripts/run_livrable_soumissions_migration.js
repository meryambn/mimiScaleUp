import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le fichier SQL de migration
const migrationFilePath = path.join(__dirname, '../migrations/livrable_soumissions.sql');

// Lire le contenu du fichier SQL
const sql = fs.readFileSync(migrationFilePath, 'utf8');

async function runMigration() {
    try {
        console.log('Exécution de la migration pour la table livrable_soumissions...');
        
        // Exécuter le script SQL
        await pool.query(sql);
        
        console.log('Migration terminée avec succès!');
        
        // Créer le répertoire pour stocker les fichiers de livrable si nécessaire
        const uploadsDir = path.join(__dirname, '../uploads/livrables');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log(`Répertoire créé: ${uploadsDir}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de l\'exécution de la migration:', error);
        process.exit(1);
    }
}

// Exécuter la migration
runMigration();
