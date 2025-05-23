-- Chat system tables

-- Table for storing messages
CREATE TABLE IF NOT EXISTS app_schema.messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    sender_role app_schema.role_utilisateur NOT NULL,
    recipient_id INTEGER NOT NULL,
    recipient_role app_schema.role_utilisateur NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id, sender_role) 
        REFERENCES app_schema.utilisateur(id, role) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id, recipient_role) 
        REFERENCES app_schema.utilisateur(id, role) ON DELETE CASCADE
);

-- Table for storing chat conversations
CREATE TABLE IF NOT EXISTS app_schema.conversations (
    id SERIAL PRIMARY KEY,
    participant1_id INTEGER NOT NULL,
    participant1_role app_schema.role_utilisateur NOT NULL,
    participant2_id INTEGER NOT NULL,
    participant2_role app_schema.role_utilisateur NOT NULL,
    last_message_id INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant1_id, participant1_role) 
        REFERENCES app_schema.utilisateur(id, role) ON DELETE CASCADE,
    FOREIGN KEY (participant2_id, participant2_role) 
        REFERENCES app_schema.utilisateur(id, role) ON DELETE CASCADE,
    FOREIGN KEY (last_message_id) 
        REFERENCES app_schema.messages(id) ON DELETE SET NULL,
    UNIQUE(participant1_id, participant1_role, participant2_id, participant2_role)
);

-- Index for faster message retrieval
CREATE INDEX IF NOT EXISTS idx_messages_sender ON app_schema.messages(sender_id, sender_role);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON app_schema.messages(recipient_id, recipient_role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON app_schema.messages(created_at);

-- Index for faster conversation retrieval
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON app_schema.conversations(participant1_id, participant1_role);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON app_schema.conversations(participant2_id, participant2_role);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON app_schema.conversations(updated_at);
