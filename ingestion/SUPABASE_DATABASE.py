# supabase_database.py - SUPABASE DATABASE OPERATIONS

"""
Supabase Database Layer
- Uses Supabase client library
- PostgreSQL managed by Supabase
- Real-time capabilities
- Automatic backups
- Built-in RLS (Row Level Security)
"""

import logging
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from supabase_config import get_supabase_settings
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class SupabaseDatabase:
    """Supabase database operations"""
    
    def __init__(self):
        settings = get_supabase_settings()
        self.client: Client = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_key
        )
        logger.info("✅ Supabase client connected")
    
    # ========================================================================
    # EXAM QUESTIONS OPERATIONS
    # ========================================================================
    
    def insert_question(self, question_data: Dict) -> bool:
        """Insert a single question"""
        try:
            response = self.service_role_client.table('exam_questions').insert(question_data).execute()
            logger.debug(f"✅ Question inserted: {question_data.get('question_text', '')[:50]}...")
            return True
        except Exception as e:
            logger.error(f"❌ Insert question failed: {str(e)}")
            return False
    
    def insert_questions_batch(self, questions: List[Dict]) -> int:
        """Batch insert questions"""
        inserted = 0
        for q in questions:
            if self.insert_question(q):
                inserted += 1
        logger.info(f"✅ Batch inserted: {inserted}/{len(questions)} questions")
        return inserted
    
    def get_question(self, question_id: int) -> Optional[Dict]:
        """Get single question by ID"""
        try:
            response = self.service_role_client.table('exam_questions').select('*').eq('id', question_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Get question failed: {str(e)}")
            return None
    
    def search_questions(self, query: str, limit: int = 10) -> List[Dict]:
        """Search questions by text"""
        try:
            response = (
                self.service_role_client.table('exam_questions')
                .select('*')
                .ilike('question_text', f'%{query}%')
                .limit(limit)
                .execute()
            )
            return response.data
        except Exception as e:
            logger.error(f"❌ Search failed: {str(e)}")
            return []
    
    def get_questions_by_exam(self, exam_year: int, exam_type: str) -> List[Dict]:
        """Get questions for specific exam"""
        try:
            response = (
                self.service_role_client.table('exam_questions')
                .select('*')
                .eq('exam_year', exam_year)
                .eq('exam_type', exam_type)
                .execute()
            )
            return response.data
        except Exception as e:
            logger.error(f"❌ Get exam questions failed: {str(e)}")
            return []
    
    def update_question(self, question_id: int, update_data: Dict) -> bool:
        """Update question"""
        try:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            response = (
                self.service_role_client.table('exam_questions')
                .update(update_data)
                .eq('id', question_id)
                .execute()
            )
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"❌ Update question failed: {str(e)}")
            return False
    
    # ========================================================================
    # CONCEPTS OPERATIONS
    # ========================================================================
    
    def insert_concept(self, concept_data: Dict) -> bool:
        """Insert concept"""
        try:
            response = self.service_role_client.table('concepts').insert(concept_data).execute()
            return True
        except Exception as e:
            logger.error(f"❌ Insert concept failed: {str(e)}")
            return False

    def insert_concepts_batch(self, concepts: List[Dict]) -> int:
        """Batch insert concepts"""
        inserted = 0
        for c in concepts:
            if self.insert_concept(c):
                inserted += 1
        logger.info(f"✅ Batch inserted: {inserted}/{len(concepts)} concepts")
        return inserted
    
    def get_concepts_by_category(self, category: str) -> List[Dict]:
        """Get concepts by category"""
        try:
            response = (
                self.service_role_client.table('concepts')
                .select('*')
                .eq('category', category)
                .execute()
            )
            return response.data
        except Exception as e:
            logger.error(f"❌ Get concepts failed: {str(e)}")
            return []
    
    # ========================================================================
    # CONSTITUTION ARTICLES OPERATIONS
    # ========================================================================
    
    def insert_article(self, article_data: Dict) -> bool:
        """Insert constitution article"""
        try:
            response = self.service_role_client.table('constitution_articles').insert(article_data).execute()
            return True
        except Exception as e:
            logger.error(f"❌ Insert article failed: {str(e)}")
            return False
    
    def get_article(self, article_number: int) -> Optional[Dict]:
        """Get article by number"""
        try:
            response = (
                self.service_role_client.table('constitution_articles')
                .select('*')
                .eq('article_number', article_number)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Get article failed: {str(e)}")
            return None
    
    # ========================================================================
    # INGESTION LOGS
    # ========================================================================
    
    def log_ingestion(self, log_data: Dict) -> bool:
        """Log ingestion event"""
        try:
            log_data['start_time'] = datetime.utcnow().isoformat()
            response = self.service_role_client.table('ingestion_logs').insert(log_data).execute()
            return True
        except Exception as e:
            logger.error(f"❌ Log ingestion failed: {str(e)}")
            return False
    
    def get_ingestion_logs(self, limit: int = 50) -> List[Dict]:
        """Get recent ingestion logs"""
        try:
            response = (
                self.service_role_client.table('ingestion_logs')
                .select('*')
                .order('start_time', desc=True)
                .limit(limit)
                .execute()
            )
            return response.data
        except Exception as e:
            logger.error(f"❌ Get logs failed: {str(e)}")
            return []
    
    # ========================================================================
    # EXPERT QUEUE
    # ========================================================================
    
    def add_to_expert_queue(self, queue_data: Dict) -> bool:
        """Add question to expert review queue"""
        try:
            response = self.service_role_client.table('expert_queue').insert(queue_data).execute()
            return True
        except Exception as e:
            logger.error(f"❌ Add to expert queue failed: {str(e)}")
            return False
    
    def get_expert_queue(self, status: str = 'pending') -> List[Dict]:
        """Get expert queue items"""
        try:
            response = (
                self.client.table('expert_queue')
                .select('*')
                .eq('status', status)
                .order('created_at', desc=True)
                .execute()
            )
            return response.data
        except Exception as e:
            logger.error(f"❌ Get expert queue failed: {str(e)}")
            return []
    
    # ========================================================================
    # STATISTICS & ANALYTICS
    # ========================================================================
    
    def get_statistics(self) -> Dict:
        """Get ingestion statistics"""
        try:
            # Total questions
            q_response = self.service_role_client.table('exam_questions').select('id', count='exact').execute()
            total_questions = q_response.count
            
            # Validated questions
            v_response = (
                self.service_role_client.table('exam_questions')
                .select('id', count='exact')
                .eq('is_validated', True)
                .execute()
            )
            validated_questions = v_response.count
            
            # Expert review needed
            e_response = (
                self.service_role_client.table('exam_questions')
                .select('id', count='exact')
                .eq('requires_expert_review', True)
                .execute()
            )
            expert_needed = e_response.count
            
            return {
                'total_questions': total_questions,
                'validated_questions': validated_questions,
                'expert_review_needed': expert_needed,
                'validation_rate': f"{(validated_questions / total_questions * 100):.1f}%" if total_questions > 0 else "0%"
            }
        except Exception as e:
            logger.error(f"❌ Get statistics failed: {str(e)}")
            return {}
    
    def health_check(self) -> bool:
        """Check database connection"""
        try:
            response = self.service_role_client.table('exam_questions').select('id').limit(1).execute()
            logger.info("✅ Supabase health check passed")
            return True
        except Exception as e:
            logger.error(f"❌ Supabase health check failed: {str(e)}")
            return False

# Global database instance
supabase_db = SupabaseDatabase()

if __name__ == "__main__":
    db = SupabaseDatabase()
    
    # Health check
    if db.health_check():
        print("✅ Database connected")
        stats = db.get_statistics()
        print(f"📊 Statistics: {stats}")
    else:
        print("❌ Database connection failed")
