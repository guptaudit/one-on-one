# 1:1 Ledger

A private, local web app for tracking your 1:1 conversations — both
with your manager and with each of your direct reports. Runs entirely
on your own computer. Nothing is sent over the internet.

## Setup (one time)

You need Python 3 and the Flask package.

1. Check you have Python 3: open a terminal and run `python3 --version`.
   If it's not installed, get it from python.org.
2. Install Flask:

   ```
   pip install flask
   ```

   If that fails with a permissions error, try:

   ```
   pip install flask --break-system-packages
   ```

## Running it

1. Put the `app.py` file and the `static` folder in the same folder
   (don't separate them — `app.py` needs to find `static` next to it).
2. Open a terminal in that folder and run:

   ```
   python3 app.py
   ```

3. Your browser should open automatically to `http://127.0.0.1:5151`.
   If it doesn't, open that address yourself.
4. To stop the app, go back to the terminal and press `Ctrl+C`.

Your data lives in a file called `oneonones.db`, created next to
`app.py` the first time you run it. Back this file up however you'd
back up any file (copy it to a drive, a personal cloud folder, etc.)
if you want a safety copy. Nothing else needs backing up.

## How it works

**Left side:** your manager (one slot) and your reportees (as many as
you like). Click a name to open their ledger.

**Main area:** a running, dated log of every 1:1 with whoever's
selected — most recent first. Each entry holds your notes plus any
action items from that conversation.

- **Log a 1:1** — opens a form for today's (or any) date, free-text
  notes, and action items. Mark whether each action item is on you
  or on them.
- Any action item left **open** automatically shows up at the top of
  your next 1:1 with that person, and in the **open action items**
  count in the bottom-left, so nothing quietly drops.
- Click the checkbox next to any action item, anywhere, to mark it
  done.
- **Edit** on any past entry lets you fix notes or action items after
  the fact.
- The bottom-left button shows every open action item across your
  manager and all reportees in one list.

## If something looks off

- **Page won't load** — make sure the terminal still shows the app
  running (no error message), and that you're going to
  `http://127.0.0.1:5151` exactly.
- **"Address already in use"** — the app is probably already running
  in another terminal window or tab. Just open `127.0.0.1:5151` in
  your browser.
- **Want a clean slate** — close the app, delete `oneonones.db`, and
  start it again. A fresh empty database will be created.
