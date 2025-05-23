import express from 'express';
import { resourceController } from '../controllers/resourceController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define uploads directory for resources
const uploadsDir = path.join(__dirname, '../../uploads/resources');

// Create directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'resource-' + uniqueSuffix + extension);
    }
});

// Initialize multer with configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB file size limit
    }
});

// Create a new resource for a program (with file upload support)
router.post('/create/:programId', upload.single('file'), resourceController.createResource);

// Get all resources for a program
router.get('/program/:programId', resourceController.getProgramResources);

// Get a specific resource
router.get('/:resourceId', resourceController.getResource);

// Download a resource file
router.get('/download/:resourceId', resourceController.downloadResource);

// Update a resource
router.put('/update/:resourceId', upload.single('file'), resourceController.updateResource);

// Delete a resource
router.delete('/delete/:resourceId', resourceController.deleteResource);

export default router;