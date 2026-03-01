import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Missing Supabase credentials")
    exit(1)

supabase = create_client(url, key)

def get_counts():
    try:
        concepts = supabase.table("concepts").select("*", count="exact", head=True).execute()
        questions = supabase.table("exam_questions").select("*", count="exact", head=True).execute()
        
        print(f"\n📊 DATABASE COUNTS:")
        print(f"   - Concepts: {concepts.count}")
        print(f"   - Questions: {questions.count}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    get_counts()
