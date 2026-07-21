# Kadamba's Designer Studio

**Kadamba's Designer Studio** in **Kurnool** is a well-known local boutique and tailoring business specializing in **women's traditional and bridal wear**.

Website: React (Vite) frontend + Express/MongoDB backend.

## Phase Status

**Phase 1 — Project Foundation:** Complete  
**Phase 2 — Design System:** Complete  
**Phase 3 — Home Page:** Complete (brand content aligned)  
**Next:** Phase 4 — About Page

## Brand rules
- Canonical summary lives in `frontend/src/pages/home/data.ts` (`brand`)
- Docs: `documents/references.md` → Brand Identity
- Cursor: `.cursor/rules/brand-content.mdc`

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Axios |
| Backend | Node.js, Express, TypeScript, MongoDB/Mongoose |
| Auth | JWT + bcrypt |
| Media | Cloudinary + Multer |
| Email | Nodemailer |

## Project Structure

```
kadamba/
├── frontend/          # React Vite app
├── backend/           # Express API
├── documents/         # Phase docs
└── active_chunk.md    # Detailed specs
```

## Setup

### 1. Prerequisites
- Node.js 20+
- MongoDB running locally (or a MongoDB Atlas URI)

### 2. Backend

```bash
cd backend
cp .env.example .env   # then fill secrets
npm install
npm run dev
```

API: `http://localhost:5000`  
Health: `http://localhost:5000/api/health`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

## API Base Routes (Phase 1)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health + DB status |
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Bearer | Current user |
| POST | `/api/upload` | Admin | Image upload (Cloudinary) |

## Scripts

**Frontend:** `dev` · `build` · `preview` · `lint` · `format`  
**Backend:** `dev` · `build` · `start` · `lint` · `format`

## Cursor Rules

1. Plan architecture before implementation  
2. Generate reusable code only  
3. Avoid duplication  
4. Keep components modular  
5. Use TypeScript  
6. Finish current phase before starting next  
7. No placeholder code unless marked TODO  
