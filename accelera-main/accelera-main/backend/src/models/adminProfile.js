import pool from '../../db.js';

export class AdminProfile {
    constructor(admin_id, nom, prenom, telephone, photo, biographie, accelerator_name, location, year_founded, website, contact_info) {
        this.admin_id = admin_id;
        this.nom = nom;
        this.prenom = prenom;
        this.telephone = telephone;
        this.photo = photo;
        this.biographie = biographie;
        this.accelerator_name = accelerator_name;
        this.location = location;
        this.year_founded = year_founded;
        this.website = website;
        this.contact_info = contact_info;
    }

    // Find admin profile by admin ID
    static async findByAdminId(admin_id) {
        try {
            // Check if admin profile exists
            const profileResult = await pool.query(
                'SELECT * FROM app_schema.admin_profiles WHERE admin_id = $1',
                [admin_id]
            );

            return profileResult.rows[0];
        } catch (error) {
            console.error('Error finding admin profile:', error);
            throw error;
        }
    }

    // Create a new admin profile
    static async create(admin_id, profileData) {
        try {
            const { nom, prenom, telephone, photo, biographie, accelerator_name, location, year_founded, website, contact_info } = profileData;

            const result = await pool.query(
                `INSERT INTO app_schema.admin_profiles
                (admin_id, nom, prenom, telephone, photo, biographie, accelerator_name, location, year_founded, website, contact_info)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *`,
                [
                    admin_id,
                    nom,
                    prenom,
                    telephone,
                    photo || '/default-avatar.jpg',
                    biographie || '',
                    accelerator_name || '',
                    location || '',
                    year_founded || null,
                    website || '',
                    contact_info || ''
                ]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error creating admin profile:', error);
            throw error;
        }
    }

    // Update an existing admin profile
    static async update(admin_id, profileData) {
        try {
            const { nom, prenom, telephone, photo, biographie, accelerator_name, location, year_founded, website, contact_info } = profileData;

            // Build the SET clause dynamically based on provided fields
            const updates = [];
            const values = [admin_id];
            let paramIndex = 2;

            if (nom !== undefined) {
                updates.push(`nom = $${paramIndex++}`);
                values.push(nom);
            }

            if (prenom !== undefined) {
                updates.push(`prenom = $${paramIndex++}`);
                values.push(prenom);
            }

            if (telephone !== undefined) {
                updates.push(`telephone = $${paramIndex++}`);
                values.push(telephone);
            }

            if (photo !== undefined) {
                updates.push(`photo = $${paramIndex++}`);
                values.push(photo);
            }

            if (biographie !== undefined) {
                updates.push(`biographie = $${paramIndex++}`);
                values.push(biographie);
            }

            if (accelerator_name !== undefined) {
                updates.push(`accelerator_name = $${paramIndex++}`);
                values.push(accelerator_name);
            }

            if (location !== undefined) {
                updates.push(`location = $${paramIndex++}`);
                values.push(location);
            }

            if (year_founded !== undefined) {
                updates.push(`year_founded = $${paramIndex++}`);
                values.push(year_founded);
            }

            if (website !== undefined) {
                updates.push(`website = $${paramIndex++}`);
                values.push(website);
            }

            if (contact_info !== undefined) {
                updates.push(`contact_info = $${paramIndex++}`);
                values.push(contact_info);
            }

            // If no fields to update, return the existing profile
            if (updates.length === 0) {
                return this.findByAdminId(admin_id);
            }

            const setClause = updates.join(', ');

            const result = await pool.query(
                `UPDATE app_schema.admin_profiles
                SET ${setClause}
                WHERE admin_id = $1
                RETURNING *`,
                values
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error updating admin profile:', error);
            throw error;
        }
    }

    // Get or create admin profile
    static async getOrCreate(admin_id, defaultData = {}) {
        try {
            // Try to find existing profile
            const existingProfile = await this.findByAdminId(admin_id);

            // If profile exists, return it
            if (existingProfile) {
                return existingProfile;
            }

            // If profile doesn't exist, create it with default data
            return await this.create(admin_id, defaultData);
        } catch (error) {
            console.error('Error in getOrCreate admin profile:', error);
            throw error;
        }
    }
}
