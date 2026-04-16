CREATE TABLE forms (
    id CHAR(36) DEFAULT (UUID()) PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    form_type ENUM('CONFERENCE', 'COURSE', 'SPECIAL') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_forms_active (active),
    INDEX idx_forms_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE addons (
    id CHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    form_id CHAR(36) NOT NULL,

    title VARCHAR(255) NOT NULL,
    addon_type ENUM('SESSION', 'MEAL', 'ALL_SESSIONS_DISCOUNT', 'EARLY_DISCOUNT') NOT NULL,
    sort_order INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'PEN',

    hint VARCHAR(255),
    date_time DATETIME,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_addons_form_order (form_id, sort_order),
    INDEX idx_addons_active (active),

    CONSTRAINT fk_addons_form FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    CONSTRAINT chk_addon_logic CHECK (
        (addon_type = 'SESSION' AND date_time IS NOT NULL) OR 
        (addon_type = 'EARLY_DISCOUNT' AND date_time IS NOT NULL) OR 
        (addon_type = 'MEAL') OR 
        (addon_type = 'ALL_SESSIONS_DISCOUNT')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE submissions (
    id CHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    form_id CHAR(36) NOT NULL,

    first_name VARCHAR(127) NOT NULL,
    last_name VARCHAR(127) NOT NULL,
    email VARCHAR(255) NOT NULL,
    id_type VARCHAR(15) NOT NULL,
    id_value VARCHAR(31) NOT NULL,
    country_code VARCHAR(15) NOT NULL DEFAULT '+51',
    phone VARCHAR(31) NOT NULL,

    arrival_date DATE,
    departure_date DATE,
    medical_insurance VARCHAR(63),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_submissions_form_created (form_id, created_at),

    CONSTRAINT fk_submissions_form FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE emergency_contacts (
    id CHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    submission_id CHAR(36) NOT NULL,

    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    country_code VARCHAR(15) NOT NULL DEFAULT '+51',
    phone VARCHAR(31) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY (submission_id),

    CONSTRAINT fk_emergency_contacts_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
    id CHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    form_id CHAR(36) NOT NULL,
    submission_id CHAR(36) NOT NULL,

    status ENUM('DRAFT', 'CONFIRMED', 'CANCELLED', 'ON_SITE') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
    event_type ENUM("ALL_SESSIONS", "PER_SESSION", "PER_DAY") NOT NULL,
    meal_type ENUM("NONE", "REGULAR", "VEGETARIAN") NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_orders_form_event_type (form_id, event_type),
    INDEX idx_orders_form_meal_type (form_id, meal_type),
    INDEX idx_orders_form_currency (form_id, currency),
    INDEX idx_orders_form_status (form_id, status),

    UNIQUE KEY (submission_id),

    CONSTRAINT fk_orders_form FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
    id CHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    addon_id CHAR(36) NOT NULL,

    title VARCHAR(255) NOT NULL,
    addon_type ENUM('SESSION', 'MEAL', 'ALL_SESSIONS_DISCOUNT', 'EARLY_DISCOUNT') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
    date_time DATETIME,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY (order_id, addon_id),

    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_addon FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
    id CHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    order_id CHAR(36) NOT NULL,

    status ENUM('PENDING', 'PAID', 'FAILED', 'EXEMPT', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'PEN',

    method VARCHAR(63),
    gateway_id VARCHAR(255),
    provider VARCHAR(63),
    error_message TEXT,
    meta JSON,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rate_limits (
    ip VARCHAR(45) PRIMARY KEY,
    window_start INT NOT NULL,
    count INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
