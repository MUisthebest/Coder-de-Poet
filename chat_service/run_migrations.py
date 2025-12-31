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
<<<<<<< HEAD
        print("Migrations directory not found!")
=======
        print("❌ Migrations directory not found!")
>>>>>>> f78d9c158e7565eb99c8a81d99a7d3eea94c260b
        return
    
    # Get all migration files
    migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.py') and f.startswith('00')])
    
    if not migration_files:
<<<<<<< HEAD
        print(" No migration files found!")
=======
        print("⚠️  No migration files found!")
>>>>>>> f78d9c158e7565eb99c8a81d99a7d3eea94c260b
        return
    
    print(f"Found {len(migration_files)} migration(s)")
    
    for migration_file in migration_files:
        migration_path = os.path.join(migrations_dir, migration_file)
<<<<<<< HEAD
        print(f"\n  Running: {migration_file}")
=======
        print(f"\n▶️  Running: {migration_file}")
>>>>>>> f78d9c158e7565eb99c8a81d99a7d3eea94c260b
        
        # Load and execute migration
        spec = importlib.util.spec_from_file_location(migration_file[:-3], migration_path)
        module = importlib.util.module_from_spec(spec)
        
        try:
            spec.loader.exec_module(module)
<<<<<<< HEAD
            print(f"{migration_file} completed")
        except Exception as e:
            print(f"{migration_file} failed: {e}")
=======
            print(f"✅ {migration_file} completed")
        except Exception as e:
            print(f"❌ {migration_file} failed: {e}")
>>>>>>> f78d9c158e7565eb99c8a81d99a7d3eea94c260b
            return False
    
    return True

if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
