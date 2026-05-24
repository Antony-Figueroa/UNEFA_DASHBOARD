-- Migration 001: Create t_persons table
CREATE TABLE IF NOT EXISTS t_persons (
    person_id        SERIAL PRIMARY KEY,
    ci               VARCHAR(10) NOT NULL UNIQUE,
    first_name       VARCHAR(255) NOT NULL,
    middle_name      VARCHAR(255),
    last_name        VARCHAR(255) NOT NULL,
    second_last_name VARCHAR(255),
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(15),
    gender           VARCHAR(10),
    birthdate        DATE,
    address          VARCHAR(255),
    marital_status   VARCHAR(45),
    status           SMALLINT DEFAULT 1,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persons_ci ON t_persons(ci);
CREATE INDEX IF NOT EXISTS idx_persons_names ON t_persons(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_persons_email ON t_persons(email);
CREATE INDEX IF NOT EXISTS idx_persons_status ON t_persons(status);
