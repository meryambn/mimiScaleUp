import pool from '../../db.js';

export class utilisateur{
  constructor(id, email, motDePasse, telephone, role, date_creation) {
      this.id = id;
      this.email = email;
      this.motDePasse = motDePasse;
      this.telephone = telephone;
      this.role = role;
      this.date_creation = date_creation || new Date().toISOString();
  }
  static async create(email, hashedmotDePasse, telephone, role) {
    const result = await pool.query(
      `INSERT INTO app_schema.utilisateur (email, motdepasse, telephone, role)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [email, hashedmotDePasse, telephone, role]
    );
    return result.rows[0].id;
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM app_schema.utilisateur WHERE email = $1',
      [email]
    );
    return result.rows[0];
}

static async findById(id) {
  const result = await pool.query(
    'SELECT * FROM app_schema.utilisateur WHERE id = $1',
    [id]
  );
  return result.rows[0];
}
static async updatePassword(id, newHashedPassword) {
  await pool.query(
    'UPDATE app_schema.utilisateur SET motDePasse = $1 WHERE id = $2',
    [newHashedPassword, id]
  );
}
}