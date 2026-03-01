from supabase_config import get_supabase_settings
from supabase import create_client

def check_old_schema():
    settings = get_supabase_settings()
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    
    try:
        # Check final_questions table
        query = """
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'final_questions'
        """
        # If rpc fails due to getaddrinfo, we will know for sure if it's persistent
        response = supabase.table('final_questions').select('*').limit(1).execute()
        if response.data:
            print("Old final_questions Sample Row:")
            print(response.data[0])
        else:
            print("final_questions table is empty or doesn't exist.")
    except Exception as e:
        print(f"Error checking old schema: {e}")

if __name__ == "__main__":
    check_old_schema()
