import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

print(f"Connected to Supabase at {supabase_url}. Testing run_sql RPC...")
try:
    res = supabase.rpc('run_sql', {'sql_query': "SELECT 1"}).execute()
    print("run_sql result:", res.data)
except Exception as e:
    print("run_sql failed:", e)
