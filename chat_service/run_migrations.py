#!/usr/bin/env python3
"""
Run all migrations in the migrations folder
Usage: python run_migrations.py
"""

import os
import sys
import importlib.util

def run_migrations():
    migrations_dir = os.path.join(os.path.dirname(__file__), 'app', 'migrations')
    
    if not os.path.exists(migrations_dir):
        print("❌ Migrations directory not found!")
        return
    
    # Get all migration files
    migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.py') and f.startswith('00')])
    
    if not migration_files:
        print("⚠️  No migration files found!")
        return
    
    print(f"Found {len(migration_files)} migration(s)")
    
    for migration_file in migration_files:
        migration_path = os.path.join(migrations_dir, migration_file)
        print(f"\n▶️  Running: {migration_file}")
        
        # Load and execute migration
        spec = importlib.util.spec_from_file_location(migration_file[:-3], migration_path)
        module = importlib.util.module_from_spec(spec)
        
        try:
            spec.loader.exec_module(module)
            print(f"✅ {migration_file} completed")
        except Exception as e:
            print(f"❌ {migration_file} failed: {e}")
            return False
    
    return True

if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
