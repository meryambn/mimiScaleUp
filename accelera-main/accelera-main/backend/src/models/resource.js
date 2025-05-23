import pool from '../../db.js';

export class Resource {
    constructor(id, title, description, type, is_external, file_path, url, created_at, program_id, category) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.is_external = is_external;
        this.file_path = file_path;
        this.url = url;
        this.created_at = created_at;
        this.program_id = program_id;
        this.category = category;
    }

    // Create a new resource
    static async create(resource) {
        const { rows } = await pool.query(
            `INSERT INTO app_schema.resources
            (title, description, type, is_external, file_path, url, program_id, category)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id`,
            [
                resource.title,
                resource.description,
                resource.type,
                resource.is_external,
                resource.file_path,
                resource.url,
                resource.program_id,
                resource.category
            ]
        );
        return rows[0].id;
    }

    // Get all resources
    static async getAll() {
        const { rows } = await pool.query(
            `SELECT * FROM app_schema.resources ORDER BY created_at DESC`
        );
        return rows;
    }

    // Get resources by program ID
    static async getByProgramId(programId) {
        const { rows } = await pool.query(
            `SELECT * FROM app_schema.resources 
            WHERE program_id = $1 
            ORDER BY created_at DESC`,
            [programId]
        );
        return rows;
    }

    // Get resource by ID
    static async getById(id) {
        const { rows } = await pool.query(
            `SELECT * FROM app_schema.resources WHERE id = $1`,
            [id]
        );
        return rows[0];
    }

    // Update a resource
    static async update(id, resource) {
        await pool.query(
            `UPDATE app_schema.resources
            SET title = $1, description = $2, type = $3, is_external = $4, 
                file_path = $5, url = $6, category = $7
            WHERE id = $8`,
            [
                resource.title,
                resource.description,
                resource.type,
                resource.is_external,
                resource.file_path,
                resource.url,
                resource.category,
                id
            ]
        );
    }

    // Delete a resource
    static async delete(id) {
        await pool.query(
            `DELETE FROM app_schema.resources WHERE id = $1`,
            [id]
        );
    }
}