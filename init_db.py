"""
Database Connectivity and Initialization Script for Lops Carwash
Tests connection to Supabase and ensures tables / initial admin exist:
    python init_db.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from app import get_supabase_client, auto_seed_database_if_needed

def main():
    print("==================================================")
    print("  Lops Carwash - Supabase Initialization & Test")
    print("==================================================")
    
    supabase = get_supabase_client()
    if not supabase:
        print("ERROR: Could not create Supabase client.")
        print("Please ensure SUPABASE_URL and SUPABASE_KEY (anon key) environment variables are set.")
        print("You can set them in a .env file or your system environment.")
        sys.exit(1)

    print("Checking connection to Supabase...")
    try:
        # Check users table
        res = supabase.table("users").select("id").limit(1).execute()
        print("Connection successful! Supabase tables are online.")
        
        # Trigger auto seed if needed
        seeded = auto_seed_database_if_needed(supabase)
        if seeded:
            print("Auto-seeding completed: Default admin and starter catalog created.")
        else:
            print("Database already contains data.")
            
        print("\nDefault Administrator Credentials:")
        print("  Email:    admin@lopscarwash.ph")
        print("  Password: thelegend54")
        print("==================================================")
        
    except Exception as e:
        print("\nNOTICE: Could not query 'users' table.")
        print("If this is a new Supabase project, please execute the SQL script:")
        print("  database/supabase_setup.sql")
        print("inside your Supabase Dashboard -> SQL Editor.")
        print(f"Error details: {e}\n")

if __name__ == "__main__":
    main()
