import pool from '../../db.js';

export class Notification {
    constructor(id, user_id, user_role, type, title, message, related_id, is_read, created_at) {
        this.id = id;
        this.user_id = user_id;
        this.user_role = user_role;
        this.type = type;
        this.title = title;
        this.message = message;
        this.related_id = related_id;
        this.is_read = is_read || false;
        this.created_at = created_at || new Date().toISOString();
    }

    // Create a new notification
    static async create(notification) {
        try {
            const { rows } = await pool.query(
                `INSERT INTO app_schema.notifications
                (user_id, user_role, type, title, message, related_id, is_read)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [
                    notification.user_id,
                    notification.user_role,
                    notification.type,
                    notification.title,
                    notification.message,
                    notification.related_id,
                    notification.is_read || false
                ]
            );

            return rows[0];
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Get notifications for a user
    static async getByUserId(user_id, user_role) {
        try {
            const { rows } = await pool.query(
                `SELECT * FROM app_schema.notifications
                WHERE user_id = $1 AND user_role = $2
                ORDER BY created_at DESC`,
                [user_id, user_role]
            );

            return rows;
        } catch (error) {
            console.error('Error getting notifications:', error);
            throw error;
        }
    }

    // Mark a notification as read
    static async markAsRead(notification_id) {
        try {
            const { rows } = await pool.query(
                `UPDATE app_schema.notifications
                SET is_read = true
                WHERE id = $1
                RETURNING *`,
                [notification_id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    // Mark all notifications as read for a user
    static async markAllAsRead(user_id, user_role) {
        try {
            const { rows } = await pool.query(
                `UPDATE app_schema.notifications
                SET is_read = true
                WHERE user_id = $1 AND user_role = $2
                RETURNING *`,
                [user_id, user_role]
            );
            return rows;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    // Delete a notification
    static async delete(notification_id) {
        try {
            const { rows } = await pool.query(
                `DELETE FROM app_schema.notifications
                WHERE id = $1
                RETURNING *`,
                [notification_id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    // Get unread notification count for a user
    static async getUnreadCount(user_id, user_role) {
        try {
            const { rows } = await pool.query(
                `SELECT COUNT(*) as count FROM app_schema.notifications
                WHERE user_id = $1 AND user_role = $2 AND is_read = false`,
                [user_id, user_role]
            );
            return parseInt(rows[0].count);
        } catch (error) {
            console.error('Error getting unread notification count:', error);
            throw error;
        }
    }

    // Get notifications by user ID, type, and related ID
    static async getByUserIdAndType(user_id, user_role, type, related_id) {
        try {
            const { rows } = await pool.query(
                `SELECT * FROM app_schema.notifications
                WHERE user_id = $1
                AND user_role = $2
                AND type = $3
                AND related_id = $4
                ORDER BY created_at DESC`,
                [user_id, user_role, type, related_id]
            );

            return rows;
        } catch (error) {
            console.error('Error getting notifications by type and related_id:', error);
            throw error;
        }
    }
}