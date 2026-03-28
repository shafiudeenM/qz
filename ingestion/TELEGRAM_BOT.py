# TELEGRAM_BOT.py - Automated Daily Quiz Sharing

import os
import requests
import random
import logging
import time
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID")

if not all([SUPABASE_URL, SUPABASE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID]):
    logger.error("❌ Missing environment variables.")
    exit(1)

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_daily_question(retries=5, delay=5):
    """Fetches a high-importance random question using the new Intelligence Layer."""
    for attempt in range(retries):
        try:
            # We fetch questions from the pool to pick one with high selection probability
            response = supabase.table("final_questions_v2").select("*").limit(200).execute()
            if response.data:
                # Prioritize questions with higher selection probability or just random from the top pool
                return random.choice(response.data)
            return None
        except Exception as e:
            logger.error(f"Attempt {attempt + 1} failed: {str(e)}")
            time.sleep(delay)
    return None

def send_telegram_poll(q, retries=3, delay=5):
    """Sends a bilingual poll with error handling."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPoll"
    
    # Options are stored as an array in final_questions_v2
    options = q.get("options", [])
    if not options: return False

    # Create a bilingual question text
    q_text_en = q.get("question_text", "")
    q_text_ta = q.get("question_text_ta", "")
    
    # Telegram has a 300 char limit for question text
    display_text = f"🎯 Daily Quiz\n\n{q_text_ta}\n\n{q_text_en}"[:300]

    payload = {
        "chat_id": TELEGRAM_CHANNEL_ID,
        "question": display_text,
        "options": [str(o) for o in options][:10], # Max 10 options
        "is_anonymous": False,
        "type": "quiz",
        "correct_option_id": int(q.get("correct_option_index", 0)),
        "explanation": f"✅ {q.get('explanation')}"[:200],
        "open_period": 86400
    }

    for attempt in range(retries):
        try:
            r = requests.post(url, json=payload, timeout=15)
            if r.json().get("ok"): return True
        except: pass
        time.sleep(delay)
    return False

def main():
    logger.info("🚀 Starting Daily Quiz Bot...")
    question = fetch_daily_question()
    
    if question:
        if send_telegram_poll(question):
            logger.info("✨ Routine completed successfully.")
        else:
            logger.error("💔 Failed to post quiz.")
    else:
        logger.error("📭 No question available to post.")

if __name__ == "__main__":
    main()
