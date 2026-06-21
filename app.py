#!/usr/bin/env python3
"""
1:1 Tracker - local web app.

Run with:
    python3 app.py

Then open http://127.0.0.1:5151 in your browser.

Everything runs on your machine. Data lives in oneonones.db (SQLite),
in the same folder as this script. Nothing is sent over the network.
"""

import sqlite3
import os
import sys
import webbrowser
import threading
from datetime import date, datetime

try:
    from flask import Flask, request, jsonify, send_from_directory, send_file
except ImportError:
    print("\nThis app needs the 'flask' package, which isn't installed yet.")
    print("Install it by running:\n")
    print("    pip install flask\n")
    print("(If that fails, try: pip3 install flask --break-system-packages)\n")
    sys.exit(1)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "oneonones.db")
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = Flask(__name__, static_folder=None)


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()
    # relationship: 'manager' (this is the one person who manages you) or 'reportee'
    cur.execute("""
        CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT,
            relationship TEXT NOT NULL CHECK (relationship IN ('manager', 'reportee', 'other')),
            archived INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS meetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            person_id INTEGER NOT NULL,
            meeting_date TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS action_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meeting_id INTEGER NOT NULL,
            person_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
            owner TEXT NOT NULL DEFAULT 'me' CHECK (owner IN ('me', 'them')),
            created_at TEXT NOT NULL,
            completed_at TEXT,
            FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
            FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
        )
    """)
    conn.commit()

    # Lightweight migration: add 'owner' column if upgrading from an older db
    cols = [r[1] for r in cur.execute("PRAGMA table_info(action_items)").fetchall()]
    if "owner" not in cols:
        cur.execute("ALTER TABLE action_items ADD COLUMN owner TEXT NOT NULL DEFAULT 'me'")
        conn.commit()

    conn.close()


def now_str():
    return datetime.now().isoformat(timespec="seconds")


def row_to_dict(row):
    return {k: row[k] for k in row.keys()}


# ---------------------------------------------------------------------------
# API: people
# ---------------------------------------------------------------------------

@app.route("/api/people", methods=["GET"])
def list_people():
    conn = get_connection()
    people = conn.execute(
        "SELECT * FROM people WHERE archived = 0 ORDER BY relationship DESC, sort_order, name"
    ).fetchall()
    result = []
    for p in people:
        meeting_count = conn.execute(
            "SELECT COUNT(*) FROM meetings WHERE person_id = ?", (p["id"],)
        ).fetchone()[0]
        open_count = conn.execute(
            "SELECT COUNT(*) FROM action_items WHERE person_id = ? AND status = 'open'",
            (p["id"],),
        ).fetchone()[0]
        last_meeting = conn.execute(
            "SELECT meeting_date FROM meetings WHERE person_id = ? ORDER BY meeting_date DESC LIMIT 1",
            (p["id"],),
        ).fetchone()
        d = row_to_dict(p)
        d["meeting_count"] = meeting_count
        d["open_action_count"] = open_count
        d["last_meeting_date"] = last_meeting["meeting_date"] if last_meeting else None
        result.append(d)
    conn.close()
    return jsonify(result)


@app.route("/api/people", methods=["POST"])
def add_person():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    role = (data.get("role") or "").strip()
    relationship = data.get("relationship")
    if not name:
        return jsonify({"error": "Name is required."}), 400
    if relationship not in ("manager", "reportee", "other"):
        return jsonify({"error": "Relationship must be 'manager', 'reportee', or 'other'."}), 400

    conn = get_connection()
    if relationship == "manager":
        existing = conn.execute(
            "SELECT id FROM people WHERE relationship = 'manager' AND archived = 0"
        ).fetchone()
        if existing:
            conn.close()
            return jsonify({"error": "You already have a manager set. Edit or remove them first."}), 400

    max_order = conn.execute(
        "SELECT COALESCE(MAX(sort_order), 0) FROM people WHERE relationship = ?", (relationship,)
    ).fetchone()[0]

    cur = conn.cursor()
    cur.execute(
        "INSERT INTO people (name, role, relationship, sort_order, created_at) VALUES (?, ?, ?, ?, ?)",
        (name, role, relationship, max_order + 1, now_str()),
    )
    conn.commit()
    person_id = cur.lastrowid
    person = conn.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(person)), 201


@app.route("/api/people/<int:person_id>", methods=["PATCH"])
def update_person(person_id):
    data = request.get_json(force=True)
    conn = get_connection()
    person = conn.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
    if not person:
        conn.close()
        return jsonify({"error": "Person not found."}), 404

    name = data.get("name", person["name"]).strip()
    role = data.get("role", person["role"] or "").strip()
    conn.execute("UPDATE people SET name = ?, role = ? WHERE id = ?", (name, role, person_id))
    conn.commit()
    updated = conn.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(updated))


@app.route("/api/people/<int:person_id>", methods=["DELETE"])
def archive_person(person_id):
    conn = get_connection()
    conn.execute("UPDATE people SET archived = 1 WHERE id = ?", (person_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# API: meetings + action items
# ---------------------------------------------------------------------------

@app.route("/api/people/<int:person_id>/meetings", methods=["GET"])
def list_meetings(person_id):
    conn = get_connection()
    meetings = conn.execute(
        "SELECT * FROM meetings WHERE person_id = ? ORDER BY meeting_date DESC, id DESC",
        (person_id,),
    ).fetchall()
    result = []
    for m in meetings:
        items = conn.execute(
            "SELECT * FROM action_items WHERE meeting_id = ? ORDER BY created_at", (m["id"],)
        ).fetchall()
        d = row_to_dict(m)
        d["action_items"] = [row_to_dict(i) for i in items]
        result.append(d)
    conn.close()
    return jsonify(result)


@app.route("/api/people/<int:person_id>/open-items", methods=["GET"])
def open_items_for_person(person_id):
    conn = get_connection()
    items = conn.execute(
        "SELECT * FROM action_items WHERE person_id = ? AND status = 'open' ORDER BY created_at",
        (person_id,),
    ).fetchall()
    conn.close()
    return jsonify([row_to_dict(i) for i in items])


@app.route("/api/meetings", methods=["POST"])
def add_meeting():
    data = request.get_json(force=True)
    person_id = data.get("person_id")
    meeting_date = (data.get("meeting_date") or date.today().isoformat()).strip()
    notes = data.get("notes", "")
    action_items = data.get("action_items", [])  # list of {description, owner}

    if not person_id:
        return jsonify({"error": "person_id is required."}), 400

    conn = get_connection()
    person = conn.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
    if not person:
        conn.close()
        return jsonify({"error": "Person not found."}), 404

    cur = conn.cursor()
    cur.execute(
        "INSERT INTO meetings (person_id, meeting_date, notes, created_at) VALUES (?, ?, ?, ?)",
        (person_id, meeting_date, notes, now_str()),
    )
    meeting_id = cur.lastrowid

    for item in action_items:
        desc = (item.get("description") or "").strip()
        if not desc:
            continue
        owner = item.get("owner") if item.get("owner") in ("me", "them") else "me"
        cur.execute(
            """INSERT INTO action_items (meeting_id, person_id, description, status, owner, created_at)
               VALUES (?, ?, ?, 'open', ?, ?)""",
            (meeting_id, person_id, desc, owner, now_str()),
        )

    conn.commit()
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    items = conn.execute(
        "SELECT * FROM action_items WHERE meeting_id = ? ORDER BY created_at", (meeting_id,)
    ).fetchall()
    conn.close()

    result = row_to_dict(meeting)
    result["action_items"] = [row_to_dict(i) for i in items]
    return jsonify(result), 201


@app.route("/api/meetings/<int:meeting_id>", methods=["PATCH"])
def update_meeting(meeting_id):
    data = request.get_json(force=True)
    conn = get_connection()
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    if not meeting:
        conn.close()
        return jsonify({"error": "Meeting not found."}), 404

    meeting_date = data.get("meeting_date", meeting["meeting_date"])
    notes = data.get("notes", meeting["notes"])
    conn.execute(
        "UPDATE meetings SET meeting_date = ?, notes = ?, updated_at = ? WHERE id = ?",
        (meeting_date, notes, now_str(), meeting_id),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(updated))


@app.route("/api/meetings/<int:meeting_id>", methods=["DELETE"])
def delete_meeting(meeting_id):
    conn = get_connection()
    conn.execute("DELETE FROM meetings WHERE id = ?", (meeting_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/meetings/<int:meeting_id>/action-items", methods=["POST"])
def add_action_item(meeting_id):
    data = request.get_json(force=True)
    desc = (data.get("description") or "").strip()
    owner = data.get("owner") if data.get("owner") in ("me", "them") else "me"
    if not desc:
        return jsonify({"error": "Description is required."}), 400

    conn = get_connection()
    meeting = conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,)).fetchone()
    if not meeting:
        conn.close()
        return jsonify({"error": "Meeting not found."}), 404

    cur = conn.cursor()
    cur.execute(
        """INSERT INTO action_items (meeting_id, person_id, description, status, owner, created_at)
           VALUES (?, ?, ?, 'open', ?, ?)""",
        (meeting_id, meeting["person_id"], desc, owner, now_str()),
    )
    conn.commit()
    item = conn.execute("SELECT * FROM action_items WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(item)), 201


@app.route("/api/action-items/<int:item_id>", methods=["PATCH"])
def update_action_item(item_id):
    data = request.get_json(force=True)
    conn = get_connection()
    item = conn.execute("SELECT * FROM action_items WHERE id = ?", (item_id,)).fetchone()
    if not item:
        conn.close()
        return jsonify({"error": "Action item not found."}), 404

    status = data.get("status", item["status"])
    description = data.get("description", item["description"])
    completed_at = now_str() if status == "done" else None

    conn.execute(
        "UPDATE action_items SET status = ?, description = ?, completed_at = ? WHERE id = ?",
        (status, description, completed_at, item_id),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM action_items WHERE id = ?", (item_id,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(updated))


@app.route("/api/action-items/<int:item_id>", methods=["DELETE"])
def delete_action_item(item_id):
    conn = get_connection()
    conn.execute("DELETE FROM action_items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/open-items", methods=["GET"])
def all_open_items():
    conn = get_connection()
    rows = conn.execute(
        """SELECT action_items.*, people.name AS person_name, people.relationship AS person_relationship
           FROM action_items
           JOIN people ON people.id = action_items.person_id
           WHERE action_items.status = 'open' AND people.archived = 0
           ORDER BY action_items.created_at"""
    ).fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@app.route("/api/clear-db", methods=["POST"])
def clear_database():
    conn = get_connection()
    conn.execute("DELETE FROM action_items")
    conn.execute("DELETE FROM meetings")
    conn.execute("DELETE FROM people")
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/backup-db", methods=["GET"])
def backup_database():
    if not os.path.exists(DB_PATH):
        return jsonify({"error": "Database not found."}), 404
    return send_file(DB_PATH, as_attachment=True, download_name="oneonones.db")


@app.route("/api/restore-db", methods=["POST"])
def restore_database():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400
    file.save(DB_PATH)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Static frontend
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def open_browser():
    webbrowser.open("http://127.0.0.1:5151")


if __name__ == "__main__":
    init_db()
    threading.Timer(1.0, open_browser).start()
    print("\n1:1 Tracker is running.")
    print("Open this in your browser if it doesn't open automatically:")
    print("  http://127.0.0.1:5151\n")
    print("Press Ctrl+C to stop.\n")
    try:
        app.run(host="127.0.0.1", port=5151, debug=False)
    except OSError as e:
        if "Address already in use" in str(e) or getattr(e, "errno", None) == 98:
            print("\nPort 5151 is already in use — the app might already be running.")
            print("Check if it's open at http://127.0.0.1:5151 in your browser.")
        else:
            raise
