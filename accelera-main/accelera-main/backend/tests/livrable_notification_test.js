import { LivrableSoumission } from '../src/models/livrableSoumission.js';
import { liverable } from '../src/models/liverable.js';
import { Notification } from '../src/models/notification.js';
import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour créer un livrable de test
async function createTestLivrable(phaseId) {
    const testLivrable = new liverable(
        null,
        'Livrable de test pour notification',
        'Description du livrable de test pour notification',
        '2024-12-31',
        ['.pdf', '.docx'],
        phaseId
    );
    
    return await liverable.create(testLivrable);
}

// Fonction pour créer une soumission de test
async function createTestSoumission(livrableId, candidatureId) {
    // Créer un fichier de test
    const uploadsDir = path.join(__dirname, '../uploads/livrables');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const testFilePath = path.join(uploadsDir, 'test-notification-file.txt');
    fs.writeFileSync(testFilePath, 'Contenu du fichier de test pour notification');
    
    const testSoumission = new LivrableSoumission(
        null,
        livrableId,
        candidatureId,
        'test-notification-file.txt',
        testFilePath,
        new Date()
    );
    
    return await LivrableSoumission.create(testSoumission);
}

// Fonction principale de test
async function runTests() {
    try {
        console.log('Démarrage des tests de notification pour les soumissions de livrables...');
        
        // 1. Récupérer une phase et une candidature existantes pour les tests
        let phaseId;
        let candidatureId;
        let programmeId;
        
        // Vérifier si une phase existe
        const { rows: phases } = await pool.query('SELECT id, programme_id FROM app_schema.phase LIMIT 1');
        if (phases.length === 0) {
            console.error('Aucune phase trouvée. Veuillez exécuter le test principal d\'abord.');
            process.exit(1);
        }
        
        phaseId = phases[0].id;
        programmeId = phases[0].programme_id;
        console.log(`✅ Phase trouvée avec ID: ${phaseId}, Programme ID: ${programmeId}`);
        
        // Vérifier si une candidature existe
        const { rows: candidatures } = await pool.query('SELECT id FROM app_schema.candidatures LIMIT 1');
        if (candidatures.length === 0) {
            console.error('Aucune candidature trouvée. Veuillez exécuter le test principal d\'abord.');
            process.exit(1);
        }
        
        candidatureId = candidatures[0].id;
        console.log(`✅ Candidature trouvée avec ID: ${candidatureId}`);
        
        // 2. Créer un livrable de test
        const livrableId = await createTestLivrable(phaseId);
        console.log(`✅ Livrable de test créé avec ID: ${livrableId}`);
        
        // 3. Créer une soumission de test
        const soumission = await createTestSoumission(livrableId, candidatureId);
        console.log(`✅ Soumission de test créée avec ID: ${soumission.id}`);
        
        // 4. Envoyer des notifications
        console.log('Envoi des notifications aux admins et mentors...');
        await LivrableSoumission.notifyAdminsAndMentors(livrableId, candidatureId, programmeId);
        console.log('✅ Notifications envoyées');
        
        // 5. Vérifier si les notifications ont été créées
        const { rows: notifications } = await pool.query(
            `SELECT * FROM app_schema.notifications 
             WHERE type = 'livrable_soumis' AND related_id = $1`,
            [livrableId]
        );
        
        if (notifications.length === 0) {
            throw new Error('Aucune notification n\'a été créée');
        }
        
        console.log(`✅ ${notifications.length} notification(s) créée(s)`);
        
        // Afficher les détails des notifications
        console.log('Détails des notifications:');
        notifications.forEach((notif, index) => {
            console.log(`  Notification ${index + 1}:`);
            console.log(`    - Destinataire: ID ${notif.user_id} (${notif.user_role})`);
            console.log(`    - Titre: ${notif.title}`);
            console.log(`    - Message: ${notif.message}`);
            console.log(`    - Date: ${notif.created_at}`);
        });
        
        // 6. Nettoyage (suppression des données de test)
        await pool.query('DELETE FROM app_schema.notifications WHERE type = $1 AND related_id = $2', ['livrable_soumis', livrableId]);
        await pool.query('DELETE FROM app_schema.livrable_soumissions WHERE id = $1', [soumission.id]);
        await pool.query('DELETE FROM app_schema.livrables WHERE id = $1', [livrableId]);
        
        // Supprimer le fichier de test
        try {
            if (fs.existsSync(soumission.chemin_fichier)) {
                fs.unlinkSync(soumission.chemin_fichier);
                console.log(`✅ Fichier de test supprimé: ${soumission.chemin_fichier}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la suppression du fichier de test: ${error.message}`);
        }
        
        console.log('✅ Nettoyage des données de test effectué');
        console.log('✅ Tous les tests de notification ont réussi!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors des tests de notification:', error);
        process.exit(1);
    } finally {
        // Fermer la connexion à la base de données
        await pool.end();
    }
}

// Exécuter les tests
runTests();
