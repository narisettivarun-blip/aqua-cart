"""
Aqua Cart - Python (Flask) + SQLite3 backend
=============================================
A fish-market place with:
  - Email/password auth (hashed passwords, server-side sessions)
  - New accounts require ADMIN APPROVAL before they can log in
  - Full listings CRUD (create / browse / search / mark sold / delete)
  - Photo upload handling
  - A dedicated Admin Panel to approve / reject accounts and moderate listings

Run:
    pip install -r requirements.txt
    python app.py
Then open:
    http://127.0.0.1:5000/            -> the marketplace app
    http://127.0.0.1:5000/admin       -> the admin panel
Default admin login:
    admin@aquacart.com / Admin@123   (change this after first login!)
"""

import os
import uuid
from functools import wraps

from flask import (
    Flask, render_template, request, jsonify, session, send_from_directory
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

import database as db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("AQUA_CART_SECRET", "dev-secret-change-me-in-production")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8 MB max upload

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def public_user(row):
    """Strip sensitive fields before sending a user object to the client."""
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "phone": row["phone"],
        "email": row["email"],
        "status": row["status"],
        "is_admin": bool(row["is_admin"]),
    }


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({"ok": False, "error": "Please log in first."}), 401
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("user_id") or not session.get("is_admin"):
            return jsonify({"ok": False, "error": "Admin access required."}), 403
        return f(*args, **kwargs)
    return wrapper


def current_user_row():
    uid = session.get("user_id")
    if not uid:
        return None
    return db.query_one("SELECT * FROM users WHERE id = ?", (uid,))


def listing_public(row):
    return {
        "id": row["id"],
        "type": row["type"],
        "tons": row["tons"],
        "weight": row["weight"],
        "weightUnit": row["weight_unit"],
        "pieces": row["pieces"],
        "pricePerKg": row["price_per_kg"],
        "price": row["total_price"],
        "address": row["address"],
        "note": row.get("note") or "",
        "photo": f"/static/uploads/{row['photo']}" if row["photo"] else None,
        "status": row["status"],
        "sellerId": row["seller_id"],
        "sellerName": row.get("seller_name"),
        "sellerPhone": row.get("seller_phone"),
        "buyerName": row.get("buyer_name"),
        "buyerPhone": row.get("buyer_phone"),
        "createdAt": row["created_at"],
    }


LISTINGS_SELECT = """
    SELECT l.*,
           s.name  AS seller_name,  s.phone AS seller_phone,
           b.name  AS buyer_name,   b.phone AS buyer_phone
    FROM listings l
    JOIN users s ON s.id = l.seller_id
    LEFT JOIN users b ON b.id = l.buyer_id
"""


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/admin")
def admin_page():
    return render_template("admin.html")


@app.route("/static/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ---------------------------------------------------------------------------
# Auth API
# ---------------------------------------------------------------------------

@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json(force=True, silent=True) or {}
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not phone or not email or not password:
        return jsonify({"ok": False, "error": "All fields are required."}), 400
    if len(password) < 6:
        return jsonify({"ok": False, "error": "Password must be at least 6 characters."}), 400

    existing = db.query_one("SELECT id FROM users WHERE email = ?", (email,))
    if existing:
        return jsonify({"ok": False, "error": "An account with this email already exists."}), 409

    user_id, _ = db.execute(
        """INSERT INTO users (name, phone, email, password_hash, status, is_admin)
           VALUES (?, ?, ?, ?, 'pending', 0)""",
        (name, phone, email, generate_password_hash(password)),
    )

    return jsonify({
        "ok": True,
        "message": "Account created! It is now pending admin approval. "
                   "You'll be able to log in once an admin approves your account."
    }), 201


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"ok": False, "error": "Email and password are required."}), 400

    user = db.query_one("SELECT * FROM users WHERE email = ?", (email,))
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"ok": False, "error": "Invalid email or password."}), 401

    if user["status"] == "pending":
        return jsonify({"ok": False, "error": "Your account is still pending admin approval.",
                         "status": "pending"}), 403
    if user["status"] == "rejected":
        return jsonify({"ok": False, "error": "Your account request was rejected by the admin.",
                         "status": "rejected"}), 403

    session["user_id"] = user["id"]
    session["is_admin"] = bool(user["is_admin"])

    return jsonify({"ok": True, "user": public_user(user)})


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/me")
def api_me():
    user = current_user_row()
    if not user:
        return jsonify({"ok": False, "user": None})
    return jsonify({"ok": True, "user": public_user(user)})


# ---------------------------------------------------------------------------
# Profile API
# ---------------------------------------------------------------------------

@app.route("/api/profile", methods=["PUT"])
@login_required
def api_update_profile():
    data = request.get_json(force=True, silent=True) or {}
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    if not name or not phone:
        return jsonify({"ok": False, "error": "Name and phone are required."}), 400

    db.execute("UPDATE users SET name = ?, phone = ? WHERE id = ?",
               (name, phone, session["user_id"]))
    user = current_user_row()
    return jsonify({"ok": True, "user": public_user(user)})


@app.route("/api/profile/password", methods=["PUT"])
@login_required
def api_change_password():
    data = request.get_json(force=True, silent=True) or {}
    current_password = data.get("currentPassword") or ""
    new_password = data.get("newPassword") or ""

    user = current_user_row()
    if not check_password_hash(user["password_hash"], current_password):
        return jsonify({"ok": False, "error": "Current password is incorrect."}), 400
    if len(new_password) < 6:
        return jsonify({"ok": False, "error": "New password must be at least 6 characters."}), 400

    db.execute("UPDATE users SET password_hash = ? WHERE id = ?",
               (generate_password_hash(new_password), user["id"]))
    return jsonify({"ok": True, "message": "Password updated successfully."})


# ---------------------------------------------------------------------------
# Listings API
# ---------------------------------------------------------------------------

@app.route("/api/listings", methods=["GET"])
@login_required
def api_listings():
    q = request.args.get("q", "").strip().lower()
    rows = db.query_all(LISTINGS_SELECT + " ORDER BY l.created_at DESC")
    if q:
        rows = [r for r in rows if q in (r["type"] or "").lower() or q in (r["address"] or "").lower()]
    return jsonify({"ok": True, "listings": [listing_public(r) for r in rows]})


@app.route("/api/listings/mine", methods=["GET"])
@login_required
def api_my_listings():
    rows = db.query_all(
        LISTINGS_SELECT + " WHERE l.seller_id = ? ORDER BY l.created_at DESC",
        (session["user_id"],),
    )
    return jsonify({"ok": True, "listings": [listing_public(r) for r in rows]})


@app.route("/api/listings/<int:listing_id>", methods=["GET"])
@login_required
def api_listing_detail(listing_id):
    row = db.query_one(LISTINGS_SELECT + " WHERE l.id = ?", (listing_id,))
    if not row:
        return jsonify({"ok": False, "error": "Listing not found."}), 404
    return jsonify({"ok": True, "listing": listing_public(row)})


@app.route("/api/listings", methods=["POST"])
@login_required
def api_create_listing():
    form = request.form
    fish_type = (form.get("type") or "").strip()
    tons = form.get("tons") or 0
    weight = form.get("weight")
    weight_unit = form.get("weightUnit") or "kg"
    pieces = form.get("pieces")
    price_per_kg = form.get("pricePerKg")
    address = (form.get("address") or "").strip()
    note = (form.get("note") or "").strip()[:500]  # optional, max 500 characters
    photo = request.files.get("photo")

    if not all([fish_type, weight, pieces, price_per_kg, address, photo]):
        return jsonify({"ok": False, "error": "Please fill all fields and attach a photo."}), 400
    if not allowed_file(photo.filename):
        return jsonify({"ok": False, "error": "Unsupported image type."}), 400

    try:
        tons_f = float(tons or 0)
        weight_f = float(weight)
        pieces_i = int(pieces)
        price_per_kg_f = float(price_per_kg)
    except ValueError:
        return jsonify({"ok": False, "error": "Numeric fields contain invalid values."}), 400

    # Total price: if tons given and unit is kg, price is based on tonnage converted to kg.
    if weight_unit == "kg" and tons_f > 0:
        total_price = tons_f * 1000 * price_per_kg_f
    else:
        total_price = price_per_kg_f

    ext = photo.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    photo.save(os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(filename)))

    listing_id, _ = db.execute(
        """INSERT INTO listings
           (seller_id, type, tons, weight, weight_unit, pieces, price_per_kg, total_price, address, note, photo, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')""",
        (session["user_id"], fish_type, tons_f, weight_f, weight_unit, pieces_i,
         price_per_kg_f, total_price, address, note, filename),
    )
    row = db.query_one(LISTINGS_SELECT + " WHERE l.id = ?", (listing_id,))
    return jsonify({"ok": True, "listing": listing_public(row)}), 201


def _owned_listing_or_404(listing_id, user_id):
    row = db.query_one("SELECT * FROM listings WHERE id = ?", (listing_id,))
    if not row:
        return None, (jsonify({"ok": False, "error": "Listing not found."}), 404)
    if row["seller_id"] != user_id:
        return None, (jsonify({"ok": False, "error": "You do not own this listing."}), 403)
    return row, None


@app.route("/api/listings/<int:listing_id>/sold", methods=["POST"])
@login_required
def api_mark_sold(listing_id):
    row, err = _owned_listing_or_404(listing_id, session["user_id"])
    if err:
        return err
    db.execute("UPDATE listings SET status = 'Sold' WHERE id = ?", (listing_id,))
    return jsonify({"ok": True})


@app.route("/api/listings/<int:listing_id>/unsold", methods=["POST"])
@login_required
def api_mark_unsold(listing_id):
    row, err = _owned_listing_or_404(listing_id, session["user_id"])
    if err:
        return err
    db.execute("UPDATE listings SET status = 'Available', buyer_id = NULL WHERE id = ?", (listing_id,))
    return jsonify({"ok": True})


@app.route("/api/listings/<int:listing_id>", methods=["DELETE"])
@login_required
def api_delete_listing(listing_id):
    row, err = _owned_listing_or_404(listing_id, session["user_id"])
    if err:
        return err
    if row["photo"]:
        try:
            os.remove(os.path.join(app.config["UPLOAD_FOLDER"], row["photo"]))
        except OSError:
            pass
    db.execute("DELETE FROM listings WHERE id = ?", (listing_id,))
    return jsonify({"ok": True})


@app.route("/api/listings/<int:listing_id>/order", methods=["POST"])
@login_required
def api_place_order(listing_id):
    row = db.query_one("SELECT * FROM listings WHERE id = ?", (listing_id,))
    if not row:
        return jsonify({"ok": False, "error": "Listing not found."}), 404
    if row["status"] == "Sold":
        return jsonify({"ok": False, "error": "This listing is already sold."}), 409
    if row["seller_id"] == session["user_id"]:
        return jsonify({"ok": False, "error": "You cannot order your own listing."}), 400

    db.execute("UPDATE listings SET status = 'Sold', buyer_id = ? WHERE id = ?",
               (session["user_id"], listing_id))
    return jsonify({"ok": True, "message": "Order placed successfully! Marked as Sold."})


# ---------------------------------------------------------------------------
# Market prices API
#   - Any logged-in user can VIEW prices (GET /api/market-prices)
#   - ONLY the admin can add / change / delete them (/api/admin/market-prices...)
# ---------------------------------------------------------------------------

def price_public(row):
    return {
        "id": row["id"],
        "fishName": row["fish_name"],
        "pricePerKg": row["price_per_kg"],
        "updatedAt": row["updated_at"],
    }


def _parse_price(value):
    """Return a valid non-negative float or None."""
    try:
        price = float(value)
    except (TypeError, ValueError):
        return None
    if price < 0 or price != price or price == float("inf"):
        return None
    return round(price, 2)


@app.route("/api/market-prices", methods=["GET"])
@login_required
def api_market_prices():
    rows = db.query_all("SELECT * FROM market_prices ORDER BY fish_name COLLATE NOCASE")
    return jsonify({"ok": True, "prices": [price_public(r) for r in rows]})


@app.route("/api/admin/market-prices", methods=["POST"])
@admin_required
def api_admin_add_price():
    data = request.get_json(force=True, silent=True) or {}
    name = (data.get("fishName") or "").strip()
    price = _parse_price(data.get("pricePerKg"))
    if not name or price is None:
        return jsonify({"ok": False, "error": "Enter a fish name and a valid price."}), 400
    if db.query_one("SELECT id FROM market_prices WHERE LOWER(fish_name) = LOWER(?)", (name,)):
        return jsonify({"ok": False, "error": "This fish already has a market price."}), 409
    new_id, _ = db.execute(
        "INSERT INTO market_prices (fish_name, price_per_kg) VALUES (?, ?)", (name, price))
    row = db.query_one("SELECT * FROM market_prices WHERE id = ?", (new_id,))
    return jsonify({"ok": True, "price": price_public(row)}), 201


@app.route("/api/admin/market-prices/<int:price_id>", methods=["PUT"])
@admin_required
def api_admin_update_price(price_id):
    data = request.get_json(force=True, silent=True) or {}
    price = _parse_price(data.get("pricePerKg"))
    if price is None:
        return jsonify({"ok": False, "error": "Enter a valid price."}), 400
    _, count = db.execute(
        "UPDATE market_prices SET price_per_kg = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (price, price_id))
    if count == 0:
        return jsonify({"ok": False, "error": "Fish not found."}), 404
    row = db.query_one("SELECT * FROM market_prices WHERE id = ?", (price_id,))
    return jsonify({"ok": True, "price": price_public(row)})


@app.route("/api/admin/market-prices/<int:price_id>", methods=["DELETE"])
@admin_required
def api_admin_delete_price(price_id):
    db.execute("DELETE FROM market_prices WHERE id = ?", (price_id,))
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Admin API
# ---------------------------------------------------------------------------

@app.route("/api/admin/login", methods=["POST"])
def api_admin_login():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = db.query_one("SELECT * FROM users WHERE email = ? AND is_admin = 1", (email,))
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"ok": False, "error": "Invalid admin credentials."}), 401

    session["user_id"] = user["id"]
    session["is_admin"] = True
    return jsonify({"ok": True, "user": public_user(user)})


@app.route("/api/admin/stats")
@admin_required
def api_admin_stats():
    return jsonify({"ok": True, "stats": {
        "pendingUsers": db.query_one("SELECT COUNT(*) c FROM users WHERE status='pending'")["c"],
        "approvedUsers": db.query_one("SELECT COUNT(*) c FROM users WHERE status='approved' AND is_admin=0")["c"],
        "rejectedUsers": db.query_one("SELECT COUNT(*) c FROM users WHERE status='rejected'")["c"],
        "totalListings": db.query_one("SELECT COUNT(*) c FROM listings")["c"],
        "availableListings": db.query_one("SELECT COUNT(*) c FROM listings WHERE status='Available'")["c"],
        "soldListings": db.query_one("SELECT COUNT(*) c FROM listings WHERE status='Sold'")["c"],
    }})


@app.route("/api/admin/users")
@admin_required
def api_admin_users():
    status = request.args.get("status")
    if status in ("pending", "approved", "rejected"):
        rows = db.query_all(
            "SELECT * FROM users WHERE status = ? AND is_admin = 0 ORDER BY created_at DESC", (status,)
        )
    else:
        rows = db.query_all("SELECT * FROM users WHERE is_admin = 0 ORDER BY created_at DESC")
    return jsonify({"ok": True, "users": [public_user(r) for r in rows]})


@app.route("/api/admin/users/<int:user_id>/approve", methods=["POST"])
@admin_required
def api_admin_approve(user_id):
    db.execute("UPDATE users SET status = 'approved' WHERE id = ? AND is_admin = 0", (user_id,))
    return jsonify({"ok": True})


@app.route("/api/admin/users/<int:user_id>/reject", methods=["POST"])
@admin_required
def api_admin_reject(user_id):
    db.execute("UPDATE users SET status = 'rejected' WHERE id = ? AND is_admin = 0", (user_id,))
    return jsonify({"ok": True})


@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@admin_required
def api_admin_delete_user(user_id):
    db.execute("DELETE FROM users WHERE id = ? AND is_admin = 0", (user_id,))
    return jsonify({"ok": True})


@app.route("/api/admin/listings")
@admin_required
def api_admin_listings():
    rows = db.query_all(LISTINGS_SELECT + " ORDER BY l.created_at DESC")
    return jsonify({"ok": True, "listings": [listing_public(r) for r in rows]})


@app.route("/api/admin/listings/<int:listing_id>", methods=["DELETE"])
@admin_required
def api_admin_delete_listing(listing_id):
    row = db.query_one("SELECT * FROM listings WHERE id = ?", (listing_id,))
    if row and row["photo"]:
        try:
            os.remove(os.path.join(app.config["UPLOAD_FOLDER"], row["photo"]))
        except OSError:
            pass
    db.execute("DELETE FROM listings WHERE id = ?", (listing_id,))
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    db.init_db()
    app.run(debug=True, host="127.0.0.1", port=5000)
