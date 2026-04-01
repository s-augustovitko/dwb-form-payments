-- SETTINGS TABLE
CREATE TABLE settings (
    id CHAR(36) NOT NULL PRIMARY KEY,

    title VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,

    form_type VARCHAR(32) NOT NULL,

    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,

    meal_price_pen DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    meal_price_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    session_price_pen DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    session_price_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    disclaimer TEXT DEFAULT NULL, -- TODO: Add to app

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- INDEXES
    INDEX idx_settings_active_start_id (active, start_date, id),
    INDEX idx_settings_active_dates (active, start_date, end_date)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- MEALS TABLE
CREATE TABLE meals (
    id CHAR(36) NOT NULL PRIMARY KEY,

    settings_id CHAR(36) NOT NULL,

    title VARCHAR(256) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- INDEXES
    INDEX idx_meals_settings_id (settings_id, id)

    CONSTRAINT fk_meals_settings
        FOREIGN KEY (settings_id)
        REFERENCES settings(id)
        ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- SESSIONS TABLE
CREATE TABLE sessions (
    id CHAR(36) NOT NULL PRIMARY KEY,

    settings_id CHAR(36) NOT NULL,

    title VARCHAR(256) NOT NULL,
    session_time TIMESTAMP NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- INDEXES
    INDEX idx_sessions_settings_time (settings_id, session_time, id),

    CONSTRAINT fk_sessions_settings
        FOREIGN KEY (settings_id)
        REFERENCES settings(id)
        ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- Form responses table
CREATE TABLE form_responses (
    id CHAR(36) NOT NULL PRIMARY KEY,

    settings_id CHAR(36) NOT NULL,

    -- TALK (base fields)
    first_name VARCHAR(256) NOT NULL,
    last_name VARCHAR(256) NOT NULL,

    email VARCHAR(512) NOT NULL,

    country_code VARCHAR(64) NOT NULL DEFAULT '+51',
    phone VARCHAR(32) NOT NULL,

    id_type VARCHAR(16) NOT NULL DEFAULT 'DNI',
    id_value VARCHAR(16) NOT NULL,

    -- EVENT (COURSE + SPECIAL)
    meal_type VARCHAR(16) DEFAULT 'REGULAR',
    meals_count INT DEFAULT 0,
    meal_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    event_type VARCHAR(16) DEFAULT 'FULL',
    sessions_count INT DEFAULT 0,
    session_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    -- SPECIAL ONLY
    arrival_date TIMESTAMP DEFAULT NULL,
    departure_date TIMESTAMP DEFAULT NULL,

    medical_insurance VARCHAR(64) DEFAULT NULL,

    emergency_contact_name VARCHAR(512) DEFAULT NULL,
    emergency_contact_country_code VARCHAR(16) DEFAULT '+51',
    emergency_contact_phone VARCHAR(32) DEFAULT NULL,
    emergency_contact_email VARCHAR(512) DEFAULT NULL,

    currency VARCHAR(8) DEFAULT 'PEN',

    -- PAYMENT
    payment_id VARCHAR(64),
    payment_status VARCHAR(64) DEFAULT 'PENDING',
    payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    -- META
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- INDEXES
    INDEX idx_responses_settings_created (settings_id, created_at, id),

    CONSTRAINT fk_responses_settings
        FOREIGN KEY (settings_id)
        REFERENCES settings(id)
        ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- Api Rate limiting
CREATE TABLE rate_limits (
    ip VARCHAR(45) PRIMARY KEY,
    window_start INT NOT NULL,
    count INT NOT NULL
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
