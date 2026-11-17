"""
database.py
------------
Small SQLite3 helper layer for Aqua Cart.
No ORM - plain sqlite3 with row factory so results behave like dicts.
"""

import sqlite3
import os
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "aqua_cart.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")

DEFAULT_ADMIN_EMAIL = "admin@aquacart.com"
DEFAULT_ADMIN_PASSWORD = "Admin@123"

# Starting market prices (Rs per kg). These are only sample values -
# the admin can change every one of them from the Admin Panel.
DEFAULT_MARKET_PRICES = [
    ("Rohu", 180), ("Catla", 190), ("Pomfret", 650), ("Tiger Prawns", 550),
    ("Hilsa", 900), ("Seer Fish (Vanjaram)", 800), ("Tuna", 350),
    ("Mackerel", 220), ("Sardine", 150), ("Tilapia", 140), ("Pangasius (Basa)", 130),
]


def get_db():
    """Open a new connection with row factory set to sqlite3.Row (dict-like)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(reset=False):
    """
    Create the database schema if it doesn't exist yet and seed a default
    admin account. Call this once at application startup.
    """
    first_time = not os.path.exists(DB_PATH)

    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        first_time = True

    conn = get_db()
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()

    # Upgrade older databases: add the optional seller "note" column if missing.
    listing_cols = [r["name"] for r in conn.execute("PRAGMA table_info(listings)").fetchall()]
    if "note" not in listing_cols:
        conn.execute("ALTER TABLE listings ADD COLUMN note TEXT")
        conn.commit()
        print("[init_db] Added 'note' column to listings")

    # Seed the default admin account only if no admin exists yet.
    existing_admin = conn.execute(
        "SELECT id FROM users WHERE is_admin = 1 LIMIT 1"
    ).fetchone()

    if existing_admin is None:
        conn.execute(
            """INSERT INTO users (name, phone, email, password_hash, status, is_admin)
               VALUES (?, ?, ?, ?, 'approved', 1)""",
            (
                "Aqua Cart Admin",
                "0000000000",
                DEFAULT_ADMIN_EMAIL,
                generate_password_hash(DEFAULT_ADMIN_PASSWORD),
            ),
        )
        conn.commit()
        print(f"[init_db] Seeded default admin -> {DEFAULT_ADMIN_EMAIL} / {DEFAULT_ADMIN_PASSWORD}")

    # Seed sample market prices only when the table is empty.
    if conn.execute("SELECT COUNT(*) FROM market_prices").fetchone()[0] == 0:
        conn.executemany(
            "INSERT INTO market_prices (fish_name, price_per_kg) VALUES (?, ?)",
            DEFAULT_MARKET_PRICES,
        )
        conn.commit()
        print("[init_db] Seeded sample market prices (admin can edit them)")

    conn.close()

    if first_time:
        print(f"[init_db] Fresh database created at {DB_PATH}")
    else:
        print(f"[init_db] Using existing database at {DB_PATH}")


def query_one(query, args=()):
    conn = get_db()
    row = conn.execute(query, args).fetchone()
    conn.close()
    return dict(row) if row else None


def query_all(query, args=()):
    conn = get_db()
    rows = conn.execute(query, args).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def execute(query, args=()):
    """Run an INSERT/UPDATE/DELETE and return (lastrowid, rowcount)."""
    conn = get_db()
    cur = conn.execute(query, args)
    conn.commit()
    lastrowid, rowcount = cur.lastrowid, cur.rowcount
    conn.close()
    return lastrowid, rowcount
