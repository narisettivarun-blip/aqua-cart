# 🐟 Aqua Cart — Full Stack Fish Marketplace

A complete, hackathon-ready rebuild of the Aqua Cart fish-marketplace concept:
**Python (Flask) backend + SQLite3 database + Admin Approval System**, wired to
the original glassmorphism UI (with English / Telugu / Hindi support kept intact).

---

## ✨ What's included

- **Real backend** — Flask REST API, no more `localStorage` "database".
- **SQLite3** — a proper relational schema (`users`, `listings`) with foreign keys.
- **Secure auth** — passwords are hashed (`werkzeug.security`), sessions are server-side cookies.
- **Admin approval workflow** — every new signup starts as `pending`. Users **cannot log in**
  until an admin approves them from the Admin Panel. Admins can also reject or delete accounts.
- **Dedicated Admin Panel** (`/admin`) — stats dashboard, pending/approved/rejected user tabs,
  approve/reject/delete actions, and full listings moderation (remove any listing).
- **Full listings workflow** — sell (with photo upload saved on disk), browse, search,
  view full details + seller contact info, place order, mark sold/unsold, delete.
- **Multi-language UI** — English, Telugu (తెలుగు), Hindi (हिंदी) selector preserved.
- **Ready-to-run** — one command to install, one command to run.

### 📊 Market prices (admin-controlled)
- Home page shows a **Today's Market Price (per kg)** board. Users can only **view** it.
- Market price also appears on each listing and as a hint on the Sell page while typing the fish name.
- Only the admin can add / edit / delete prices: **Admin Panel → 📊 Market Prices**.
- Sample starting prices are seeded on first run; the admin should replace them with real rates.
- If you already have an `aqua_cart.db`, just restart the app: the new `market_prices` table is created automatically and your existing data is kept.

### 📝 Optional seller note
- The **Sell** form has an optional **Note** box (max 500 characters), e.g. "Fresh catch, call after 6 PM".
- The note shows on the listing details page, in My Ads, and in the admin's listing view.
- Older databases are upgraded automatically on startup (a `note` column is added; nothing is lost).

### Security improvements over the original prototype
The original version stored the user's **plain-text password** in `localStorage` and
displayed it back to the user under "Privacy → Show Password". That is not something a
real backend should ever do. In this version:
- Passwords are hashed with `werkzeug.security.generate_password_hash` and never stored
  or transmitted in plain text.
- The Privacy page shows account info only; passwords are changed via a proper
  "Change Password" form (verifies the current password first).

---

## 🗂 Project structure

```
aqua_cart/
├── app.py                 # Flask app — all routes & REST API
├── database.py             # SQLite3 connection helpers + auto-seeding
├── schema.sql               # Database schema (users, listings)
├── requirements.txt
├── README.md
├── templates/
│   ├── index.html            # Main marketplace UI
│   └── admin.html            # Admin panel UI
└── static/
    ├── css/style.css
    ├── js/app.js              # Marketplace frontend logic (fetch-based)
    ├── js/admin.js            # Admin panel frontend logic
    └── uploads/                # Uploaded fish photos land here
```

`aqua_cart.db` (the SQLite3 file) is created automatically the first time you run the app —
it is **not** shipped in this zip so you always start from a clean database.

---

## 🚀 Getting started

**Requirements:** Python 3.9+

```bash
cd aqua_cart
pip install -r requirements.txt
python app.py
```

The server starts at **http://127.0.0.1:5000**

- Marketplace app → http://127.0.0.1:5000/
- Admin panel → http://127.0.0.1:5000/admin

On first run, `app.py` automatically creates `aqua_cart.db` from `schema.sql` and seeds a
default admin account:

| Field    | Value                |
|----------|-----------------------|
| Email    | `admin@aquacart.com`  |
| Password | `Admin@123`           |

> ⚠️ **Change this password immediately** if you deploy this anywhere real. You can also
> set a stronger session secret via the `AQUA_CART_SECRET` environment variable before
> starting the app in production.

---

## 🔄 How the approval flow works

1. A new user registers on the site (name, phone, email, password) → account is created
   with `status = 'pending'`.
2. If they try to log in while pending, they get a clear "pending admin approval" message.
3. The **admin** logs in at `/admin`, opens **Pending Approvals**, and clicks **Approve**
   (or **Reject**).
4. Once approved, the user can log in normally, agree to the safety precautions, and start
   buying/selling fish.

---

## 🧩 REST API overview

| Method | Endpoint                              | Description                          |
|--------|----------------------------------------|---------------------------------------|
| POST   | `/api/register`                        | Create account (status = pending)     |
| POST   | `/api/login`                           | Log in (must be approved)             |
| POST   | `/api/logout`                          | Log out                                |
| GET    | `/api/me`                              | Current session user                   |
| PUT    | `/api/profile`                         | Update name/phone                     |
| PUT    | `/api/profile/password`                | Change password                        |
| GET    | `/api/listings?q=`                     | Browse / search listings              |
| GET    | `/api/listings/mine`                   | My listings                            |
| GET    | `/api/listings/<id>`                   | Listing detail                         |
| POST   | `/api/listings`                        | Create listing (multipart + photo)     |
| POST   | `/api/listings/<id>/sold`              | Mark my listing sold                   |
| POST   | `/api/listings/<id>/unsold`            | Mark my listing available again        |
| DELETE | `/api/listings/<id>`                   | Delete my listing                      |
| POST   | `/api/listings/<id>/order`             | Buy / place order on a listing         |
| GET    | `/api/market-prices`                   | View market price of each fish (any logged-in user) |
| POST   | `/api/admin/market-prices`             | Add a fish price (**admin only**)      |
| PUT    | `/api/admin/market-prices/<id>`        | Change a fish price (**admin only**)   |
| DELETE | `/api/admin/market-prices/<id>`        | Remove a fish price (**admin only**)   |
| POST   | `/api/admin/login`                     | Admin login                            |
| GET    | `/api/admin/stats`                     | Dashboard counts                       |
| GET    | `/api/admin/users?status=`             | List users by status                   |
| POST   | `/api/admin/users/<id>/approve`        | Approve a pending user                 |
| POST   | `/api/admin/users/<id>/reject`         | Reject a user                          |
| DELETE | `/api/admin/users/<id>`                | Delete a user account                  |
| GET    | `/api/admin/listings`                  | All listings (moderation)              |
| DELETE | `/api/admin/listings/<id>`             | Remove any listing                     |

---

## 🛠 Notes for extending this project

- To reset the database at any time, delete `aqua_cart.db` and restart the app (it will be
  recreated and a fresh admin account seeded), or call `database.init_db(reset=True)`.
- Uploaded photos are saved under `static/uploads/` with randomized filenames.
- The app uses Flask's built-in dev server — for a real deployment put it behind
  `gunicorn`/`waitress` and a reverse proxy, and set `debug=False`.
