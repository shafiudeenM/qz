import os

print(f"CWD: {os.getcwd()}")
files = os.listdir('.')
print(f"Files: {files}")

if ".env" in files:
    print("✅ .env found")
    with open(".env", "r") as f:
        content = f.read()
        print(f"Content length: {len(content)}")
        print(f"First 50 chars: {content[:50]}")
else:
    print("❌ .env NOT found")
    # Check for .env.txt
    if ".env.txt" in files:
        print("⚠️ Found .env.txt instead!")

from dotenv import load_dotenv
load_dotenv()
print(f"SUPABASE_ANON_KEY from env: {os.getenv('SUPABASE_ANON_KEY')}")
