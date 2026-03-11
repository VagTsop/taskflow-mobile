# TaskFlow - Mobile Productivity App

React Native task management app with Kanban board, calendar view, project management, labels, and dashboard with stats. Material Design UI with React Native Paper.

## Live Demo

**Web:** https://taskflow-mobile.vercel.app
**Backend:** Hosted on Railway

### Demo Accounts
- `alex@demo.com` / `password123`
- `sarah@demo.com` / `password123`

## Tech Stack

- **Mobile/Web:** React Native, Expo (SDK 52), TypeScript, React Native Paper
- **Backend:** Node.js, Express, TypeScript, SQLite (better-sqlite3)
- **Auth:** JWT with Bearer tokens
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **State:** Zustand with AsyncStorage persistence

## Features

- Kanban board with 4 columns (To Do, In Progress, Review, Done)
- Calendar view with multi-dot day marking
- Project management with progress tracking
- Label system with color coding
- Dashboard with stats, overdue tasks, upcoming deadlines
- Task priorities (Low, Medium, High, Urgent)
- User profile with avatar color picker
- Dark/Light mode (automatic)
- Cross-platform (iOS, Android, Web)

## Project Structure

```
packages/
├── backend/          # Express API server
│   └── src/
│       ├── db/       # SQLite connection & schema
│       ├── middleware/# Auth middleware
│       ├── routes/   # API routes (auth, tasks, projects, labels, dashboard)
│       └── index.ts  # Server entry point
└── mobile/           # Expo React Native app
    └── src/
        ├── api/      # Platform-aware API client
        ├── components/# TaskCard, KanbanColumn, CreateTaskModal
        ├── navigation/# AppNavigator with tabs
        ├── screens/  # Dashboard, Kanban, Calendar, Projects, Settings
        └── stores/   # Zustand stores (auth, task, project)
```

## Getting Started

```bash
# Install dependencies
npm install
cd packages/backend && npm install
cd packages/mobile && npm install

# Start development (from root)
npm run dev
```

Backend runs on `http://localhost:3004`, Expo dev server on `http://localhost:8081`.

## Deployment

- **Web:** Vercel (Expo web export)
- **Backend:** Railway (Node.js)
