import sqlite3
import os

DB_PATH = "oneonones.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 1. Update 'people' table (ensure 'other' is supported)
    # We'll check if the 'people' table has the constraint by checking the SQL
    cur.execute("SELECT sql FROM sqlite_master WHERE name='people'")
    people_sql = cur.fetchone()[0]
    
    if "'other'" not in people_sql:
        print("Updating 'people' table to support 'other' relationship...")
        try:
            cur.execute("BEGIN TRANSACTION")
            cur.execute("ALTER TABLE people RENAME TO people_old")
            cur.execute("""
                CREATE TABLE people (
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
                INSERT INTO people (id, name, role, relationship, archived, sort_order, created_at)
                SELECT id, name, role, relationship, archived, sort_order, created_at
                FROM people_old
            """)
            cur.execute("DROP TABLE people_old")
            conn.commit()
            print("'people' table updated.")
        except Exception as e:
            conn.rollback()
            print(f"Failed to update 'people' table: {e}")
    else:
        print("'people' table already supports 'other'.")

    # 2. Fix 'action_items' table (ensure 'owner' is NOT NULL and has a valid CHECK constraint)
    # Some older versions might have missing 'owner' or incorrect constraints
    cur.execute("SELECT sql FROM sqlite_master WHERE name='action_items'")
    action_items_sql = cur.fetchone()[0]
    print(f"Current action_items SQL: {action_items_sql}")

    # We want to ensure it has: owner TEXT NOT NULL DEFAULT 'me' CHECK (owner IN ('me', 'them'))
    # If the SQL doesn't look right, we'll recreate it.
    if "CHECK (owner IN ('me', 'them'))" not in action_items_sql:
        print("Updating 'action_items' table to fix 'owner' constraints...")
        try:
            cur.execute("BEGIN TRANSACTION")
            cur.execute("ALTER TABLE action_items RENAME TO action_items_old")
            cur.execute("""
                CREATE TABLE action_items (
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
            
            # Copy data from old table. We need to handle cases where 'owner' might be missing.
            # Check columns in old table
            cur.execute("PRAGMA table_info(action_items_old)")
            cols = [row[1] for row in cur.fetchall()]
            
            if "owner" in cols:
                cur.execute("""
                    INSERT INTO action_items (id, meeting_id, person_id, description, status, owner, created_at, completed_at)
                    SELECT id, meeting_id, person_id, description, status, owner, created_at, completed_at
                    FROM action_items_old
                """)
            else:
                cur.execute("""
                    INSERT INTO action_items (id, meeting_id, person_id, description, status, owner, created_at, completed_at)
                    SELECT id, meeting_id, person_id, description, status, 'me', created_at, completed_at
                    FROM action_items_old
                """)
                
            cur.execute("DROP TABLE action_items_old")
            conn.commit()
            print("'action_items' table updated.")
        except Exception as e:
            conn.rollback()
            print(f"Failed to update 'action_items' table: {e}")
    else:
        print("'action_items' table already correct.")

    conn.close()

if __name__ == "__main__":
    migrate()
