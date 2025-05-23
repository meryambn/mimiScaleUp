import { LivrableSoumission } from '../src/models/livrableSoumission.js';
import { liverable } from '../src/models/liverable.js';
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
        'Livrable de test',
        'Description du livrable de test',
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

    const testFilePath = path.join(uploadsDir, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'Contenu du fichier de test');

    const testSoumission = new LivrableSoumission(
        null,
        livrableId,
        candidatureId,
        'test-file.txt',
        testFilePath,
        new Date()
    );

    return await LivrableSoumission.create(testSoumission);
}

// Fonction principale de test
async function runTests() {
    try {
        console.log('Démarrage des tests pour le module de soumission de livrables...');

        // 1. Vérifier si la table existe
        const { rows: tableCheck } = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'app_schema'
                AND table_name = 'livrable_soumissions'
            );
        `);

        if (!tableCheck[0].exists) {
            console.error('La table livrable_soumissions n\'existe pas. Veuillez exécuter la migration d\'abord.');
            process.exit(1);
        }

        console.log('✅ La table livrable_soumissions existe.');

        // 2. Récupérer ou créer une phase et une candidature pour les tests
        let phaseId;
        let candidatureId;

        // Vérifier si une phase existe
        const { rows: phases } = await pool.query('SELECT id FROM app_schema.phase LIMIT 1');
        if (phases.length === 0) {
            console.log('Aucune phase trouvée. Création d\'une phase de test...');

            // Créer un programme de test si nécessaire
            const { rows: programmes } = await pool.query('SELECT id FROM app_schema.programmes LIMIT 1');
            let programmeId;

            if (programmes.length === 0) {
                const { rows: newProgramme } = await pool.query(
                    `INSERT INTO app_schema.programmes
                    (type, nom, description, date_debut, date_fin, taille_equipe_min, taille_equipe_max, ca_min, ca_max, admin_id, status, is_template)
                    VALUES ('Test', 'Programme de test', 'Description du programme de test', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 1, 5, 0, 1000000, 1, 'Brouillon', 'Non-Modèle')
                    RETURNING id`
                );
                programmeId = newProgramme[0].id;
                console.log(`✅ Programme de test créé avec ID: ${programmeId}`);
            } else {
                programmeId = programmes[0].id;
                console.log(`✅ Programme existant trouvé avec ID: ${programmeId}`);
            }

            // Créer une phase de test
            const { rows: newPhase } = await pool.query(
                `INSERT INTO app_schema.phase
                (nom, description, date_debut, date_fin, programme_id)
                VALUES ('Phase de test', 'Description de la phase de test', CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', $1)
                RETURNING id`,
                [programmeId]
            );
            phaseId = newPhase[0].id;
            console.log(`✅ Phase de test créée avec ID: ${phaseId}`);
        } else {
            phaseId = phases[0].id;
            console.log(`✅ Phase existante trouvée avec ID: ${phaseId}`);
        }

        // Vérifier si une candidature existe
        const { rows: candidatures } = await pool.query('SELECT id FROM app_schema.candidatures LIMIT 1');
        if (candidatures.length === 0) {
            console.log('Aucune candidature trouvée. Création d\'une candidature de test...');

            // Récupérer un programme existant
            const { rows: programmes } = await pool.query('SELECT id FROM app_schema.programmes LIMIT 1');
            if (programmes.length === 0) {
                console.error('Aucun programme trouvé pour créer une candidature.');
                process.exit(1);
            }

            // Créer une candidature de test
            const { rows: newCandidature } = await pool.query(
                `INSERT INTO app_schema.candidatures
                (nom_equipe, description_equipe, programme_id)
                VALUES ('Équipe de test', 'Description de l\'équipe de test', $1)
                RETURNING id`,
                [programmes[0].id]
            );
            candidatureId = newCandidature[0].id;
            console.log(`✅ Candidature de test créée avec ID: ${candidatureId}`);
        } else {
            candidatureId = candidatures[0].id;
            console.log(`✅ Candidature existante trouvée avec ID: ${candidatureId}`);
        }
        console.log(`✅ Candidature trouvée avec ID: ${candidatureId}`);

        // 3. Créer un livrable de test
        const livrableId = await createTestLivrable(phaseId);
        console.log(`✅ Livrable de test créé avec ID: ${livrableId}`);

        // 4. Créer une soumission de test
        const soumission = await createTestSoumission(livrableId, candidatureId);
        console.log(`✅ Soumission de test créée avec ID: ${soumission.id}`);

        // 5. Récupérer la soumission par ID
        const retrievedSoumission = await LivrableSoumission.getById(soumission.id);
        if (!retrievedSoumission) {
            throw new Error('Échec de la récupération de la soumission par ID');
        }
        console.log(`✅ Soumission récupérée par ID: ${retrievedSoumission.id}`);

        // 6. Récupérer les soumissions par livrable
        const soumissionsByLivrable = await LivrableSoumission.getByLivrableId(livrableId);
        if (soumissionsByLivrable.length === 0) {
            throw new Error('Échec de la récupération des soumissions par livrable');
        }
        console.log(`✅ ${soumissionsByLivrable.length} soumission(s) récupérée(s) par livrable`);

        // 7. Récupérer les soumissions par candidature
        const soumissionsByCandidature = await LivrableSoumission.getByCandidatureId(candidatureId);
        if (soumissionsByCandidature.length === 0) {
            throw new Error('Échec de la récupération des soumissions par candidature');
        }
        console.log(`✅ ${soumissionsByCandidature.length} soumission(s) récupérée(s) par candidature`);

        // 8. Vérifier si une équipe a déjà soumis un livrable
        const hasSubmitted = await LivrableSoumission.hasTeamSubmitted(livrableId, candidatureId);
        if (!hasSubmitted) {
            throw new Error('La vérification de soumission a échoué');
        }
        console.log(`✅ Vérification de soumission réussie: ${hasSubmitted}`);

        // Nettoyage (suppression des données de test)
        await pool.query('DELETE FROM app_schema.livrable_soumissions WHERE id = $1', [soumission.id]);
        await pool.query('DELETE FROM app_schema.livrables WHERE id = $1', [livrableId]);

        // Supprimer le fichier de test
        try {
            if (fs.existsSync(retrievedSoumission.chemin_fichier)) {
                fs.unlinkSync(retrievedSoumission.chemin_fichier);
                console.log(`✅ Fichier de test supprimé: ${retrievedSoumission.chemin_fichier}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la suppression du fichier de test: ${error.message}`);
        }

        console.log('✅ Nettoyage des données de test effectué');
        console.log('✅ Tous les tests ont réussi!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
        process.exit(1);
    } finally {
        // Fermer la connexion à la base de données
        await pool.end();
    }
}

// Exécuter les tests
runTests();
