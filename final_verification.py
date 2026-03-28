
import os
import json
from ingestion.supabase_config import get_supabase_settings
from supabase import create_client

def run_verification():
    settings = get_supabase_settings()
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    results = {}

    # 1. Partition Verification
    print("Checking Partitions...")
    partition_query = "SELECT inhrelid::regclass::text AS partition FROM pg_inherits WHERE inhparent = 'question_attempts'::regclass;"
    try:
        res = supabase.rpc("run_sql", {"sql_query": partition_query}).execute()
        results["partitions"] = [r['partition'] for r in res.data]
    except Exception as e:
        results["partitions_error"] = str(e)

    # 2. Performance Verification (EXPLAIN ANALYZE)
    print("Checking Query Performance...")
    explain_query = "EXPLAIN ANALYZE SELECT * FROM get_random_questions_v4(10);"
    try:
        res = supabase.rpc("run_sql", {"sql_query": explain_query}).execute()
        results["explain_analyze"] = [r['QUERY PLAN'] for r in res.data]
    except Exception as e:
        results["explain_error"] = str(e)

    # 3. Versioning Test
    print("Running Versioning Test...")
    test_uid = "audit-test-uid-001"
    try:
        # Cleanup first
        supabase.rpc("run_sql", {"sql_query": f"DELETE FROM final_questions_v2 WHERE question_uid = '{test_uid}';"}).execute()
        
        # Insert v1
        supabase.table("final_questions_v2").insert({
            "question_uid": test_uid, "version": 1, "is_active": False, "question_text": "v1 text"
        }).execute()
        
        # Insert v2
        supabase.table("final_questions_v2").insert({
            "question_uid": test_uid, "version": 2, "is_active": True, "question_text": "v2 text"
        }).execute()
        
        # Verify
        res = supabase.table("final_questions_v2").select("version, is_active").eq("question_uid", test_uid).order("version").execute()
        results["versioning_test"] = res.data
    except Exception as e:
        results["versioning_error"] = str(e)

    # 4. RLS Policy List
    print("Checking RLS Policies...")
    rls_query = "SELECT tablename, policyname, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public';"
    try:
        res = supabase.rpc("run_sql", {"sql_query": rls_query}).execute()
        results["rls_policies"] = res.data
    except Exception as e:
        results["rls_error"] = str(e)

    # 5. Concept Mastery Check
    print("Checking Concept Mastery Schema...")
    schema_query = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_concept_stats';"
    try:
        res = supabase.rpc("run_sql", {"sql_query": schema_query}).execute()
        results["concept_mastery_schema"] = res.data
    except Exception as e:
        results["concept_mastery_error"] = str(e)

    with open("final_verification_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Verification Complete. Results saved to final_verification_results.json")

if __name__ == "__main__":
    run_verification()
