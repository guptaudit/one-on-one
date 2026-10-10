# 1:1 Ledger

1:1 Ledger is a private local app for tracking manager and direct-report conversations, follow-ups, and personal daily planning. It is designed for people who want a lightweight relationship tracker without sending data to a remote service.

This project is built with React, TypeScript, and Vite, and stores application data locally in the browser using `localStorage`.

## Why this app

- Keep one place for recurring 1:1 notes and action items
- Track relationship context for managers, reportees, and other collaborators
- Preserve a running backlog of open follow-ups
- Review daily priorities separately from one-on-one history
- Export backups and keep a local copy of your data

## Key features

- Manage people with different relationship categories: manager, reportee, or other
- Log meeting notes with dates, tags, and follow-up actions
- Create and track action items assigned to you or someone else
- Open and complete work items from the shared backlog view
- Keep a scratchpad for each person for pre-meeting talking points
- Track a daily to-do list with date, status, priority, and category filters
- Review personal tasks separately from 1:1 meeting history
- Generate an email-style summary for a person and export a draft
- Switch between multiple theme presets
- Export and restore data backups from the app UI
- Run entirely on your machine without a backend dependency

## Tech stack

- React 19
- TypeScript
- Vite
- Motion for lightweight UI animations
- Lucide icons
- Browser localStorage for persistence
- Optional Python static server for production builds

## Project structure

```text
.
├── app.bat                # Windows runner for setup/build/start
├── index.html             # Vite entry point
├── package.json           # Project scripts and dependencies
├── server.py              # Simple Python server for serving dist/
├── src/
│   ├── App.tsx            # Main app shell and state management
│   ├── types.ts           # Shared TypeScript types
│   ├── components/        # UI screens and modals
│   └── utils/             # Storage and export helpers
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Prerequisites

Before running the app, make sure you have:

- Node.js 18+ recommended
- npm
- Optional: Python 3 for the simple offline production server

## Getting started

### Run the app

On Windows, simply launch:

```bat
app.bat
```

This script handles the setup flow for you:

- installs dependencies
- builds the app
- starts the local server

After that, open the local app in your browser at:

```text
http://localhost:3000
```

### Manual option

If you prefer to run it yourself:

```bash
npm install
npm run build
python server.py
```

## How to use it

### People and meetings

1. Add a person from the sidebar.
2. Choose the relationship type: manager, reportee, or other.
3. Open a person and record a 1:1 meeting.
4. Add meeting notes, tags, and action items.

### Action items and follow-ups

- Mark owners as "me" or "them"
- Keep open tasks visible in an aggregated backlog
- Close completed items from the UI when work is done
- Carry forward action items from previous conversations

### Daily plan

Use the daily to-do panel to manage personal tasks separately from meeting notes. This feature helps you keep a focused personal task list alongside your 1:1 tracking.

You can filter by:

- date
- overdue items
- status
- priority
- category

You can also mark tasks complete, review priorities, and keep a running daily workflow without mixing it into your meeting notes.

### Email summary

Open the email modal to generate a formatted summary for a person and export it as a draft.

### Data backup

Use the settings area to:

- export a local backup JSON file
- import a saved backup
- clear the current data if needed

## Data and privacy

This application is intentionally local-first:

- data is saved in the browser's local storage
- there is no central database or remote API required for the core product
- backups are exported as JSON files so you can keep copies on your own machine

## Useful scripts

```bash
npm run dev      # local development server
npm run build    # production build
npm run preview  # preview production bundle
npm run lint     # TypeScript type check
```

## Troubleshooting

- If the app does not load, ensure dependencies were installed with `npm install`.
- If a port is already in use, stop the other process or update the port in the Vite config.
- If data seems missing, check whether the browser local storage for the app was cleared.
- If you want a fresh start, use the clear-data action from the app UI or remove the stored local state in the browser.

## License

This project is for personal productivity use and is not currently governed by a formal public license file in the repository. If you plan to distribute or reuse it, confirm the ownership and licensing requirements with the project maintainer before publishing or commercializing it.
