# supabase_config.py - PRODUCTION SUPABASE INTEGRATION

"""
SUPABASE CONFIGURATION FOR TNPSC BRAIN
- PostgreSQL managed by Supabase
- Real-time capabilities
- Built-in authentication
- Vector extensions support
- Automatic backups
- FREE tier available
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class SupabaseSettings(BaseSettings):
    """Supabase configuration"""
    
    # ============================================================================
    # SUPABASE CONNECTION
    # ============================================================================
    supabase_url: str = Field(default="", validation_alias="SUPABASE_URL")
    supabase_key: str = Field(default="", validation_alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(default="", validation_alias="SUPABASE_SERVICE_ROLE_KEY")
    
    # SUPABASE provides PostgreSQL connection string
    # You can get it from: Supabase Dashboard → Settings → Database
    database_url: str = Field(default="", validation_alias="DATABASE_URL")
    
    # ============================================================================
    # QDRANT VECTOR DB
    # ============================================================================
    qdrant_api_url: str = Field(default="", validation_alias="QDRANT_API_URL")
    qdrant_api_key: str = Field(default="", validation_alias="QDRANT_API_KEY")
    qdrant_collection_name: str = Field(default="tnpsc_questions", validation_alias="QDRANT_COLLECTION_NAME")
    qdrant_vector_size: int = Field(default=384, validation_alias="QDRANT_VECTOR_SIZE")
    
    # ============================================================================
    # GROQ (For Q&A extraction)
    # ============================================================================
    groq_api_key: str = Field(default="", validation_alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.1-8b-instant", validation_alias="GROQ_MODEL")
    
    # ============================================================================
    # APPLICATION
    # ============================================================================
    app_environment: str = Field(default="production", env="APP_ENVIRONMENT")
    
    # Logging
    logs_dir: str = Field(default="logs", env="LOGS_DIR")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")
    log_to_file: bool = Field(default=True, env="LOG_TO_FILE")
    log_rotation_size: int = Field(default=10485760, env="LOG_ROTATION_SIZE") # 10 MB
    log_backup_count: int = Field(default=5, env="LOG_BACKUP_COUNT")
    # DATA PROCESSING
    # ============================================================================
    enable_ocr: bool = Field(default=True, env="ENABLE_OCR")
    batch_size: int = Field(default=10, env="BATCH_SIZE")
    
    @field_validator('supabase_url', 'supabase_key', 'qdrant_api_url', 'groq_api_key')
    @classmethod
    def validate_required_fields(cls, v, info):
        if not v:
            raise ValueError(f"{info.field_name} is required")
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"

@lru_cache()
def get_supabase_settings() -> SupabaseSettings:
    """Get cached Supabase settings"""
    return SupabaseSettings()

# ============================================================================
# SUPABASE CLIENT WRAPPER
# ============================================================================

from supabase import create_client, Client

class SupabaseClient:
    """Wrapper for Supabase client"""
    
    def __init__(self):
        settings = get_supabase_settings()
        self.client: Client = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_key
        )
        self.service_role_client: Client = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_service_role_key
        )
        logger.info("✅ Supabase client initialized")
    
    def health_check(self) -> bool:
        """Check Supabase connection"""
        try:
            response = self.client.table('exam_questions').select('id').limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase health check failed: {str(e)}")
            return False

# ============================================================================
# SUPABASE SQL SCHEMA (Run this in Supabase SQL Editor)
# ============================================================================

SUPABASE_SCHEMA = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Concepts table
CREATE TABLE concepts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,
    importance_score FLOAT,
    question_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam questions table
CREATE TABLE exam_questions (
    id BIGSERIAL PRIMARY KEY,
    exam_year INT NOT NULL,
    exam_type VARCHAR(20) NOT NULL,
    question_number INT,
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer VARCHAR(1000) NOT NULL,
    explanation TEXT,
    difficulty_level INT,
    concept_id BIGINT REFERENCES concepts(id),
    source_file VARCHAR(255),
    source_page INT,
    memory_trick TEXT,
    importance_score FLOAT,
    tags TEXT[],
    related_question_ids INT[],
    embedding_id VARCHAR(255),
    is_validated BOOLEAN DEFAULT FALSE,
    validation_errors TEXT[],
    confidence_score FLOAT,
    requires_expert_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingested_at TIMESTAMP
);

-- Constitution articles table
CREATE TABLE constitution_articles (
    id BIGSERIAL PRIMARY KEY,
    article_number INT UNIQUE NOT NULL,
    article_title VARCHAR(255) NOT NULL,
    article_text TEXT NOT NULL,
    amendments TEXT[],
    tnpsc_importance INT,
    question_count INT DEFAULT 0,
    embedding_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Links between concepts and articles
CREATE TABLE concept_article_links (
    id BIGSERIAL PRIMARY KEY,
    concept_id BIGINT REFERENCES concepts(id),
    article_id BIGINT REFERENCES constitution_articles(id),
    relevance_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingestion logs
CREATE TABLE ingestion_logs (
    id BIGSERIAL PRIMARY KEY,
    source_file VARCHAR(255) NOT NULL,
    source_type VARCHAR(50),
    items_found INT DEFAULT 0,
    items_processed INT DEFAULT 0,
    items_valid INT DEFAULT 0,
    items_failed INT DEFAULT 0,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds FLOAT,
    status VARCHAR(50),
    error_message TEXT,
    validation_passed BOOLEAN DEFAULT FALSE,
    validation_report JSONB,
    triggered_by VARCHAR(100),
    context JSONB
);

-- Expert queue (for low confidence questions)
CREATE TABLE expert_queue (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT REFERENCES exam_questions(id),
    status VARCHAR(50) DEFAULT 'pending',
    reason VARCHAR(255),
    assigned_expert_id VARCHAR(255),
    assigned_at TIMESTAMP,
    expert_answer TEXT,
    answered_at TIMESTAMP,
    expert_rating INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_exam_year_type ON exam_questions(exam_year, exam_type);
CREATE INDEX idx_concept_id ON exam_questions(concept_id);
CREATE INDEX idx_is_validated ON exam_questions(is_validated);
CREATE INDEX idx_requires_expert_review ON exam_questions(requires_expert_review);
CREATE INDEX idx_created_at ON exam_questions(created_at);
CREATE INDEX idx_category ON concepts(category);
CREATE INDEX idx_article_number ON constitution_articles(article_number);

-- Enable Row Level Security
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE constitution_articles ENABLE ROW LEVEL SECURITY;

-- Create policies (allow public read, restrict write)
CREATE POLICY "exam_questions_public_read" ON exam_questions FOR SELECT USING (true);
CREATE POLICY "concepts_public_read" ON concepts FOR SELECT USING (true);
CREATE POLICY "constitution_articles_public_read" ON constitution_articles FOR SELECT USING (true);
"""

# ============================================================================
# ENVIRONMENT TEMPLATE
# ============================================================================

ENV_TEMPLATE = """
# SUPABASE
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# QDRANT
QDRANT_API_URL=https://xxxxx.qdrant.io:6333
QDRANT_API_KEY=YOUR_QDRANT_KEY
QDRANT_COLLECTION_NAME=tnpsc_questions

# GROQ
GROQ_API_KEY=gsk_YOUR_KEY

# APPLICATION
APP_ENVIRONMENT=production
LOG_LEVEL=INFO
ENABLE_OCR=true
BATCH_SIZE=10
"""

if __name__ == "__main__":
    settings = get_supabase_settings()
    print(f"✅ Supabase URL: {settings.supabase_url[:30]}...")
    print(f"✅ Qdrant URL: {settings.qdrant_api_url[:30]}...")
    print(f"✅ Environment: {settings.app_environment}")
