import re
import json

sql_file = r"c:\Users\user\Downloads\exact-match-screenshot-main\exact-match-screenshot-main\Questions\final_questions_v2 (2).sql"

with open(sql_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all (topic_id, subtopic_id, concept_id) from VALUES clauses
pattern = re.compile(
    r"VALUES\s*\(\d+,\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'",
    re.IGNORECASE
)

topic_ids = set()
concept_ids = set()

for match in pattern.finditer(content):
    topic_id = match.group(1)
    concept_id = match.group(3)
    topic_ids.add(topic_id)
    if concept_id:
        concept_ids.add(concept_id)

print(f"Unique topic_ids ({len(topic_ids)}): {sorted(topic_ids)}")
print(f"Unique concept_ids ({len(concept_ids)}): {sorted(concept_ids)}")

# Load canonical_topics_rows.json
canonical_file = r"c:\Users\user\Downloads\canonical_topics_rows.json"
with open(canonical_file, 'r', encoding='utf-8') as f:
    canonical_data = json.load(f)

canonical_ids = {row['id'] for row in canonical_data}
missing_topics = topic_ids - canonical_ids
if missing_topics:
    print(f"\nMissing topic_ids (not in canonical_topics): {sorted(missing_topics)}")
else:
    print("\n✅ All topic_ids found in canonical_topics!")

# Generate concept pre-population SQL
print("\n\n--- SQL TO RUN IN SUPABASE SQL EDITOR FIRST ---\n")
print("-- Pre-populate concepts table (required before inserting into final_questions_v2)")
print("INSERT INTO concepts (id, name, category)")
print("VALUES")
rows = []
for cid in sorted(concept_ids):
    prefix = cid.split('_')[0]
    readable = cid.replace('_', ' ').title()
    rows.append(f"  ('{cid}', '{readable}', '{prefix}')")
print(",\n".join(rows))
print("ON CONFLICT (id) DO NOTHING;")
