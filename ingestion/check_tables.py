from supabase_config import get_supabase_settings
from supabase import create_client

def check_tables():
    settings = get_supabase_settings()
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    
    try:
        # Query pg_catalog to list tables
        response = supabase.rpc("get_tables", {}).execute()
        print(f"Tables: {response.data}")
    except Exception as e:
        print(f"Error checking tables: {str(e)}")
        # Fallback: try to select from the table directly
        try:
            res = supabase.table("final_questions_v2").select("id").limit(1).execute()
            print("✅ final_questions_v2 exists")
        except Exception as e2:
            print(f"❌ final_questions_v2 does not exist or error: {str(e2)}")

if __name__ == "__main__":
    check_tables()
