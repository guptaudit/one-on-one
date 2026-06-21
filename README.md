# 1:1 Ledger

A private local web app for tracking your 1:1 conversations with your
manager, reportees, and other collaborators. The entire app runs on
your machine and stores data locally in `oneonones.db`.

## Features

- Local SQLite database stored in `oneonones.db`
- Track one manager plus multiple reportees and other people
- Log meeting notes and action items per 1:1
- Carry open action items forward into the next meeting
- Edit past meetings and action items
- Mark action items done from any view
- View all open action items in a single drawer
- Generate an HTML email summary and download an Outlook `.eml` draft
- Choose from multiple theme options in settings
- Backup and restore the database from the settings panel
- Clear the local database with confirmation

## Screenshots

![Dashboard](screenshots/dashboard.png)
*Dashboard with people list, active ledger, and open items count.*

![Email Draft](screenshots/email-draft.png)
*Email draft modal with HTML preview and Outlook export.*

![Settings](screenshots/settings.png)
*Settings modal with theme selection, backup, restore, and clear database.*

## Requirements

- Python 3.8 or later
- Flask

## Install

1. Open a terminal in the application folder.
2. Install Flask:

   ```bash
   python -m pip install flask
   ```

## Run the app

1. From the project folder, run:

   ```bash
   python app.py
   ```

2. The app opens automatically at `http://127.0.0.1:5151`.
3. If your browser does not open, navigate to that address manually.
4. Stop the app with `Ctrl+C` in the terminal.

## How to use it

### People list

- Add a manager, reportee, or other contact from the left rail.
- Click a person to open their ledger.
- The manager section only keeps one active manager.

### Log a 1:1

- Click **Log a 1:1** to record a meeting.
- Add notes and action items.
- Use the owner selector to mark whether the item is assigned to you or them.

### Action items

- Open action items appear in the next meeting for that person.
- The bottom-left drawer shows all open action items across everyone.
- Click the checkbox to mark an item done.

### Email draft

- Open the email draft modal to generate a formatted meeting summary.
- Copy the HTML or download an Outlook-compatible `.eml` file.

### Settings

- Click the gear icon in the left sidebar to open Settings.
- Choose from available themes.
- Backup the database to download `oneonones.db`.
- Restore a database file from disk.
- Clear the database if you need a fresh start.

## Backup and restore

- `Backup database` downloads the current `oneonones.db` file.
- `Restore database` lets you upload a previously saved `.db` file.
- Restoring replaces the current database, so keep your backup file safe.

## Troubleshooting

- If the page does not load, make sure the app is still running in the terminal.
- If you see **"Address already in use"**, another instance is already running on port `5151`.
- If the app cannot connect to the database, check that `oneonones.db` is present and not locked.
- If you want to start fresh, stop the app and delete `oneonones.db`, then run `python app.py` again.

## Notes

- This app is designed for private local use only.
- No external tracking or networking is performed except local browser requests.
