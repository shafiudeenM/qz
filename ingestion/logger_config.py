# logger_config.py - Production Logging Configuration

import os
import json
import logging
import logging.handlers
from datetime import datetime
from typing import Dict, Any
from supabase_config import get_supabase_settings as get_settings
import structlog


settings = get_settings()


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "process_id": record.process,
            "thread_id": record.thread,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        
        return json.dumps(log_data, default=str)


class TextFormatter(logging.Formatter):
    """Custom text formatter for readable logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        level_color = {
            "DEBUG": "\033[36m",    # Cyan
            "INFO": "\033[32m",     # Green
            "WARNING": "\033[33m",  # Yellow
            "ERROR": "\033[31m",    # Red
            "CRITICAL": "\033[35m", # Magenta
        }
        reset = "\033[0m"
        
        color = level_color.get(record.levelname, "")
        
        log_msg = f"{timestamp} | {color}{record.levelname:8}{reset} | {record.name}:{record.lineno} | {record.getMessage()}"
        
        if record.exc_info:
            log_msg += f"\n{self.formatException(record.exc_info)}"
        
        return log_msg


def setup_logging() -> None:
    """
    Setup complete logging system with:
    - Console output (formatted)
    - File output (JSON format)
    - Rotating file handler
    - Different log levels for different modules
    """
    
    # Create logs directory if it doesn't exist
    os.makedirs(settings.logs_dir, exist_ok=True)
    
    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.log_level))
    
    # Remove any existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # ========================================================================
    # 1. CONSOLE HANDLER (Human-readable format)
    # ========================================================================
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, settings.log_level))
    
    if settings.log_format == "json":
        console_formatter = JSONFormatter()
    else:
        console_formatter = TextFormatter()
    
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # ========================================================================
    # 2. FILE HANDLER (Rotating, JSON format for parsing)
    # ========================================================================
    if settings.log_to_file:
        # Main log file
        main_log_file = os.path.join(settings.logs_dir, "ingestion.log")
        
        # Rotating file handler - creates new file when size limit reached
        rotating_handler = logging.handlers.RotatingFileHandler(
            filename=main_log_file,
            maxBytes=settings.log_rotation_size,  # 10 MB default
            backupCount=settings.log_backup_count,  # Keep 10 backups
            encoding="utf-8"
        )
        rotating_handler.setLevel(logging.DEBUG)  # File gets all levels
        rotating_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(rotating_handler)
        
        # Error-specific log file
        error_log_file = os.path.join(settings.logs_dir, "errors.log")
        error_handler = logging.handlers.RotatingFileHandler(
            filename=error_log_file,
            maxBytes=settings.log_rotation_size,
            backupCount=settings.log_backup_count,
            encoding="utf-8"
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(error_handler)
    
    # ========================================================================
    # 3. MODULE-SPECIFIC LOG LEVELS
    # ========================================================================
    module_log_levels = {
        "sqlalchemy": logging.WARNING,  # SQLAlchemy is verbose
        "groq": logging.DEBUG,          # Groq is important, log everything
        "qdrant_client": logging.DEBUG, # Qdrant is important
        "urllib3": logging.WARNING,     # urllib is verbose
        "asyncio": logging.WARNING,     # asyncio is verbose
    }
    
    for module_name, level in module_log_levels.items():
        logging.getLogger(module_name).setLevel(level)
    
    root_logger.info("=" * 80)
    root_logger.info(f"✅ Logging initialized | Format: {settings.log_format} | Level: {settings.log_level}")
    root_logger.info(f"📁 Log file: {main_log_file if settings.log_to_file else 'Console only'}")
    root_logger.info("=" * 80)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger for a specific module
    
    Usage:
        logger = get_logger(__name__)
    """
    return logging.getLogger(name)


class IngestionLogger:
    """
    Wrapper for structured logging with extra context
    """
    
    def __init__(self, module_name: str):
        self.logger = get_logger(module_name)
    
    def info(self, message: str, **extra):
        """Log info with extra context"""
        self.logger.info(message, extra={"context": extra})
    
    def error(self, message: str, exception: Exception = None, **extra):
        """Log error with optional exception"""
        self.logger.error(message, exc_info=exception, extra={"context": extra})
    
    def warning(self, message: str, **extra):
        """Log warning with extra context"""
        self.logger.warning(message, extra={"context": extra})
    
    def debug(self, message: str, **extra):
        """Log debug with extra context"""
        self.logger.debug(message, extra={"context": extra})
    
    def log_step(self, step_name: str, status: str, details: Dict[str, Any] = None):
        """Log a processing step"""
        log_message = f"[{step_name}] {status}"
        self.logger.info(log_message, extra={"step": step_name, "status": status, "details": details or {}})
    
    def log_metric(self, metric_name: str, value: Any, unit: str = ""):
        """Log a metric/measurement"""
        self.logger.debug(f"Metric: {metric_name}={value}{unit}", extra={"metric": metric_name, "value": value, "unit": unit})
    
    def log_performance(self, operation: str, duration_seconds: float, items_processed: int = 0):
        """Log performance metrics"""
        throughput = items_processed / duration_seconds if duration_seconds > 0 and items_processed > 0 else 0
        self.logger.info(
            f"Performance: {operation} completed in {duration_seconds:.2f}s (throughput: {throughput:.2f} items/sec)",
            extra={
                "operation": operation,
                "duration_seconds": duration_seconds,
                "items_processed": items_processed,
                "throughput": throughput
            }
        )


# Initialize logging when module is imported
if not logging.getLogger().hasHandlers():
    setup_logging()

# Create root logger for convenience
logger = get_logger("tnpsc_ingestion")

if __name__ == "__main__":
    # Test logging
    setup_logging()
    test_logger = IngestionLogger(__name__)
    
    test_logger.info("Testing info log", user_id="test123")
    test_logger.warning("Testing warning log", file_name="test.pdf")
    test_logger.debug("Testing debug log", batch_number=1)
    test_logger.log_step("PDF Parsing", "Started", {"file": "test.pdf"})
    test_logger.log_metric("Questions extracted", 150, " items")
    test_logger.log_performance("PDF Processing", 2.5, 150)
    
    print("\n✅ Logging test complete - check logs/ directory")
