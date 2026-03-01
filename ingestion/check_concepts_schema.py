from supabase_config import get_supabase_settings
from supabase import create_client

def check_concepts_schema():
    settings = get_supabase_settings()
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    
    try:
        # Check concepts table column types
        query = """
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'concepts'
        """
        response = supabase.rpc('run_sql', {'sql_query': query}).execute()
        if response.data:
            print("Concepts Table Schema:")
            for col in response.data:
                print(f"- {col['column_name']}: {col['data_type']}")
        else:
            # Fallback: try to select a row
            res = supabase.table('concepts').select('*').limit(1).execute()
            if res.data:
                print("Concepts Sample Row:")
                print(res.data[0])
            else:
                print("Concepts table exists but is empty.")
    except Exception as e:
        print(f"Error checking concepts schema: {e}")

if __name__ == "__main__":
    check_concepts_schema()
