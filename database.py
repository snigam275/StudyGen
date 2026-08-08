import os
import json
import sqlite3
import hashlib
from typing import Optional, Any

try:
    import psycopg2
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    """Resolves DB connection: PostgreSQL if DATABASE_URL is set, otherwise falls back to SQLite."""
    if DATABASE_URL and HAS_POSTGRES:
        try:
            conn = psycopg2.connect(DATABASE_URL)
            return conn, "postgres"
        except Exception as e:
            print(f"PostgreSQL connection failed: {e}. Falling back to SQLite.")
            
    sqlite_path = os.path.join(os.path.dirname(__file__), "study_cache.db")
    conn = sqlite3.connect(sqlite_path)
    return conn, "sqlite"

def init_db():
    """Initializes the cache database schema."""
    conn, db_type = get_connection()
    cursor = conn.cursor()
    if db_type == "postgres":
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS study_cache (
                pdf_hash VARCHAR(64) PRIMARY KEY,
                filename VARCHAR(255),
                summary JSONB,
                flashcards JSONB,
                quiz JSONB,
                mindmap JSONB
            );
        """)
    else:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS study_cache (
                pdf_hash TEXT PRIMARY KEY,
                filename TEXT,
                summary TEXT,
                flashcards TEXT,
                quiz TEXT,
                mindmap TEXT
            );
        """)
    conn.commit()
    conn.close()

def get_cached_item(pdf_hash: str, column: str) -> Optional[Any]:
    """Retrieves a cached JSON item by PDF hash and key name (summary/flashcards/quiz/mindmap)."""
    conn, db_type = get_connection()
    cursor = conn.cursor()
    try:
        if db_type == "postgres":
            cursor.execute(f"SELECT {column} FROM study_cache WHERE pdf_hash = %s", (pdf_hash,))
            row = cursor.fetchone()
            if row and row[0] is not None:
                # In psycopg2, JSONB fields are parsed automatically if json is registered,
                # but to be safe and compatible, we load them if they come as string
                val = row[0]
                if isinstance(val, str):
                    return json.loads(val)
                return val
        else:
            cursor.execute(f"SELECT {column} FROM study_cache WHERE pdf_hash = ?", (pdf_hash,))
            row = cursor.fetchone()
            if row and row[0] is not None:
                return json.loads(row[0])
    except Exception as e:
        print(f"Database cache read error: {e}")
    finally:
        conn.close()
    return None

def set_cached_item(pdf_hash: str, filename: str, column: str, data: Any):
    """Saves a JSON item to the cache database under the specified key."""
    conn, db_type = get_connection()
    cursor = conn.cursor()
    try:
        # Check if record exists
        if db_type == "postgres":
            cursor.execute("SELECT 1 FROM study_cache WHERE pdf_hash = %s", (pdf_hash,))
            exists = cursor.fetchone()
            if not exists:
                cursor.execute(
                    "INSERT INTO study_cache (pdf_hash, filename, summary, flashcards, quiz, mindmap) VALUES (%s, %s, NULL, NULL, NULL, NULL)",
                    (pdf_hash, filename)
                )
            cursor.execute(
                f"UPDATE study_cache SET {column} = %s WHERE pdf_hash = %s",
                (json.dumps(data), pdf_hash)
            )
        else:
            cursor.execute("SELECT 1 FROM study_cache WHERE pdf_hash = ?", (pdf_hash,))
            exists = cursor.fetchone()
            if not exists:
                cursor.execute(
                    "INSERT INTO study_cache (pdf_hash, filename, summary, flashcards, quiz, mindmap) VALUES (?, ?, NULL, NULL, NULL, NULL)",
                    (pdf_hash, filename)
                )
            cursor.execute(
                f"UPDATE study_cache SET {column} = ? WHERE pdf_hash = ?",
                (json.dumps(data), pdf_hash)
            )
        conn.commit()
    except Exception as e:
        print(f"Database cache write error: {e}")
    finally:
        conn.close()
