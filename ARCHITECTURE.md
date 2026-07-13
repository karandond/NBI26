# Project Architecture & Workflow Documentation

## Overview

This is a full-stack web application with a React frontend and an Express.js backend, using Google Cloud Firestore as the database. Both sides are deployed independently to Vercel.

```
K:/project/
├── frontend/     React (Vite) SPA → deploys as Vercel static site
└── backend/      Express API     → deploys as Vercel Serverless Functions
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  React SPA (Vite)                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  React Router│   │  AuthContext │   │  Axios Instance│  │
│  │  (routing)   │   │  (JWT state) │   │  (HTTP client) │  │
│  └──────┬───────┘   └──────┬───────┘   └───────┬────────┘  │
│         │                  │                   │            │
│         └──────────────────┴───────────────────┘            │
└─────────────────────────────────────────┬───────────────────┘
                                          │ HTTPS
                                          │ Authorization: Bearer <JWT>
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Express)                       │
│                                                             │
│  ┌─────────┐   ┌──────────────┐   ┌────────────────────┐   │
│  │  CORS   │→  │express.json()│→  │     Routes         │   │
│  │middleware│  │  (body parse)│   │  /api/health       │   │
│  └─────────┘   └──────────────┘   │  /api/login        │   │
│                                   │  (future protected) │   │
│                                   └──────────┬─────────┘   │
│                                              │              │
│                                   ┌──────────▼─────────┐   │
│                                   │   verifyToken.js   │   │
│                                   │  (JWT middleware,  │   │
│                                   │   future routes)   │   │
│                                   └──────────┬─────────┘   │
└──────────────────────────────────────────────┼─────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Cloud Firestore (nbi2026)               │
│                                                             │
│  users collection                                           │
│  { email, password (bcrypt), role, createdAt }              │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend

### Entry Points

| File | Purpose |
|---|---|
| `backend/app.js` | Express app definition — registers middleware and routes |
| `backend/api/index.js` | Vercel serverless adapter — re-exports `app` for deployment |

### Starting the Server Locally

```bash
cd backend
npm install
node app.js        # runs on PORT from .env (default 5000)
```

### Middleware Stack (applied to every request)

1. **`cors()`** — allows all origins (no restriction currently)
2. **`express.json()`** — parses JSON request bodies

### API Endpoints

#### `GET /api/health`
- **Auth:** None (public)
- **Purpose:** Liveness check — confirms the API process is running
- **Response:**
  ```json
  { "success": true, "message": "API is running" }
  ```

---

#### `POST /api/login`
- **Auth:** None (public — this IS the auth endpoint)
- **File:** `backend/src/routes/auth.js`
- **Request body:**
  ```json
  { "email": "user@example.com", "password": "plaintext_password" }
  ```

**Step-by-step flow:**

```
1. Validate body
   ├── email or password missing?
   │     → 400 { success: false, message: "Email and password are required" }
   └── both present → continue

2. Query Firestore
   db.collection('users').where('email', '==', email).limit(1).get()
   ├── No matching document?
   │     → 401 { success: false, message: "Invalid credentials" }
   └── User found → continue

3. Verify password
   bcrypt.compare(password, user.password)
   ├── Does not match?
   │     → 401 { success: false, message: "Invalid credentials" }
   └── Match → continue

4. Sign JWT
   jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '1d' })

5. Respond
   → 200 {
       success: true,
       token: "<signed JWT>",
       user: { id, email, role }
     }
```

**Error response (any unexpected server error):**
```json
{ "success": false, "message": "Server error" }
```

---

### Auth Middleware — `verifyToken`

**File:** `backend/src/middleware/verifyToken.js`

This middleware is **ready but not yet applied to any route**. It will protect future endpoints.

**How it works:**
```
Request arrives with header:
  Authorization: Bearer eyJhbGci...

1. Extract token from header
   ├── No Authorization header or wrong format?
   │     → 401 { success: false, message: "No token provided" }
   └── Token present → continue

2. jwt.verify(token, JWT_SECRET)
   ├── Expired or invalid signature?
   │     → 401 { success: false, message: "Token expired or invalid" }
   └── Valid → attach decoded payload to req.user, call next()
```

**To protect a future route:**
```js
// In app.js:
app.use('/api/users', verifyToken, require('./src/routes/users'))
```

After `verifyToken` runs, route handlers can access `req.user.id`, `req.user.email`, and `req.user.role`.

---

### Firebase / Firestore

**File:** `backend/src/firebase.js`

Initializes the Firebase Admin SDK once (guards against double-init). Exports:
- `admin` — the Firebase Admin instance
- `db` — the Firestore database client

**Current credential loading:** reads from `serviceAccountKey.json` (local file).

**Intended credential loading (env-var based, documented in `.env.example`):**
```
FIREBASE_PROJECT_ID=nbi2026
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@...
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
```

---

### Database — Firestore Collections

#### `users`

| Field | Type | Description |
|---|---|---|
| `email` | string | User's email address (lookup key) |
| `password` | string | bcrypt hash (10 salt rounds) |
| `role` | string | e.g. `"admin"` — included in JWT, reserved for future RBAC |
| `createdAt` | timestamp | Server-side timestamp set on creation |

Document IDs are auto-generated by Firestore. The auto-generated ID becomes the `id` in the JWT.

**To seed the initial admin user:**
```bash
cd backend
node seedUser.js
# Seeds: admin@test.com / admin123 / role: admin
```

---

### Environment Variables

**File:** `backend/.env` (copy from `backend/.env.example`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port for local dev (default `5000`) |
| `JWT_SECRET` | Yes | Secret string for signing JWTs — use a long random value in production |
| `FIREBASE_PROJECT_ID` | Yes* | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes* | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes* | Firebase private key with `\n` escaped |

*Currently loaded from `serviceAccountKey.json` instead — see [Security Notes](#security-notes).

---

## Frontend

### Stack

- **React 18** with Vite
- **React Router v6** for client-side navigation
- **Axios** for HTTP requests
- **Context API** for global auth state

### Key Files

| File | Purpose |
|---|---|
| `frontend/src/main.jsx` | App entry — mounts React |
| `frontend/src/App.jsx` | Root component, router setup |
| `frontend/src/context/AuthContext.jsx` | Global auth state (JWT + user) |
| `frontend/src/routes/ProtectedRoute.jsx` | Route guard component |
| `frontend/src/api/auth.js` | All HTTP calls to the backend |

---

### Authentication Flow (Frontend)

#### Login

```
User fills LoginPage form
       │
       ▼
login(email, password)          ← src/api/auth.js
  POST /api/login
       │
  ┌────▼────────────────────────────────────────┐
  │ Success (200)                               │
  │   loginUser(token, user)  ← AuthContext     │
  │   localStorage.setItem('token', token)      │
  │   localStorage.setItem('user', user)        │
  │   React state updated                       │
  │   → redirect to /dashboard                 │
  └─────────────────────────────────────────────┘
       │
  ┌────▼────────────────────────────────────────┐
  │ Failure (401/400)                           │
  │   Show error message from response body     │
  └─────────────────────────────────────────────┘
```

#### Session Restore (on page refresh/reload)

```
App mounts → AuthProvider useEffect runs
       │
       ▼
Read localStorage('token') and localStorage('user')
       │
  Found? → set state { user, token, loading: false }
  Not found? → set state { loading: false }
```

#### Logout

```
logoutUser() called
  → localStorage.removeItem('token')
  → localStorage.removeItem('user')
  → React state cleared
  → ProtectedRoute redirects to /login
```

---

### Route Protection

**File:** `frontend/src/routes/ProtectedRoute.jsx`

Wrap any page component that requires login:

```jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

**Logic:**
```
ProtectedRoute renders
  ├── loading === true  → show "Loading..." (prevents flash-of-login)
  ├── !isAuthenticated  → <Navigate to="/login" />
  └── isAuthenticated   → render children (the protected page)
```

---

### HTTP Client — Axios Instance

**File:** `frontend/src/api/auth.js`

A single configured Axios instance is shared across all API calls:

```
Every outgoing request:
  1. Request interceptor fires
  2. Reads localStorage.getItem('token')
  3. If token exists → adds header: Authorization: Bearer <token>
  4. Request sent to VITE_API_URL/<path>
```

**Error normalization in `login()`:**
- Server returned a body → return `error.response.data`
- Network failure / no response → return `{ success: false, message: "Network error. Please try again." }`

---

### Environment Variables

**File:** `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL. Local: `http://localhost:5000`. Production: your Vercel backend URL |

---

## Deployment

Both apps deploy to Vercel independently.

### Backend (`backend/vercel.json`)
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/api/index" }] }
```
All traffic is routed to `api/index.js`, which exports the Express app as a Vercel serverless function.

### Frontend (`frontend/vercel.json`)
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
All traffic falls through to `index.html`, allowing React Router to handle client-side routing (deep links work correctly).

### Deploy Steps

```bash
# Backend
cd backend
vercel --prod

# Frontend — update VITE_API_URL to point to deployed backend first
cd frontend
vercel --prod
```

---

## Security Notes

The following issues should be addressed before production use:

1. **`serviceAccountKey.json` must not be in the repo.** This file contains a real RSA private key. Revoke and rotate it in the Firebase console, then switch `firebase.js` to read credentials from environment variables (the `.env.example` already documents the correct variable names).

2. **Replace the weak `JWT_SECRET`.** The current value (`my_super_secret_jwt_key_123456789`) is weak. Generate a strong random secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Restrict CORS.** Replace `app.use(cors())` with an allowlist:
   ```js
   app.use(cors({ origin: 'https://your-frontend.vercel.app' }))
   ```

4. **Role-based access control** — the `role` field is stored and included in JWTs but never checked. Add role checks inside `verifyToken` or as a separate middleware when protecting role-restricted routes.
