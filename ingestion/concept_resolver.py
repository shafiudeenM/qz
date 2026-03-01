"""
concept_resolver.py — AI-Driven Concept Auto-Mapper for TNPSC Question Ingestion
==================================================================================

WHAT IT DOES:
-------------
Before inserting questions into final_questions_v2, this script:
1. Reads your question SQL file
2. Extracts all unique concept_id + question_text pairs
3. For each concept_id:
   - Checks if it already exists in the concepts table
   - If NOT: asks Groq LLM to generate a proper concept name/description
     based on a sample question using that concept
4. Inserts all new concepts into the concepts table
5. Prints the final INSERT SQL for concepts (safe, idempotent)

USAGE:
------
  python concept_resolver.py --sql "path/to/questions.sql" [--output concepts_seed.sql]

REQUIREMENTS:
-------------
  pip install groq python-dotenv supabase
  .env file must have: GROQ_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

import re
import json
import os
import argparse
import time
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# ──────────────────────────────────────────────────────────────────────────────
# 1. Parse SQL file to extract concept_id → sample question pairs
# ──────────────────────────────────────────────────────────────────────────────

def parse_concepts_from_sql(sql_file: str) -> dict:
    """
    Returns a dict: { concept_id: { topic_id, sample_question_text } }
    """
    with open(sql_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Match: VALUES (id, 'topic_id', 'subtopic_id', 'concept_id', ..., 'question_text', ...)
    # The pattern extracts the first 4 string fields + question_text (field 14 in schema)
    pattern = re.compile(
        r"VALUES\s*\(\d+,\s*'([^']+)',\s*'([^']*)',\s*'([^']*)',",
        re.IGNORECASE
    )

    # Extract question_text: it's after a large series of fields
    # Let's do a second pass to get full VALUES tuples
    full_pattern = re.compile(
        r"VALUES\s*\((\d+),\s*'([^']+)',\s*'([^']*)',\s*'([^']*)'.*?'([^']{10,300})'",
        re.IGNORECASE | re.DOTALL
    )

    concepts = {}
    for match in pattern.finditer(content):
        topic_id = match.group(1)
        concept_id = match.group(3)
        if concept_id and concept_id not in concepts:
            concepts[concept_id] = {"topic_id": topic_id, "sample_question": None}

    # Now get sample questions (question_text is the 14th positional value approx)
    # Simpler approach: grab everything after concept_id, take first long string
    q_pattern = re.compile(
        r"VALUES\s*\(\d+,\s*'([^']+)',\s*'[^']*',\s*'([^']*)',\s*'[^']*',\s*\d+,\s*\d+,\s*'[^']*',\s*'\{[^}]*\}',\s*'([^']{10,400})'",
        re.IGNORECASE | re.DOTALL
    )
    for match in q_pattern.finditer(content):
        topic_id = match.group(1)
        concept_id = match.group(2)
        question_text = match.group(3).strip()
        if concept_id and concept_id in concepts and not concepts[concept_id]["sample_question"]:
            concepts[concept_id]["sample_question"] = question_text[:300]

    return concepts


# ──────────────────────────────────────────────────────────────────────────────
# 2. Load canonical topics for context
# ──────────────────────────────────────────────────────────────────────────────

def load_canonical_topics(json_path: str) -> dict:
    """Returns { topic_id: { topic_name, subject_domain } }"""
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {row["id"]: row for row in data}


# ──────────────────────────────────────────────────────────────────────────────
# 3. Ask Groq to resolve a concept
# ──────────────────────────────────────────────────────────────────────────────

def resolve_concept_with_groq(
    client: Groq,
    concept_id: str,
    topic_name: str,
    subject_domain: str,
    sample_question: str,
) -> dict:
    """
    Ask Groq: given this concept_id, topic, and sample question,
    return a human-readable name, category, description.
    """
    prompt = f"""You are an expert TNPSC exam content classifier.

A question has been tagged with the concept ID: "{concept_id}"
This concept belongs to the topic: "{topic_name}" (Domain: "{subject_domain}")

Sample question using this concept:
---
{sample_question or '(no sample available)'}
---

Based on the concept ID and sample question, generate a JSON response with:
{{
  "name": "Short human-readable concept name (3-6 words, English)",
  "description": "One sentence explaining what this concept tests (15-25 words)",
  "category": "One of: TAM, HIS, GEO, SCI, POL, ECO, APT, ENG, CUR"
}}

Respond ONLY with valid JSON. No extra text."""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=150,
        )
        raw = response.choices[0].message.content.strip()
        # Clean up in case model adds markdown
        raw = re.sub(r"```json|```", "", raw).strip()
        return json.loads(raw)
    except Exception as e:
        # Fallback: use a formatted version of the concept_id
        print(f"  ⚠️ Groq failed for {concept_id}: {e}")
        prefix = concept_id.split("_")[0]
        return {
            "name": concept_id.replace("_", " ").title(),
            "description": f"Questions testing {concept_id.replace('_', ' ').lower()}",
            "category": prefix
        }


# ──────────────────────────────────────────────────────────────────────────────
# 4. Check existing concepts in Supabase (optional, if connected)
# ──────────────────────────────────────────────────────────────────────────────

def get_existing_concepts_from_supabase() -> set:
    """Returns set of existing concept IDs. Falls back to empty set if offline."""
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            return set()
        client = create_client(url, key)
        response = client.table("concepts").select("id").execute()
        return {row["id"] for row in response.data}
    except Exception as e:
        print(f"  ⚠️ Could not connect to Supabase: {e}. Will generate SQL for ALL concepts.")
        return set()


# ──────────────────────────────────────────────────────────────────────────────
# 5. Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="AI-Driven Concept Resolver for TNPSC Questions")
    parser.add_argument("--sql", required=True, help="Path to the SQL insert file")
    parser.add_argument(
        "--canonical",
        default=r"c:\Users\user\Downloads\canonical_topics_rows.json",
        help="Path to canonical_topics_rows.json"
    )
    parser.add_argument("--output", default="concepts_seed.sql", help="Output SQL file name")
    args = parser.parse_args()

    print(f"\n🚀 TNPSC AI Concept Resolver")
    print(f"   SQL file : {args.sql}")
    print(f"   Canonical: {args.canonical}")
    print(f"   Output   : {args.output}\n")

    # Step 1: Extract concepts from SQL
    print("📖 Step 1: Parsing concept IDs from SQL file...")
    concepts = parse_concepts_from_sql(args.sql)
    print(f"   Found {len(concepts)} unique concept IDs: {list(concepts.keys())}\n")

    # Step 2: Load canonical topics
    print("📚 Step 2: Loading canonical topics...")
    canonical_topics = load_canonical_topics(args.canonical)
    print(f"   Loaded {len(canonical_topics)} canonical topics.\n")

    # Step 3: Check existing concepts in Supabase
    print("🔍 Step 3: Checking existing concepts in Supabase...")
    existing = get_existing_concepts_from_supabase()
    new_concepts = {cid: data for cid, data in concepts.items() if cid not in existing}
    print(f"   Existing: {len(existing)}, New to create: {len(new_concepts)}\n")

    if not new_concepts:
        print("✅ All concepts already exist. No action needed.")
        return

    # Step 4: Resolve each new concept with Groq
    print("🧠 Step 4: Resolving new concepts with Groq LLM...")
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    resolved = {}

    for i, (concept_id, data) in enumerate(new_concepts.items(), 1):
        topic_id = data["topic_id"]
        topic_info = canonical_topics.get(topic_id, {})
        topic_name = topic_info.get("topic_name", topic_id)
        domain = topic_info.get("subject_domain", "General")
        sample_q = data.get("sample_question", "")

        print(f"   [{i}/{len(new_concepts)}] {concept_id} → resolving...")
        result = resolve_concept_with_groq(groq_client, concept_id, topic_name, domain, sample_q)
        resolved[concept_id] = {
            "topic_id": topic_id,
            "name": result.get("name", concept_id.replace("_", " ").title()),
            "description": result.get("description", ""),
            "category": result.get("category", topic_id.split("_")[0]),
        }
        print(f"      ✅ Name: {resolved[concept_id]['name']}")

        # Respect Groq rate limits
        if i < len(new_concepts):
            time.sleep(0.5)

    # Step 5: Generate SQL output
    print(f"\n📝 Step 5: Writing output to '{args.output}'...")
    lines = [
        "-- ============================================================",
        "-- AUTO-GENERATED by concept_resolver.py (AI-Driven)",
        f"-- Generated from: {args.sql}",
        "-- Run this SQL in Supabase BEFORE your question insert script",
        "-- ============================================================",
        "",
        "INSERT INTO concepts (id, name, category, description)",
        "VALUES",
    ]

    rows = []
    for cid, data in resolved.items():
        name = data["name"].replace("'", "''")
        category = data["category"].replace("'", "''")
        description = data["description"].replace("'", "''")
        rows.append(f"  ('{cid}', '{name}', '{category}', '{description}')")

    lines.append(",\n".join(rows))
    lines.append("ON CONFLICT (id) DO NOTHING;")
    lines.append("")
    lines.append(f"-- Total: {len(resolved)} new concepts created")

    output_path = os.path.join(
        os.path.dirname(args.sql),
        args.output
    )
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\n✅ Done! Run this file first in Supabase SQL Editor:")
    print(f"   {output_path}")
    print(f"\nThen run your question insert script:")
    print(f"   {args.sql}")


if __name__ == "__main__":
    main()
