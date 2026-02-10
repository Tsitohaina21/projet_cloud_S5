-- Active: 1768890741033@@127.0.0.1@5432@identity_db
-- La base de données est créée automatiquement par Docker via POSTGRES_DB

-- ============================
-- TABLE : users
-- ============================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    firebase_uid VARCHAR(255) UNIQUE DEFAULT NULL,
    temp_password VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (role IN ('user', 'manager'))
);

-- Index pour trouver les utilisateurs sans firebase_uid pour la sync
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_no_firebase_uid ON users(id) WHERE firebase_uid IS NULL;

-- ============================
-- TABLE : sessions
-- ============================
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================
-- TABLE : login_attempts
-- ============================
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT false
);

-- ============================
-- TABLE : account_lockouts
-- ============================
CREATE TABLE IF NOT EXISTS account_lockouts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    locked_until TIMESTAMP NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- INDEXES (performance)
-- ============================
CREATE INDEX IF NOT EXISTS idx_sessions_user_id
    ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_token
    ON sessions(token);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email
    ON login_attempts(email);

CREATE INDEX IF NOT EXISTS idx_account_lockouts_email
    ON account_lockouts(email);

-- ============================
-- FUNCTION : auto update updated_at
-- ============================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- TRIGGERS
-- ============================
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lockouts_updated_at
BEFORE UPDATE ON account_lockouts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- TABLE : signalements
-- ============================
CREATE TABLE IF NOT EXISTS signalements (
  id SERIAL PRIMARY KEY,
  firebase_id VARCHAR(255),
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('nouveau','en_cours','termine')),
  surface NUMERIC(12,2),
  niveau INTEGER DEFAULT 1 CHECK (niveau >= 1 AND niveau <= 10),
  niveau_modifie BOOLEAN DEFAULT false,
  budget NUMERIC(14,2),
  entreprise VARCHAR(255),
  user_email VARCHAR(255),
  synced BOOLEAN DEFAULT false,
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_en_cours DATE,
  date_termine DATE,
  photos JSONB DEFAULT '[]'::jsonb,
  photo TEXT
);

-- ============================
-- TABLE : settings (paramètres backoffice)
-- ============================
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Valeur par défaut du prix par m²
INSERT INTO settings (key, value, description) VALUES
  ('prix_par_m2', '5000', 'Prix forfaitaire par m² pour le calcul du budget (en Ariary)')
ON CONFLICT (key) DO NOTHING;

-- ============================
-- SIGNALEMENTS INDEXES
-- ============================
CREATE INDEX IF NOT EXISTS idx_signalements_status
    ON signalements(status);

CREATE INDEX IF NOT EXISTS idx_signalements_created_at
    ON signalements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signalements_firebase_id
    ON signalements(firebase_id);

CREATE INDEX IF NOT EXISTS idx_signalements_synced
    ON signalements(synced);

-- ============================
-- TEST DATA : signalements
-- ============================
INSERT INTO signalements (latitude, longitude, status, surface, niveau, budget, entreprise, created_at, date_en_cours, date_termine, photos) VALUES
  (-18.879200, 47.507900, 'nouveau', 150, 3, 2250000, 'Entreprise A', '2026-01-15', NULL, NULL, '["photo1.jpg"]'),
  (-18.885000, 47.515000, 'en_cours', 300, 5, 7500000, 'Entreprise B', '2026-01-10', '2026-01-20', NULL, '["photo2.jpg","photo3.jpg"]'),
  (-18.872000, 47.520000, 'termine', 200, 8, 8000000, 'Entreprise C', '2025-12-01', '2025-12-15', '2026-01-05', '[]'),
  (-18.890000, 47.500000, 'nouveau', 100, 2, 1000000, NULL, '2026-01-28', NULL, NULL, '["photo4.jpg"]')
ON CONFLICT DO NOTHING;
