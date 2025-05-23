import express from 'express';
import pool from './db.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import authRoutes from './src/routes/authRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import programmeRoutes from './src/routes/programmeRoutes.js';
import phaseRoutes from './src/routes/phaseRoutes.js';
import {Admin} from './src/models/admin.js';
import tacheRoutes from './src/routes/tacheRoutes.js';
import reunionRoutes from './src/routes/reunionRoutes.js';
import critereRoutes from './src/routes/critereRoutes.js';
import liverableRoutes from './src/routes/liverableRoutes.js';
import qstRoutes from './src/routes/qstRoutes.js'
import formRoutes from './src/routes/formRoutes.js'
import resourceRoutes from './src/routes/resourceRoutes.js'
import soumRoutes from './src/routes/soumRoutes.js'
import biographieRoutes from './src/routes/biographieRoutes.js';
import adminMentorRoutes from './src/routes/adminMentorRoutes.js';
import candidatureRoutes from './src/routes/candidatureRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import programmeSoumissionRoutes from './src/routes/programmeSoumissionRoutes.js'
import candidaturePhaseRoutes from './src/routes/candidaturePhaseRoutes.js'
import livrableSoumissionRoutes from './src/routes/livrableSoumissionRoutes.js'
import messageRoutes from './src/routes/messageRoutes.js'
import noteRoutes from './src/routes/noteRoutes.js'
import notePhaseRoutes from './src/routes/notePhaseRoutes.js'
import cors from 'cors';
import multer from 'multer';
import http from 'http';
import { initSocketServer } from './src/socket/socketServer.js';
dotenv.config({ path: './vrbl.env' });

const app = express();
const upload = multer();
app.use(express.json()); // n9raw le corps des requêtes JSN
app.use(express.urlencoded({ extended: true }));
// Configuration CORS plus permissive pour le développement
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Gestion pré-vol OPTIONS
app.options('*', cors());
//hna on appelle des routes pour les utiliser
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
//pour authetification
app.use('/api/auth', authRoutes);
//pour afficher les infos d'un profil
app.use('/api/profile', profileRoutes);

// pour programmes
app.use('/api/programmes', programmeRoutes);
//pour phases
app.use('/api/phase',phaseRoutes);
//pour les taches
app.use('/api/tache',tacheRoutes);
//pour les reunions
app.use('/api/reunion',reunionRoutes);
//pour les criteres
app.use('/api/critere',critereRoutes);
//pour liverable
app.use('/api/liverable',liverableRoutes);
//pour question
app.use('/api/question',qstRoutes);
//pour un forms
app.use('/api/form',formRoutes);
//pour resource
app.use('/api/resources', resourceRoutes);
//pour soum
app.use('/api/soum',soumRoutes)
//pour biographie
app.use('/api/biographie',biographieRoutes);
//pour admin mentor
app.use('/api/mentor',adminMentorRoutes);
//pour une candidature
app.use('/api/cand', candidatureRoutes);
//pour notifications
app.use('/api/notifications', notificationRoutes);
//pour soumission programme (add and get une startup a un programme)
app.use('/api/programme-startups',programmeSoumissionRoutes)
//pour avancer et revenir dans une phase
app.use('/api/CandidaturePhase',candidaturePhaseRoutes)
//pour les soumissions de livrables
app.use('/api/livrable-soumissions', livrableSoumissionRoutes)
//pour les messages
app.use('/api/messages', messageRoutes)
//pour reponses des criteres
app.use('/api/note',noteRoutes)
//pour la note de chaque phase
app.use('/api/note-phase',notePhaseRoutes)

// hna ndirou desin the admin interface every program has a status brouillon actif and termine and modele how could we implement this in the backend + program can be in the same time a modele and another status but the others u can only have one + we can  change status from termine to others and from actif to brouillon petits test de connextion
console.log('affiche le mdps ya lhmar =', process.env.DB_PASSWORD);

pool.query('SELECT NOW() AS current_time', (err, res) => {
  if (err) {
    console.log(' non connecté :', err.message);
  } else {
    console.log('Connecté ! Heure actuelle :', res.rows[0].current_time);
  }
});
//creer le compte demo
Admin.createDemoAccount();

const port = 8083;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Start the server
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
  console.log(`Socket.IO server initialized`);
});
