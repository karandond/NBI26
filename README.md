# My App — React + Firebase + Node/Express Starter

A minimal, extensible full-stack starter with email/password auth (bcrypt + JWT),
a protected dashboard, and a clean separation between `frontend/` and `backend/`.

## Folder structure

```
project/
├── frontend/                  React (Vite) app — deploy to Vercel
│   ├── src/
│   │   ├── api/auth.js        Axios wrapper — all HTTP calls live here
│   │   ├── context/AuthContext.jsx   Global auth state (token + user)
│   │   ├── routes/ProtectedRoute.jsx Redirects to /login if not authenticated
│   │   ├── components/Navbar.jsx     Top bar with email + logout
│   │   ├── components/Sidebar.jsx    Dashboard / Profile / Settings links
│   │   ├── pages/Login.jsx           Login form
│   │   ├── pages/Dashboard.jsx       Layout + nested blank pages
│   │   ├── App.jsx                   Route definitions
│   │   └── main.jsx                  App entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json            SPA rewrite rule
│   └── .env.example
│
└── backend/                   Express API — deploy as Vercel Serverless Functions
    ├── src/
    │   ├── firebase.js            Firebase Admin SDK init (server-only)
    │   ├── middleware/verifyToken.js  JWT auth guard for future routes
    │   └── routes/auth.js         POST /api/login
    ├── app.js                 Express app (shared by local + serverless)
    ├── server.js               Local dev entry (node server.js)
    ├── api/index.js            Vercel serverless entry
    ├── seedUser.js              Inserts one bcrypt-hashed admin user
    ├── vercel.json               Routes all traffic to api/index.js
    └── .env.example
```

Frontend never talks to Firestore directly — only the backend does, using the
Firebase Admin SDK with a service account key.

---

## 1. Firebase setup (from scratch)

1. **Create a Firebase project**
   - Go to https://console.firebase.google.com
   - Click "Add project", name it, disable Google Analytics if you don't need it, click Create.

2. **Enable Firestore**
   - In the left sidebar, go to **Build → Firestore Database**
   - Click **Create database**, choose a region, start in **production mode**.

3. **Generate a service account key**
   - Go to **Project settings (gear icon) → Service accounts**
   - Click **Generate new private key** — this downloads a JSON file.
   - From that JSON you need three values:
     - `project_id` → `FIREBASE_PROJECT_ID`
     - `client_email` → `FIREBASE_CLIENT_EMAIL`
     - `private_key` → `FIREBASE_PRIVATE_KEY`

4. **Configure the Admin SDK**
   - Paste the three values into `backend/.env` (copy from `.env.example`).
   - The private key contains real newlines in the JSON file. When you paste it into
     a single-line `.env` value, replace actual newlines with the literal characters
     `\n` and wrap the whole value in double quotes, e.g.:
     ```
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
     ```
     `backend/src/firebase.js` already converts `\n` back into real newlines at runtime.

5. **Add the first user manually (optional)**
   - In the Firestore console, create a collection named `users`.
   - Add a document with fields: `email` (string), `password` (string — must be a
     bcrypt hash, not plain text), `role` (string), `createdAt` (timestamp).
   - It's easier to just run the seed script below instead of hashing a password by hand.

6. **Hash passwords with bcrypt before storing**
   - Never write a plain-text password into Firestore.
   - `backend/seedUser.js` does this for you with `bcrypt.hash(password, 10)`.

---

## 2. Install dependencies

```bash
# from the project root
cd frontend
npm install

cd ../backend
npm install
```

## 3. Configure environment variables

```bash
# frontend/.env
cp frontend/.env.example frontend/.env
# then set VITE_API_URL=http://localhost:5000 for local dev

# backend/.env
cp backend/.env.example backend/.env
# then fill in PORT, JWT_SECRET, and the three FIREBASE_* values
```

## 4. Seed an admin user into Firestore

```bash
cd backend
npm run seed
```

This inserts:
- email: `admin@test.com`
- password: `admin123` (stored as a bcrypt hash)
- role: `admin`

Edit the constants at the top of `seedUser.js` to seed a different user.

## 5. Run locally

```bash
# terminal 1
cd backend
npm run dev        # http://localhost:5000

# terminal 2
cd frontend
npm run dev         # http://localhost:5173
```

Log in at http://localhost:5173/login with `admin@test.com` / `admin123`.

## 6. Build the frontend

```bash
cd frontend
npm run build       # outputs to frontend/dist
```

---

## 7. Deploy to Vercel

Deploy `frontend/` and `backend/` as **two separate Vercel projects** — this keeps
concerns clean and each one deploys/scales independently.

### Deploy the backend

```bash
cd backend
npx vercel          # first deploy, follow the prompts
npx vercel --prod    # promote to production
```

In the Vercel dashboard for this project, go to **Settings → Environment Variables**
and add: `JWT_SECRET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY` (same values as your local `.env`). Redeploy after adding them
so the functions pick them up. Note the deployment URL, e.g. `https://my-app-backend.vercel.app`.

### Deploy the frontend

```bash
cd frontend
npx vercel
npx vercel --prod
```

In that project's **Settings → Environment Variables**, add:
`VITE_API_URL=https://my-app-backend.vercel.app` (your backend's deployed URL).
Redeploy so the build picks up the new value (Vite env vars are baked in at build time).

### Connect frontend to backend

The only wiring needed is `VITE_API_URL` on the frontend pointing at the backend's
deployed URL. `frontend/src/api/auth.js` reads this value and every request goes
through it, so nothing else in the React code needs to change between local and prod.

---

## Extending this later

- Add new protected API routes in `backend/src/routes/`, guard them with
  `verifyToken` from `backend/src/middleware/verifyToken.js`, and register them in `app.js`.
- Add new frontend pages under `frontend/src/pages/` and wire them into
  `Dashboard.jsx`'s nested `<Routes>` or `App.jsx` for top-level pages.
- All outgoing HTTP calls should go through `frontend/src/api/` — never call
  `axios`/`fetch` directly inside a component.
