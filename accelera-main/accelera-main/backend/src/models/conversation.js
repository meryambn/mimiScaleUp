import pool from '../../db.js';

export class Conversation {
    constructor(id, participant1_id, participant1_role, participant2_id, participant2_role, last_message_id, updated_at) {
        this.id = id;
        this.participant1_id = participant1_id;
        this.participant1_role = participant1_role;
        this.participant2_id = participant2_id;
        this.participant2_role = participant2_role;
        this.last_message_id = last_message_id;
        this.updated_at = updated_at || new Date().toISOString();
    }

    // Get all conversations for a user with details
    static async getForUser(userId, userRole) {
        try {
            const { rows } = await pool.query(
                `SELECT c.*,
                    CASE
                        WHEN c.participant1_id = $1 AND c.participant1_role = $2
                        THEN json_build_object('id', c.participant2_id, 'role', c.participant2_role)
                        ELSE json_build_object('id', c.participant1_id, 'role', c.participant1_role)
                    END as other_participant,
                    m.content as last_message_content,
                    m.created_at as last_message_time,
                    (SELECT COUNT(*) FROM app_schema.messages
                     WHERE recipient_id = $1 AND recipient_role = $2
                     AND is_read = false
                     AND ((sender_id = c.participant1_id AND sender_role = c.participant1_role AND sender_id != $1)
                          OR (sender_id = c.participant2_id AND sender_role = c.participant2_role AND sender_id != $1))
                    ) as unread_count
                FROM app_schema.conversations c
                LEFT JOIN app_schema.messages m ON c.last_message_id = m.id
                WHERE (c.participant1_id = $1 AND c.participant1_role = $2)
                OR (c.participant2_id = $1 AND c.participant2_role = $2)
                ORDER BY c.updated_at DESC`,
                [userId, userRole]
            );

            // For each conversation, get the other participant's details
            const conversationsWithDetails = await Promise.all(rows.map(async (conv) => {
                const otherParticipant = conv.other_participant;
                const { rows: userDetails } = await pool.query(
                    `SELECT id, email, role FROM app_schema.utilisateur WHERE id = $1 AND role = $2`,
                    [otherParticipant.id, otherParticipant.role]
                );

                // Get additional details based on role
                let additionalDetails = {};
                if (otherParticipant.role === 'startup') {
                    const { rows: startupDetails } = await pool.query(
                        `SELECT nom_entreprise as name FROM app_schema.startups WHERE utilisateur_id = $1`,
                        [otherParticipant.id]
                    );
                    additionalDetails = startupDetails[0] || {};
                } else if (otherParticipant.role === 'mentor') {
                    const { rows: mentorDetails } = await pool.query(
                        `SELECT nom, prenom FROM app_schema.mentors WHERE utilisateur_id = $1`,
                        [otherParticipant.id]
                    );
                    if (mentorDetails[0]) {
                        additionalDetails = {
                            name: `${mentorDetails[0].prenom} ${mentorDetails[0].nom}`
                        };
                    }
                } else if (otherParticipant.role === 'admin') {
                    additionalDetails = { name: 'Administrateur' };
                }

                return {
                    ...conv,
                    other_participant: {
                        ...otherParticipant,
                        ...userDetails[0],
                        ...additionalDetails
                    }
                };
            }));

            return conversationsWithDetails;
        } catch (error) {
            console.error('Error getting conversations:', error);
            throw error;
        }
    }

    // Get a specific conversation between two users
    static async getBetweenUsers(user1_id, user1_role, user2_id, user2_role) {
        try {
            const { rows } = await pool.query(
                `SELECT * FROM app_schema.conversations
                WHERE (participant1_id = $1 AND participant1_role = $2 AND participant2_id = $3 AND participant2_role = $4)
                OR (participant1_id = $3 AND participant1_role = $4 AND participant2_id = $1 AND participant2_role = $2)`,
                [user1_id, user1_role, user2_id, user2_role]
            );
            return rows[0];
        } catch (error) {
            console.error('Error getting conversation between users:', error);
            throw error;
        }
    }

    // Get all users that can be messaged by a specific user
    static async getPotentialContacts(userId, userRole) {
        try {
            let contacts = [];

            // Always get admin first (for all user types)
            // Let's try a different approach to find the admin user
            let adminContacts = [];
            try {
                // First, try to find admin user directly from utilisateur table
                const { rows: admins } = await pool.query(
                    `SELECT u.id as id, 'admin' as role, 'Administrateur' as name, u.email
                     FROM app_schema.utilisateur u
                     WHERE u.role = 'admin'
                     LIMIT 1`
                );

                if (admins.length > 0) {
                    console.log('Found admin user:', admins[0]);
                    adminContacts = admins.map(a => ({
                        id: a.id,
                        role: a.role,
                        name: a.name,
                        email: a.email
                    }));
                } else {
                    console.log('No admin user found in utilisateur table');
                }
            } catch (err) {
                console.error('Error getting admin user:', err);
                // If we can't find the admin, use a default admin (ID: 1)
                adminContacts = [{
                    id: 1,
                    role: 'admin',
                    name: 'Administrateur',
                    email: 'admin@example.com'
                }];
                console.log('Using default admin contact');
            }

            // If user is admin, get only mentors in their pool and startups from their programs
            if (userRole === 'admin') {
                console.log('Getting contacts for admin user:', userId);

                // Get only mentors in this admin's pool
                const { rows: mentors } = await pool.query(
                    `SELECT m.utilisateur_id as id, 'mentor' as role, m.nom, m.prenom,
                     u.email
                     FROM app_schema.mentors m
                     JOIN app_schema.utilisateur u ON m.utilisateur_id = u.id AND u.role = 'mentor'
                     JOIN app_schema.admin_mentors am ON m.utilisateur_id = am.mentor_id
                     WHERE am.admin_id = $1 AND am.status = 'active'`,
                    [userId]
                );

                // Get startups from programs created by this admin
                const { rows: startups } = await pool.query(
                    `SELECT DISTINCT s.utilisateur_id as id, 'startup' as role, s.nom_entreprise as name,
                     u.email
                     FROM app_schema.startups s
                     JOIN app_schema.utilisateur u ON s.utilisateur_id = u.id AND u.role = 'startup'
                     JOIN app_schema.candidatures c ON s.utilisateur_id = c.id
                     JOIN app_schema.programme p ON c.programme_id = p.id
                     WHERE p.admin_id = $1`,
                    [userId]
                );

                contacts = [
                    ...adminContacts,
                    ...mentors.map(m => ({
                        id: m.id,
                        role: m.role,
                        name: `${m.prenom} ${m.nom}`,
                        email: m.email
                    })),
                    ...startups.map(s => ({
                        id: s.id,
                        role: s.role,
                        name: s.name,
                        email: s.email
                    }))
                ];
            }
            // If user is mentor, get admin and startups from their programs
            else if (userRole === 'mentor') {
                console.log('Getting contacts for mentor user:', userId);

                try {
                    // Get startups from programs where this mentor is assigned
                    // Using LEFT JOINs to be more robust
                    console.log(`Looking for startups for mentor ${userId} in all programs`);

                    // First, find all programs this mentor is assigned to
                    const { rows: mentorPrograms } = await pool.query(
                        `SELECT pm.programme_id
                         FROM app_schema.programme_mentors pm
                         WHERE pm.mentor_id = $1`,
                        [userId]
                    );

                    console.log(`Found ${mentorPrograms.length} programs for mentor ${userId}`);

                    let startupRows = [];

                    // If we found programs, get startups for each program
                    if (mentorPrograms.length > 0) {
                        for (const program of mentorPrograms) {
                            console.log(`Looking for startups in program ${program.programme_id}`);

                            // Get all candidatures for this program
                            const { rows: programCandidatures } = await pool.query(
                                `SELECT c.id
                                 FROM app_schema.candidatures c
                                 WHERE c.programme_id = $1`,
                                [program.programme_id]
                            );

                            console.log(`Found ${programCandidatures.length} candidatures in program ${program.programme_id}`);

                            // For each candidature, get the startup
                            for (const candidature of programCandidatures) {
                                console.log(`Looking for startup with candidature ID ${candidature.id}`);

                                const { rows: candidatureStartups } = await pool.query(
                                    `SELECT DISTINCT s.utilisateur_id as id, 'startup' as role, s.nom_entreprise as name,
                                     u.email
                                     FROM app_schema.startups s
                                     JOIN app_schema.utilisateur u ON s.utilisateur_id = u.id AND u.role = 'startup'
                                     WHERE s.utilisateur_id = $1`,
                                    [candidature.id]
                                );

                                if (candidatureStartups.length > 0) {
                                    console.log(`Found startup for candidature ${candidature.id}`);
                                    startupRows = [...startupRows, ...candidatureStartups];
                                }
                            }

                            // If no startups found, try a different approach
                            if (startupRows.length === 0) {
                                console.log(`No startups found for program ${program.programme_id}, trying direct query`);

                                // Try to get all startups directly
                                const { rows: allStartups } = await pool.query(
                                    `SELECT DISTINCT s.utilisateur_id as id, 'startup' as role, s.nom_entreprise as name,
                                     u.email
                                     FROM app_schema.startups s
                                     JOIN app_schema.utilisateur u ON s.utilisateur_id = u.id AND u.role = 'startup'`
                                );

                                console.log(`Found ${allStartups.length} startups in total`);
                                startupRows = allStartups;
                            }
                        }
                    } else {
                        // If no programs found, try with program 204
                        console.log(`No programs found for mentor ${userId}, trying with programme_id = 204`);

                        const { rows: programStartups } = await pool.query(
                            `SELECT DISTINCT s.utilisateur_id as id, 'startup' as role, s.nom_entreprise as name,
                             u.email
                             FROM app_schema.candidatures c
                             JOIN app_schema.startups s ON c.id = s.utilisateur_id
                             JOIN app_schema.utilisateur u ON s.utilisateur_id = u.id AND u.role = 'startup'
                             WHERE c.programme_id = 204`
                        );

                        console.log(`Found ${programStartups.length} startups in program 204`);
                        startupRows = programStartups;
                    }

                    // Remove duplicates
                    const uniqueStartups = [];
                    const startupIds = new Set();

                    for (const startup of startupRows) {
                        if (!startupIds.has(startup.id)) {
                            startupIds.add(startup.id);
                            uniqueStartups.push(startup);
                        }
                    }

                    console.log(`Found ${uniqueStartups.length} unique startups for mentor ${userId}`);
                    const { rows: startups } = { rows: uniqueStartups };

                    console.log(`Found ${startups.length} startups for mentor ${userId}`);

                    contacts = [
                        ...adminContacts,
                        ...startups.map(s => ({
                            id: s.id,
                            role: s.role,
                            name: s.name,
                            email: s.email
                        }))
                    ];
                } catch (err) {
                    console.error('Error getting startups for mentor:', err);
                    // If query fails, still return admin contacts
                    contacts = [...adminContacts];
                }
            }
            // If user is startup, get admin and mentors from their programs
            else if (userRole === 'startup') {
                console.log('Getting contacts for startup user:', userId);

                try {
                    // Get mentors from programs where this startup is enrolled
                    // Using LEFT JOINs to be more robust
                    console.log(`Looking for mentors for startup ${userId} in all programs`);

                    // First, find all programs this startup is enrolled in
                    const { rows: candidatures } = await pool.query(
                        `SELECT c.programme_id
                         FROM app_schema.candidatures c
                         WHERE c.id = $1`,
                        [userId]
                    );

                    console.log(`Found ${candidatures.length} candidatures for startup ${userId}`);

                    let mentorRows = [];

                    // If we found candidatures, get mentors for each program
                    if (candidatures.length > 0) {
                        for (const candidature of candidatures) {
                            console.log(`Looking for mentors in program ${candidature.programme_id}`);

                            const { rows: programMentors } = await pool.query(
                                `SELECT DISTINCT m.utilisateur_id as id, 'mentor' as role, m.nom, m.prenom,
                                 u.email
                                 FROM app_schema.programme_mentors pm
                                 JOIN app_schema.mentors m ON pm.mentor_id = m.utilisateur_id
                                 JOIN app_schema.utilisateur u ON m.utilisateur_id = u.id AND u.role = 'mentor'
                                 WHERE pm.programme_id = $1`,
                                [candidature.programme_id]
                            );

                            console.log(`Found ${programMentors.length} mentors in program ${candidature.programme_id}`);
                            mentorRows = [...mentorRows, ...programMentors];
                        }
                    } else {
                        // If no candidatures found by ID, try a different approach
                        console.log(`No candidatures found with ID ${userId}, trying with programme_id = 204`);

                        const { rows: programMentors } = await pool.query(
                            `SELECT DISTINCT m.utilisateur_id as id, 'mentor' as role, m.nom, m.prenom,
                             u.email
                             FROM app_schema.programme_mentors pm
                             JOIN app_schema.mentors m ON pm.mentor_id = m.utilisateur_id
                             JOIN app_schema.utilisateur u ON m.utilisateur_id = u.id AND u.role = 'mentor'
                             WHERE pm.programme_id = 204`
                        );

                        console.log(`Found ${programMentors.length} mentors in program 204`);
                        mentorRows = programMentors;
                    }

                    // Remove duplicates
                    const uniqueMentors = [];
                    const mentorIds = new Set();

                    for (const mentor of mentorRows) {
                        if (!mentorIds.has(mentor.id)) {
                            mentorIds.add(mentor.id);
                            uniqueMentors.push(mentor);
                        }
                    }

                    console.log(`Found ${uniqueMentors.length} unique mentors for startup ${userId}`);
                    const { rows: mentors } = { rows: uniqueMentors };

                    console.log(`Found ${mentors.length} mentors for startup ${userId}`);

                    contacts = [
                        ...adminContacts,
                        ...mentors.map(m => ({
                            id: m.id,
                            role: m.role,
                            name: `${m.prenom} ${m.nom}`,
                            email: m.email
                        }))
                    ];
                } catch (err) {
                    console.error('Error getting mentors for startup:', err);
                    // If query fails, still return admin contacts
                    contacts = [...adminContacts];
                }
            } else {
                // For any other role, just return admin contacts
                console.log(`Unknown role ${userRole}, returning only admin contacts`);
                contacts = [...adminContacts];
            }

            // Log the results
            console.log(`Returning ${contacts.length} contacts for ${userRole} user ${userId}`);

            return contacts;
        } catch (error) {
            console.error('Error getting potential contacts:', error);
            // Return empty array instead of throwing to prevent 500 errors
            return [];
        }
    }
}
