# Online Examination & Proctoring Platform

A full-stack platform for conducting secure, timed online exams with webcam-based
proctoring, automated evaluation, and result analytics.

**Stack:** React.js (frontend) · Node.js/Express (backend) · PostgreSQL (database) · WebRTC (webcam proctoring)

---

## ✨ Features

- **Auth & Roles** — JWT-based login for Admin, Instructor, and Student roles
- **Question Bank** — Create/manage MCQ & short-answer questions, tagged by subject/difficulty
- **Timed Exams** — Configurable duration, auto-submit on timeout, randomized question order
- **Webcam Proctoring** — WebRTC captures the student's webcam during the exam; periodic
  snapshots are sent to the server and flagged if no face / multiple faces are detected,
  or if the tab loses focus (tab-switch detection)
- **Automated Evaluation** — MCQs are auto-graded on submission
- **Result Analytics** — Score breakdowns, per-question stats, proctoring flag review for instructors

---

## 📁 Project Structure

```
exam-platform/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── controllers/     # Route logic
│   │   ├── middleware/      # Auth, role guards
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # Express routers
│   │   └── server.js
│   ├── database.sql         # Raw SQL schema (alternative to migrations)
│   ├── .env.example
│   └── package.json
└── frontend/                 # React (Vite) app
    ├── src/
    │   ├── api/              # Axios client
    │   ├── components/       # ProctoringMonitor (WebRTC), Timer, etc.
    │   ├── context/          # Auth context
    │   ├── pages/            # Login, ExamList, ExamRoom, Results, Admin
    │   └── App.jsx
    └── package.json
```

---

## 🚀 Getting Started

### 1. Database

```bash
createdb exam_platform
psql exam_platform < backend/database.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in DB credentials & JWT secret
npm install
npm run dev             # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev              # starts on http://localhost:5173
```

The frontend expects the API at `http://localhost:5000/api` (configurable via `VITE_API_URL` in `frontend/.env`).

---

## 🔐 Default Roles

| Role | Capabilities |
|---|---|
| **admin** | Manage users, view all analytics |
| **instructor** | Create exams & questions, view results/proctoring flags for their exams |
| **student** | Take exams, view own results |

---

## 🛡️ Proctoring Notes

This implementation captures webcam frames client-side via `getUserMedia` and posts
periodic snapshots + tab-visibility events to `/api/proctoring/event`. For production use,
consider adding: a real face-detection model (e.g. `face-api.js` or a server-side CV
service), audio-level monitoring, and screen-recording consent flows compliant with your
jurisdiction's privacy laws.

---

## 📦 Deploying to GitHub

```bash
cd exam-platform
git init
git add .
git commit -m "Initial commit: online exam & proctoring platform"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

A `.gitignore` is included so `node_modules`, `.env`, and build artifacts aren't committed.

## 📄 License

MIT
