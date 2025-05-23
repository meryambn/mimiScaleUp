import pool from '../db.js';
import { liverable } from '../src/models/liverable.js';
import { LivrableSoumission } from '../src/models/livrableSoumission.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ID du programme cible
const PROGRAMME_ID = 203;
const PROGRAMME_NAME = "fucku"; // Nom du programme pour les logs

// Fonction principale
async function addDeliverablesForProgram() {
    try {
        console.log(`Ajout de livrables pour le programme ${PROGRAMME_NAME} (ID: ${PROGRAMME_ID})...`);
        
        // 1. Récupérer les phases du programme
        const { rows: phases } = await pool.query(
            `SELECT * FROM app_schema.phase WHERE programme_id = $1 ORDER BY id`,
            [PROGRAMME_ID]
        );
        
        if (phases.length === 0) {
            console.error(`Aucune phase trouvée pour le programme ${PROGRAMME_ID}`);
            process.exit(1);
        }
        
        console.log(`${phases.length} phases trouvées pour le programme ${PROGRAMME_NAME}:`);
        phases.forEach((phase, index) => {
            console.log(`  Phase ${index + 1}: ${phase.nom} (ID: ${phase.id})`);
        });
        
        // 2. Récupérer les candidatures (équipes) du programme
        const { rows: candidatures } = await pool.query(
            `SELECT * FROM app_schema.candidatures WHERE programme_id = $1`,
            [PROGRAMME_ID]
        );
        
        if (candidatures.length === 0) {
            console.error(`Aucune candidature trouvée pour le programme ${PROGRAMME_ID}`);
            process.exit(1);
        }
        
        console.log(`${candidatures.length} candidatures trouvées pour le programme ${PROGRAMME_NAME}:`);
        candidatures.forEach((candidature, index) => {
            console.log(`  Candidature ${index + 1}: ${candidature.nom_equipe || 'Sans nom'} (ID: ${candidature.id})`);
        });
        
        // 3. Créer des livrables pour chaque phase
        const livrables = [];
        
        for (const phase of phases) {
            // Créer 2 livrables pour chaque phase
            const livrable1 = new liverable(
                null,
                `Présentation - Phase ${phase.nom}`,
                `Présentation détaillée des avancées pour la phase ${phase.nom}`,
                '2024-12-31',
                ['.pdf', '.pptx', '.docx'],
                phase.id
            );
            
            const livrable2 = new liverable(
                null,
                `Rapport technique - Phase ${phase.nom}`,
                `Rapport technique détaillé pour la phase ${phase.nom}`,
                '2024-12-31',
                ['.pdf', '.docx'],
                phase.id
            );
            
            // Enregistrer les livrables dans la base de données
            const livrable1Id = await liverable.create(livrable1);
            const livrable2Id = await liverable.create(livrable2);
            
            livrables.push({ id: livrable1Id, nom: livrable1.nom, phase_id: phase.id });
            livrables.push({ id: livrable2Id, nom: livrable2.nom, phase_id: phase.id });
            
            console.log(`✅ Livrables créés pour la phase ${phase.nom}:`);
            console.log(`  - ${livrable1.nom} (ID: ${livrable1Id})`);
            console.log(`  - ${livrable2.nom} (ID: ${livrable2Id})`);
        }
        
        // 4. Créer des soumissions de livrables pour chaque candidature
        // Créer le répertoire pour stocker les fichiers de test
        const uploadsDir = path.join(__dirname, '../uploads/livrables');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Créer des fichiers de test
        const testFilePath1 = path.join(uploadsDir, 'test-presentation.pdf');
        const testFilePath2 = path.join(uploadsDir, 'test-rapport.pdf');
        
        fs.writeFileSync(testFilePath1, 'Contenu de la présentation de test');
        fs.writeFileSync(testFilePath2, 'Contenu du rapport technique de test');
        
        console.log('✅ Fichiers de test créés');
        
        // Créer des soumissions pour chaque candidature et chaque livrable
        for (const candidature of candidatures) {
            // Pour chaque livrable, créer une soumission
            for (const livrable of livrables) {
                // Vérifier si une soumission existe déjà
                const { rows: existingSubmissions } = await pool.query(
                    `SELECT * FROM app_schema.livrable_soumissions 
                     WHERE livrable_id = $1 AND candidature_id = $2`,
                    [livrable.id, candidature.id]
                );
                
                if (existingSubmissions.length > 0) {
                    console.log(`⚠️ Une soumission existe déjà pour le livrable ${livrable.nom} et la candidature ${candidature.id}`);
                    continue;
                }
                
                // Créer une soumission avec un statut aléatoire
                const statuts = ['en attente', 'valide', 'rejete'];
                const statut = statuts[Math.floor(Math.random() * statuts.length)];
                
                // Choisir un fichier de test en fonction du type de livrable
                const filePath = livrable.nom.includes('Présentation') ? testFilePath1 : testFilePath2;
                const fileName = livrable.nom.includes('Présentation') ? 'presentation.pdf' : 'rapport.pdf';
                
                const soumission = new LivrableSoumission(
                    null,
                    livrable.id,
                    candidature.id,
                    fileName,
                    filePath,
                    new Date(),
                    statut
                );
                
                // Enregistrer la soumission dans la base de données
                const soumissionId = await LivrableSoumission.create(soumission);
                
                console.log(`✅ Soumission créée pour la candidature ${candidature.id} et le livrable ${livrable.nom}:`);
                console.log(`  - ID: ${soumissionId.id}`);
                console.log(`  - Statut: ${statut}`);
                console.log(`  - Fichier: ${fileName}`);
            }
        }
        
        console.log('✅ Toutes les soumissions ont été créées avec succès!');
        
        // Afficher un résumé
        console.log('\nRésumé:');
        console.log(`- Programme: ${PROGRAMME_NAME} (ID: ${PROGRAMME_ID})`);
        console.log(`- Phases: ${phases.length}`);
        console.log(`- Livrables créés: ${livrables.length}`);
        console.log(`- Candidatures: ${candidatures.length}`);
        console.log(`- Soumissions créées: ${candidatures.length * livrables.length} (maximum théorique)`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout des livrables:', error);
        process.exit(1);
    } finally {
        // Fermer la connexion à la base de données
        await pool.end();
    }
}

// Exécuter la fonction principale
addDeliverablesForProgram();
