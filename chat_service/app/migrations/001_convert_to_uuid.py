"""
Migration script để convert chat_sessions.id từ INTEGER sang UUID
Chạy: python app/migrations/001_convert_to_uuid.py
"""

import psycopg2
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Database connection
db_url = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/chat_service')

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    print("Starting migration: Converting session IDs to UUID...")
    
    # Check if migration already applied
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'chat_sessions' AND column_name = 'id'
    """)
    result = cursor.fetchone()
    
    if result and result[1] == 'uuid':
        print("✅ Migration already applied - ID is already UUID")
        cursor.close()
        conn.close()
        sys.exit(0)
    
    print("1. Dropping foreign key constraints...")
    try:
        cursor.execute("""
            ALTER TABLE chat_messages 
            DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey CASCADE
        """)
        conn.commit()
    except Exception as e:
        print(f"   Warning: {e}")
        conn.rollback()
    
    print("2. Creating UUID extension if not exists...")
    cursor.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    conn.commit()
    
    print("3. Creating new UUID columns...")
    cursor.execute("""
        ALTER TABLE chat_sessions 
        ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT gen_random_uuid()
    """)
    cursor.execute("""
        ALTER TABLE chat_messages 
        ADD COLUMN IF NOT EXISTS session_id_new UUID
    """)
    conn.commit()
    
    print("4. Copying data to new UUID columns...")
    # Copy message references
    cursor.execute("""
        UPDATE chat_messages m
        SET session_id_new = s.id_new
        FROM chat_sessions s
        WHERE m.session_id = s.id
    """)
    conn.commit()
    
    print("5. Dropping old constraints and columns...")
    # Drop old foreign key
    cursor.execute("""
        ALTER TABLE chat_messages 
        DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey CASCADE
    """)
    conn.commit()
    
    # Drop old column
    cursor.execute("ALTER TABLE chat_messages DROP COLUMN IF EXISTS session_id")
    conn.commit()
    
    print("6. Renaming new UUID columns...")
    cursor.execute("ALTER TABLE chat_messages RENAME COLUMN session_id_new TO session_id")
    cursor.execute("ALTER TABLE chat_sessions RENAME COLUMN id_new TO id")
    conn.commit()
    
    print("7. Setting constraints...")
    # Drop old primary key
    cursor.execute("ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_pkey")
    conn.commit()
    
    # Set new primary key
    cursor.execute("ALTER TABLE chat_sessions ADD PRIMARY KEY (id)")
    conn.commit()
    
    # Add foreign key
    cursor.execute("""
        ALTER TABLE chat_messages 
        ADD CONSTRAINT chat_messages_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    """)
    conn.commit()
    
    print("8. Updating indices...")
    cursor.execute("DROP INDEX IF EXISTS ix_chat_sessions_id CASCADE")
    cursor.execute("DROP INDEX IF EXISTS ix_chat_messages_session_id CASCADE")
    cursor.execute("CREATE INDEX ix_chat_sessions_id ON chat_sessions(id)")
    cursor.execute("CREATE INDEX ix_chat_messages_session_id ON chat_messages(session_id)")
    conn.commit()
    
    print("✅ Migration completed successfully!")
    cursor.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"❌ Database error: {e}")
    print(f"   Error code: {e.pgcode}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

