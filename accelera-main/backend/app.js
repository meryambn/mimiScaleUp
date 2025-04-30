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
dotenv.config({ path: './vrbl.env' });

const app = express();

app.use(express.json()); // n9raw le corps des requêtes JSN
app.use(express.urlencoded({ extended: true }));
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
// hna ndirou des petits test de connextion
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
app.listen(port, () => {
  console.log('started on port 8083');
});
