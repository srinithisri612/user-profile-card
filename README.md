# ⚡ ProfileForge — Dynamic User Profile Card Generator

A modern, full-stack form-based web application where user form inputs are processed on a Node.js server, manipulated, rendered as dynamic holographic profile cards, and saved to a persistent SQLite database.

---

## 🎯 Objectives & Features

- **Server-Side Form Processing**: Express.js server handling both `multipart/form-data` (avatar uploads) and `application/x-www-form-urlencoded` form submissions.
- **Comprehensive String Manipulation & Sanitization**:
  - **Name Capitalization**: Title-casing normalization (e.g. `sarah jane connor` ➔ `Sarah Jane Connor`).
  - **Initials Extraction**: Generates 2-letter uppercase monogram initials (e.g. `Sarah Connor` ➔ `SC`).
  - **Slug Generation**: Generates SEO-safe, unique permalink slugs (e.g. `sarah-connor-a49b`).
  - **Bio Processing**: Word count analysis, calculated reading time (e.g. `24 words • ~12s read`), character limits, and automatic hashtag extraction.
  - **Skill Parsing & Deduplication**: Splits comma/newline-delimited text, deduplicates case-insensitively, standardizes tech casing (`nodejs` ➔ `Node.js`, `ts` ➔ `TypeScript`, `docker` ➔ `Docker`), and applies aesthetic color badge classes.
  - **Social Links Normalization**: Extracts `@handles` from URLs, guarantees `https://` protocol, and structures verified links for GitHub, LinkedIn, X (Twitter), Website, and Email.
  - **HTML Sanitization**: Escapes user inputs to prevent XSS vulnerabilities.
- **Dynamic HTML Card & Avatar Preview**:
  - Live server-synchronized preview with debounced AJAX endpoint (`/api/preview`).
  - Dynamic SSR template rendering with EJS.
  - Choice of customizable DiceBear vector avatars, theme-gradient SVG initials monogram avatars, or custom image uploads.
  - 5 Holographic themes: **Dark Glass**, **Cyber Neon**, **Sunset Ember**, **Emerald Luxe**, and **Midnight Aurora**.
  - Interactive 3D perspective tilt effect on mouse hover.
- **Database Persistence**:
  - Built-in SQLite storage (`database.sqlite`) via Node.js's native `DatabaseSync` (`node:sqlite`).
  - Profiles table storing all card records, normalized metadata, and timestamps.
  - Searchable card gallery (`/gallery`) with instant keyword filtering.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v24+)
- **Server Framework**: Express.js
- **Database**: SQLite (`node:sqlite` DatabaseSync)
- **View Engine**: EJS (Embedded JavaScript)
- **File Uploads**: Multer
- **Styling**: Vanilla CSS3 (Custom Glassmorphism Design System, CSS Grid/Flexbox, 3D Perspective Tilt)
- **Typography**: Google Fonts (*Outfit* & *Plus Jakarta Sans*)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The server will start at: **http://localhost:3000**

---

## 🧭 Routes & Endpoints

| Route | Method | Description |
|---|---|---|
| `/` | `GET` | Main dashboard with interactive form and live card preview |
| `/create-card` | `POST` | Processes form inputs, executes string manipulation pipeline, saves record to SQLite, and returns dynamic card |
| `/api/preview` | `POST` | Real-time preview API returning processed dynamic card HTML fragment |
| `/p/:slug` | `GET` | Dedicated dynamic permalink view for a generated profile card |
| `/gallery` | `GET` | Showcase gallery displaying all saved profile cards with search filter |
| `/api/profiles` | `GET` | JSON endpoint returning all profiles stored in SQLite |
| `/api/profiles/:id/delete` | `POST` | Removes a profile card record from SQLite database |

---

## 📁 Project Structure

```
user-profile-card/
├── server.js               # Express application and route handlers
├── database.js             # SQLite DatabaseSync initialization, schema, and queries
├── database.sqlite         # Persistent SQLite database file
├── package.json            # Node.js project metadata and dependencies
├── utils/
│   └── stringProcessor.js  # String manipulation, title casing, initials, bio & skill normalizers
├── public/
│   ├── css/
│   │   ├── style.css       # Core design system, glassmorphism tokens, and layout
│   │   └── card.css        # Dynamic card styles, themes, 3D tilt, and badges
│   ├── js/
│   │   └── app.js          # Live preview sync, 3D tilt interaction, sample loaders, toast
│   └── uploads/            # Storage directory for custom avatar image uploads
└── views/
    ├── index.ejs           # Main interactive generator & preview page
    ├── card-view.ejs       # Dedicated permalink card view with metadata insights
    ├── gallery.ejs         # Searchable gallery of all stored profile cards
    └── partials/
        ├── header.ejs      # Navigation bar and meta tags
        ├── footer.ejs      # Footer and tech badges
        └── card.ejs        # Reusable dynamic profile card component
```
