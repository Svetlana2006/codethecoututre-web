# 💻 Code the Couture 8.0

**Decode • Design • Disrupt**

A full-stack registration and theme-selection dashboard built for the ultimate technical fashion competition! Designed with a premium, glassmorphic cyber-aesthetic, this application gamifies the registration process by forcing teams to decrypt a puzzle to unlock their design themes.

## 🚀 Key Features

- **Gamified Registration Flow:** Teams enter their details and are randomly assigned an encrypted "Sector" puzzle.
- **Intelligent Theme Locking:** Upon solving the puzzle, teams are presented with limited-slot themes. The system securely enforces a strict 3-participant limit per theme in real-time.
- **Full-Stack Architecture:**
  - **Frontend (Client):** A dynamic React + Vite Single Page Application styled with custom CSS and pure cyber aesthetics.
  - **Backend (Server):** A high-performance Node.js / Express API written in TypeScript.
- **State Management:** The backend securely stores incoming registrations into a localized NoSQL JSON database, ensuring race-condition-free theme assignments.

## 🛠️ Technology Stack

- **Client:** React 18, Vite, Axios
- **Server:** Node.js, Express, TypeScript, Zod, Cors
- **Packaging:** Setup as an NPM Workspace Monorepo

## 🏁 How to Run Locally

This application uses NPM Workspaces to execute the frontend and backend simultaneously on a single build thread.

1. Ensure you have Node 18+ installed on your machine.
2. In the root directory, install all dependencies:

```bash
npm install
```

3. Boot up the entire stack using our concurrent start script:

```bash
npm run dev
```

The React frontend will immediately become available at `http://localhost:5173`, and it will securely proxy requests to your active backend API running on port `3000`.

## 🌐 Deployment Architecture

- **Frontend:** Deployed instantly via automated GitHub Actions directly to GitHub Pages.
- **Backend:** Deployed as an active Node Web Service.
