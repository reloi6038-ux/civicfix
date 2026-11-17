# 🏛️ CivicFix — Community Issue Reporter

A production-grade **GovTech / Civic** platform for reporting, tracking, and resolving community issues — from potholes and drainage to power faults and street lights.

Built with **Node.js, Express, MongoDB/Mongoose, HTML5, CSS3, and Vanilla JavaScript** — no frontend framework, one deployable service.

🔗 **Live demo:** https://civicfix.onrender.com _(free tier — may take 30s to wake)_

---

## 📖 Table of Contents

- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running Locally](#-running-locally)
- [Seeding Demo Data](#-seeding-demo-data)
- [API Reference](#-api-reference)
- [Authentication](#-authentication)
- [Deployment (Render + MongoDB Atlas)](#-deployment-render--mongodb-atlas)
- [Security](#-security)
- [Screenshots](#-screenshots)
- [Known Limitations](#-known-limitations)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

## 🎯 Problem Statement

Residents struggle to report community issues through fragmented, opaque channels — a WhatsApp group here, a phone call there. Municipal teams lack a centralized, prioritized view of what actually needs fixing, and residents have no visibility into progress.

**CivicFix** bridges this gap with a transparent, trackable, community-driven platform:

1. **Residents** report issues with photos and location.
2. **Moderators** verify, prioritize, and update status.
3. **Admins** manage users, categories, analytics, and audit trails.
4. **Everyone** can follow issues, comment, and see the full status timeline.

---

## ✨ Features

### Resident Portal

- Register, log in, reset password
- Report issues with title, description, category, location, photo (JPG/PNG/WEBP), GPS coordinates
- Browse, search, and filter the public issue feed
- Follow issues and receive in-app notifications on updates
- Comment on issues; edit/delete own comments
- Track personal reports and followed issues
- View notification inbox with unread count

### Moderator Tools

- Review pending reports
- Verify, reject, or mark as duplicate
- Assign priority (Low / Medium / High / Critical)
- Post official responses that appear inline with community comments
- Update issue status through the workflow

### Administrator Tools

- Full admin dashboard with real-time KPIs
- User management: change roles, activate/deactivate
- Category management: create, edit, deactivate
- Issue management: delete, assign to moderator
- Analytics: by category, by status, by city, over time
- Audit logs: every privileged action is recorded

### Cross-Cutting

- JWT authentication (7-day tokens)
- Role-based access (resident / moderator / admin)
- Status workflow: `REPORTED → UNDER REVIEW → VERIFIED → IN PROGRESS → RESOLVED` (+ `REJECTED`, `DUPLICATE`)
- Full status history — no silent overwrites
- Password reset via email (Nodemailer, single-use hashed tokens)
- Rate limiting, CORS, Helmet, bcrypt, MongoDB-sanitized inputs
- Fully responsive, accessible UI (mobile → desktop)

---

## 🛠 Tech Stack

| Layer            | Technology                                           |
| ---------------- | ---------------------------------------------------- |
| **Runtime**      | Node.js 20+                                          |
| **Framework**    | Express.js 4                                         |
| **Database**     | MongoDB Atlas + Mongoose 8                           |
| **Auth**         | JWT (jsonwebtoken), bcryptjs                         |
| **File uploads** | Multer (local disk; Cloudinary recommended for prod) |
| **Email**        | Nodemailer (SMTP)                                    |
| **Security**     | Helmet, CORS, express-rate-limit, express-validator  |
| **Frontend**     | HTML5, CSS3, Vanilla JS (no build step)              |
| **Charts**       | Chart.js (CDN)                                       |
| **Deployment**   | Render (single Node service)                         |

---

## 🏗 Architecture

Browser (HTML/CSS/JS)
↓
Express.js ──── serves /api/_ AND /public/_
↓
Routes
↓
Middleware (auth, validate, upload, error)
↓
Controllers
↓
Services (business logic)
↓
Mongoose Models
↓
MongoDB Atlas

The Express server serves **both** the API and the static frontend — one process, one deployment, one URL.

---

## 📁 Folder Structure

civicfix/
├── server.js # Express app entry
├── package.json
├── .env # (gitignored — never commit)
├── .env.example # Template for env vars
│
├── config/ # DB connection
├── controllers/ # Route handlers
├── middleware/ # auth, validate, upload, error, 404
├── models/ # Mongoose schemas
├── routes/ # Express routers
├── services/ # Business logic
├── validators/ # express-validator chains
├── utils/ # AppError, sendEmail
├── seeders/ # Category + demo data seeders
│
└── public/ # Served by Express
├── index.html # Homepage
├── css/ # style.css, admin.css
├── js/ # api.js, utils.js, layout.js, page scripts
├── pages/ # Resident-facing pages
├── admin/ # Admin pages
├── admin-js/ # Admin page scripts
└── uploads/ # Uploaded photos (ephemeral on free Render)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm 9+
- A MongoDB Atlas account (free tier is fine)
- Git

### Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/civicfix.git
cd civicfix
```
