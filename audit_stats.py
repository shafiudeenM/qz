
from ingestion.supabase_config import get_supabase_settings
from supabase import create_client
import json

def get_audit_stats():
    settings = get_supabase_settings()
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    
    stats = {}
    
    tables = [
        "subjects", "topics", "concepts", "final_questions_v2", 
        "question_options", "quiz_sessions", "question_attempts", 
        "topic_mastery", "profiles"
    ]
    
    print("--- Table Counts ---")
    for table in tables:
        try:
            res = supabase.table(table).select("*", count="exact").limit(1).execute()
            stats[table] = res.count
            print(f"{table}: {res.count}")
        except Exception as e:
            print(f"{table}: Error - {str(e)}")
            stats[table] = 0

    print("\n--- Hierarchy Analysis ---")
    # Questions per topic
    try:
        res = supabase.rpc("get_topic_weightage", {"target_exam": "ANY"}).execute()
        topic_data = res.data or []
        stats["topics_with_questions"] = len(topic_data)
        avg_q_per_topic = sum([t['question_count'] for t in topic_data]) / len(topic_data) if topic_data else 0
        print(f"Avg Questions per Topic: {avg_q_per_topic:.2f}")
    except Exception as e:
        print(f"Hierarchy Error: {str(e)}")

    # Concepts without questions
    try:
        res = supabase.table("concepts").select("id").execute()
        all_concepts = [c['id'] for c in res.data]
        res_q = supabase.table("final_questions_v2").select("concept_id_fk").execute()
        concepts_with_q = set([q['concept_id_fk'] for q in res_q.data if q['concept_id_fk']])
        stats["empty_concepts"] = len(set(all_concepts) - concepts_with_q)
        print(f"Concepts without questions: {stats['empty_concepts']}")
    except Exception as e:
        print(f"Concept Error: {str(e)}")

    print("\n--- Duplicate Analysis ---")
    try:
        res = supabase.table("final_questions_v2").select("question_hash").execute()
        hashes = [q['question_hash'] for q in res.data if q['question_hash']]
        stats["total_questions"] = len(hashes)
        stats["unique_hashes"] = len(set(hashes))
        stats["duplicate_rate"] = (1 - (stats["unique_hashes"] / stats["total_questions"])) * 100 if stats["total_questions"] > 0 else 0
        print(f"Duplicate Rate: {stats['duplicate_rate']:.2f}%")
    except Exception as e:
        print(f"Duplicate Error: {str(e)}")

    with open("audit_stats_result.json", "w") as f:
        json.dump(stats, f)

if __name__ == "__main__":
    get_audit_stats()
