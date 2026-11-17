-- Aqua Cart Database Schema (SQLite3)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    phone         TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_admin      INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id     INTEGER NOT NULL,
    type          TEXT NOT NULL,
    tons          REAL NOT NULL DEFAULT 0,
    weight        REAL NOT NULL,
    weight_unit   TEXT NOT NULL DEFAULT 'kg',
    pieces        INTEGER NOT NULL,
    price_per_kg  REAL NOT NULL,
    total_price   REAL NOT NULL,
    address       TEXT NOT NULL,
    photo         TEXT,
    note          TEXT,
    status        TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Sold')),
    buyer_id      INTEGER,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id)  REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- Market price per kg for each fish. ONLY the admin can add / edit / delete these.
CREATE TABLE IF NOT EXISTS market_prices (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    fish_name    TEXT NOT NULL UNIQUE,
    price_per_kg REAL NOT NULL CHECK (price_per_kg >= 0),
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
