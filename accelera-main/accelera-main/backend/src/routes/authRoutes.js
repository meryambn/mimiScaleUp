import express from 'express';
import { authController } from '../controllers/authController.js';

// créer un objet routeur cest un outil d'orga de route
const router = express.Router();
//route pour cnx
router.post('/login', authController.login);
//route pour inscription
router.post('/register', authController.register);
//route pour inscription admin
router.post('/register-admin', authController.registerAdmin);
//route pour modif le mdp
router.put('/updateMotdepasse', authController.updatePassword);

export default router;