# Hostel Management System

A minimal, beginner-friendly full-stack hostel management application built with **React + Vite** (frontend), **Node.js + Express** (backend), and **PostgreSQL** (database).

This is the **Stage 1 starter project**. It includes the complete database schema, rich demo data, a runnable backend (auth + health check), and a minimal React frontend. More features (room management, bookings, fees, dashboard stats) are built incrementally in later stages.

---

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | React 18, Vite, React Router, CSS   |
| Backend    | Node.js, Express, express-session   |
| Database   | PostgreSQL 14+                      |
| DB Driver  | `pg` (parameterized queries)        |
| Auth       | `bcryptjs` password hashing + sessions |
| HTTP       | `fetch` in React (via `services/api.js`) |

---

## Folder Structure

```
hoster menegment/
├── frontend/
│   ├── src/
│   │   ├── components/        (shared UI components - added in later stages)
│   │   ├── pages/             (Login, Dashboard, StudentPortal)
│   │   ├── services/
│   │   │   └── api.js         (fetch wrapper for all backend calls)
│   │   ├── App.jsx            (router + auth guard)
│   │   ├── main.jsx           (React entry point)
│   │   └── index.css          (global styles + design tokens)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js          (PostgreSQL connection pool)
│   │   ├── controllers/       (request handlers / business logic)
│   │   ├── middleware/        (auth guards, role checks)
│   │   ├── models/            (SQL query modules - added in later stages)
│   │   ├── routes/            (URL -> controller mapping)
│   │   ├── app.js             (Express app + middleware wiring)
│   │   └── server.js          (starts the HTTP server)
│   ├── .env.example
│   └── package.json
└── database/
    ├── schema.sql             (run FIRST - creates all tables)
    └── seed.sql               (run SECOND - loads demo data)
```

---

## How MVC Works In This Project

- **React (frontend)** = the *View*. It renders UI and sends HTTP requests.
- **Express Routes** (`routes/`) = the *Controller entry point*. They match a URL/HTTP method to a controller function.
- **Controllers** (`controllers/`) = the *Controller logic*. They validate input, call the database, and send the response.
- **Models** (`models/`) = the *Model*. They contain the SQL queries that talk to PostgreSQL.

A request flows like this:

```
Browser  ->  React fetch (services/api.js)
         ->  Express route (routes/auth.js)
         ->  Controller (controllers/authController.js)
         ->  Database (config/db.js + models/)
         ->  Response back to React
```

---

## 1. Database Setup (pgAdmin)

You do **not** need to import or upload files. Just copy and paste the SQL directly into pgAdmin's Query Tool.

### Step A — Create the database

1. Open **pgAdmin** and connect to your PostgreSQL server.
2. Right-click **Databases** → **Create** → **Database...**
3. Name it `hostel_manegment` and click **Save**.

### Step B — Run the schema

1. Select the `hostel_manegment` database.
2. Open **Tools → Query Tool**.
3. Open the file [database/schema.sql](database/schema.sql), copy **everything**, and paste it into the Query Tool.
4. Click **Execute** (▶️) or press `F5`.

This creates all 9 tables, constraints, indexes, and the `room_occupancy` view.

### Step C — Run the seed data

1. In the same Query Tool (or a new one), open [database/seed.sql](database/seed.sql), copy **everything**, and paste it.
2. Click **Execute**.

This creates:
- 1 building (Grand Heritage Hostel)
- 10 floors, 2 sections per floor (A & B), **200 rooms** with variable capacities (2/3/4/6 beds)
- 1 admin user + **30 Bollywood-themed demo students** (with hashed passwords)
- 30 bookings across all statuses (checked-in, confirmed, pending, cancelled, completed)
- 30 fee records with payments covering fully-paid, partially-paid, unpaid, and overdue states

### Step D — Verify

Run these queries to confirm everything loaded:

```sql
SELECT COUNT(*) AS buildings FROM buildings;          -- 1
SELECT COUNT(*) AS floors FROM floors;                -- 10
SELECT COUNT(*) AS sections FROM sections;            -- 20
SELECT COUNT(*) AS rooms FROM rooms;                  -- 200
SELECT COUNT(*) AS students FROM students;            -- 30
SELECT SUM(capacity) AS total_beds FROM rooms;        -- total bed capacity
SELECT status, COUNT(*) FROM bookings GROUP BY status;
```

---

## 2. Backend Setup

```powershell
cd backend
copy .env.example .env
```

Edit `backend/.env` and set your real PostgreSQL password:

```
PG_PASSWORD=your_actual_postgres_password
SESSION_SECRET=any_long_random_string
```

Install dependencies and start:

```powershell
npm install
npm start
```

The backend runs at **http://localhost:5000**.

Test the health check:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

You should see `"status":"ok"` and `"database":"connected"`.

---

## 3. Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at **http://localhost:5173**.

Vite proxies `/api/*` requests to `http://localhost:5000` (see `vite.config.js`), so no CORS issues during development.

---

## 4. Demo Credentials (development only)

| Role    | Email                                | Password     |
| ------- | ------------------------------------ | ------------ |
| Admin   | `admin@hostel.com`                   | `Admin@123`   |
| Student | `shahrukh.khan@student.hostel.com`   | `Student@123` |

All 30 students use the password `Student@123`. Their emails follow the pattern `firstname.lastname@student.hostel.com`.

---

## 5. Current REST Endpoints (Stage 1)

| Method | URL            | Auth | Description                |
| ------ | -------------- | ---- | -------------------------- |
| GET    | `/api/health`  | No   | Health + DB connectivity   |
| POST   | `/api/auth/login`  | No   | Login (creates session) |
| POST   | `/api/auth/logout` | Yes  | Logout (destroys session) |
| GET    | `/api/auth/me`     | Yes  | Current user info        |

---

## 6. How Authentication Works

1. User submits email + password → `POST /api/auth/login`.
2. Controller looks up the user by email and verifies the password with `bcrypt.compare()`.
3. On success, `userId` and `role` are stored in an **express-session** (cookie-based, httpOnly).
4. Protected routes check `req.session.userId` via the `requireAuth` middleware.
5. Role-based routes use `requireRole(['admin'])`.

Passwords are **never** stored in plain text. The seed uses pre-computed bcrypt hashes.

---

## Next Stages

The starter is intentionally minimal. We'll build incrementally:

1. **Auth & authorization** ✅ (done in Stage 1)
2. Building / floor / section / room management
3. Student management (CRUD)
4. Booking & room allocation with capacity validation
5. Check-in / check-out
6. Fee tracking & payments
7. Dashboard statistics
8. Testing & deployment prep

---

## Common Errors & Debugging

- **`database: "disconnected"` on `/api/health`** — your `.env` `PG_PASSWORD` is wrong, or PostgreSQL isn't running, or the database doesn't exist yet.
- **Login fails with "Invalid email or password"** — make sure you ran `seed.sql`. Passwords are case-sensitive.
- **`ECONNREFUSED` in the browser** — the backend isn't running. Start it with `npm start` in `backend/`.
- **Vite proxy errors** — keep the backend on port 5000 (or update `vite.config.js`).
