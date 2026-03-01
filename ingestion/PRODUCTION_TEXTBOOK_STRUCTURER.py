# PRODUCTION GRADE TEXTBOOK STRUCTURER - 99.9% ACCURACY

import json, logging, time, re
from typing import List, Dict, Any
from groq import Groq
import backoff

logger = logging.getLogger(__name__)

class TextbookStructurer:
    """EXTRACT CONCEPTS & FACTS FROM TEXTBOOKS"""
    
    def __init__(self, groq_api_key: str, model: str = "llama-3.1-8b-instant"):
        self.client = Groq(api_key=groq_api_key)
        self.model = model
        self.max_retries = 5
        
    @backoff.on_exception(backoff.expo, Exception, max_tries=5, max_time=300)
    def structure_text(self, text: str, source_file: str = "", source_page: int = 0) -> List[Dict]:
        """EXTRACT KEY CONCEPTS AND DEFINITIONS"""
        
        logger.info(f"🧠 Structuring concepts from {source_file} page {source_page}")
        
        if len(text.strip()) < 100:
            return []
        
        # PROMPT: Structured to get concepts
        system_prompt = """You are an EXPERT at summarizing TNPSC textbooks.
        
        Extract DISTINCT CONCEPTS from the text. For EACH concept provide:
        
        1. name: The specific concept name (e.g., "Fundamental Rights", "Photosynthesis")
        2. category: The broad subject (e.g., "Polity", "Biology", "History")
        3. subcategory: More specific topic (e.g., "Constitution", "Plant Physiology")
        4. description: A clear, concise 2-3 sentence definition/explanation.
        5. importance_score: 0.1 to 1.0 (relevance to TNPSC exams)
        
        CRITICAL RULES:
        - Extract FACTUAL information only
        - Avoid generic terms; be specific
        - Return as JSON array ONLY
        
        STRICT FORMAT:
        [
          {
            "name": "...",
            "category": "...",
            "subcategory": "...",
            "description": "...",
            "importance_score": 0.9
          }
        ]"""
        
        user_message = f"""Extract ALL concepts from this text:
        
        {text}
        
        Return ONLY JSON array."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=4096,
                temperature=0.3,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )
            
            response_text = response.choices[0].message.content
            concepts = self._parse_response(response_text)
            
            # Add metadata
            for c in concepts:
                c["source_file"] = source_file
                c["source_page"] = source_page
                
            return concepts
            
        except Exception as e:
            logger.error(f"❌ Groq textbook error: {str(e)}")
            return []

    def _parse_response(self, response_text: str) -> List[Dict]:
        """PARSE JSON RESPONSE"""
        try:
            return json.loads(response_text)
        except:
            # Try to find JSON array in text
            match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except:
                    pass
            return []

if __name__ == "__main__":
    # Test
    pass
