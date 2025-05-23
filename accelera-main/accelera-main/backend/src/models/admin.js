import pool from '../../db.js';
import bcrypt from 'bcrypt';

export class Admin {
   //1 ere methode chercher l'admin par son email
    static async findByEmail(email) {
      const result = await pool.query(
        'SELECT * FROM app_schema.admin WHERE email = $1',
        [email]
      );
      return result.rows[0];
    }

    // Find admin by ID
    static async findById(id) {
      const result = await pool.query(
        'SELECT * FROM app_schema.admin WHERE id = $1',
        [id]
      );
      return result.rows[0];
    }

    // Méthode pour créer un nouveau compte admin
    static async create(email, hashedMotDePasse) {
        try {
            const result = await pool.query(
                `INSERT INTO app_schema.admin (email, motdepasse)
                 VALUES ($1, $2) RETURNING id`,
                [email, hashedMotDePasse]
            );
            return result.rows[0].id;
        } catch (err) {
            console.error('Erreur de création de compte admin:', err);
            throw err;
        }
    }

    //2 eme methode pour creer d'un compte admin demostratif
  static async createDemoAccount() {
    const demoAdmin = {
      email: 'admin@example.com',
       motDePasse: 'password'
    };

    try {
      const exists = await this.findByEmail(demoAdmin.email);
      //si admin nexiste pas on le cree
      if (!exists) {
        const hashedmotDePasse = await bcrypt.hash(demoAdmin. motDePasse, 10);
        await pool.query(//insert admin dans bdd
          `INSERT INTO app_schema.admin (email,  motDePasse)
           VALUES ($1,$2) `,
          [demoAdmin.email,  hashedmotDePasse]);
        console.log ('admin cree')}

    }catch(err){
        console.error('erreur de creation de compte admin',err);
    }}}

