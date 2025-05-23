import express from 'express';
import { livrableSoumissionController } from '../controllers/livrableSoumissionController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../../uploads/livrables');
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Générer un nom de fichier unique avec timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'livrable-' + uniqueSuffix + extension);
    }
});

// Filtrer les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
    // Récupérer les types de fichiers autorisés depuis la requête
    const allowedTypes = req.body.types_fichiers ? req.body.types_fichiers.split(',').map(type => type.trim()) : [];

    // Si aucun type n'est spécifié, accepter tous les fichiers
    if (allowedTypes.length === 0) {
        return cb(null, true);
    }

    // Vérifier si l'extension du fichier est autorisée
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(extension)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé. Types autorisés: ${allowedTypes.join(', ')}`), false);
    }
};

// Initialiser Multer avec la configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de taille de fichier (10 MB)
    }
});

// Route pour soumettre un livrable (avec téléchargement de fichier)
router.post('/soumettre', upload.single('fichier'), livrableSoumissionController.soumettrelivrable);

// Route pour récupérer toutes les soumissions pour un livrable spécifique
router.get('/livrable/:livrableId', livrableSoumissionController.getSoumissionsByLivrable);

// Route pour récupérer toutes les soumissions pour une équipe spécifique
router.get('/equipe/:candidatureId', livrableSoumissionController.getSoumissionsByEquipe);

// Route pour télécharger un fichier soumis
router.get('/telecharger/:soumissionId', livrableSoumissionController.telechargerFichier);

// Route pour mettre à jour le statut d'une soumission
router.put('/statut/:soumissionId', livrableSoumissionController.updateStatus);

export default router;
