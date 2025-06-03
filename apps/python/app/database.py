import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, select, update, delete
from sqlalchemy.orm import sessionmaker, Session

from .config import settings
from .models import Chunks, Resource, ResourceContexts

logger = logging.getLogger(__name__)

# Create SQLAlchemy engine and session
engine = create_engine(settings.POSTGRES_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_session() -> Session:
    """Get database session."""
    return SessionLocal()

def save_chunks_to_db(chunks_data: List[Dict[str, Any]], resource_id: str, workflow_id: str) -> Dict[str, Any]:
    """Save chunks and embeddings to database using SQLAlchemy."""
    try:
        session = get_db_session()
        
        # Prepare chunk records for insertion
        chunk_records = []
        chunk_ids = []
        
        for chunk_data in chunks_data:
            chunk_id = str(uuid.uuid4())
            chunk_ids.append(chunk_id)
            
            chunk_record = Chunks(
                id=chunk_id,
                content=chunk_data["content"],
                embedding=chunk_data["embedding"],
                resource_id=resource_id,
                workflow_id=workflow_id,
                active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            chunk_records.append(chunk_record)
        
        # Insert chunks in batch
        session.add_all(chunk_records)
        session.commit()
        session.close()
        
        return {
            "success": True,
            "chunks_saved": len(chunk_records),
            "chunk_ids": chunk_ids
        }
        
    except Exception as e:
        logger.error(f"Failed to save chunks to database: {str(e)}")
        if 'session' in locals():
            session.rollback()
            session.close()
        return {
            "success": False,
            "error": str(e),
            "chunks_saved": 0
        }

def update_resource_status(resource_id: str, status: str, title: Optional[str] = None, file_size: Optional[int] = None):
    """Update resource status in the database using SQLAlchemy."""
    try:
        session = get_db_session()
        
        # Prepare update data
        update_data = {
            "status": status,
        }
        
        if title:
            update_data["title"] = title
        if file_size is not None:
            update_data["file_size"] = file_size
        
        # Update resource
        stmt = update(Resource).where(Resource.id == resource_id).values(**update_data)
        session.execute(stmt)
        session.commit()
        session.close()
        
        logger.info(f"Updated resource {resource_id} status to {status}")
        
    except Exception as e:
        logger.error(f"Failed to update resource status: {str(e)}")
        if 'session' in locals():
            session.rollback()
            session.close()

def get_resource_by_id(resource_id: str) -> Optional[Resource]:
    """Get resource by ID using SQLAlchemy."""
    try:
        session = get_db_session()
        
        stmt = select(Resource).where(Resource.id == resource_id)
        result = session.execute(stmt).scalar_one_or_none()
        session.close()
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get resource {resource_id}: {str(e)}")
        if 'session' in locals():
            session.close()
        return None


def sync_resource(resource_id: str, source_type: str, knowledge_id: Optional[str] = None, context_ids: Optional[List[str]] = None):
    """Unified function to sync resource associations based on source type."""
    try:
        session = get_db_session()
        
        if source_type == "KNOWLEDGE":
            if not knowledge_id:
                raise ValueError("knowledge_id is required for KNOWLEDGE source type")
            
            # Remove any existing context associations (context and knowledge are mutually exclusive)
            stmt = delete(ResourceContexts).where(ResourceContexts.resource_id == resource_id)
            session.execute(stmt)
            
            # Set knowledge association
            stmt = update(Resource).where(Resource.id == resource_id).values(knowledge_id=knowledge_id)
            session.execute(stmt)
            
            session.commit()
            session.close()
            
            logger.info(f"Set knowledge association for resource {resource_id} to {knowledge_id} (removed context associations)")
            
        elif source_type == "CONTEXT":
            if not context_ids:
                raise ValueError("context_ids is required for CONTEXT source type")
            
            # Remove any existing knowledge association (context and knowledge are mutually exclusive)
            stmt = update(Resource).where(Resource.id == resource_id).values(knowledge_id=None)
            session.execute(stmt)
            
            # Create context associations
            for context_id in context_ids:
                association = ResourceContexts(
                    id=str(uuid.uuid4()),
                    resource_id=resource_id,
                    context_id=context_id,
                    created_at=datetime.utcnow()
                )
                session.add(association)
            
            session.commit()
            session.close()
            
            logger.info(f"Created {len(context_ids)} context associations for resource {resource_id} (removed knowledge association)")
            
        else:
            raise ValueError(f"Invalid source_type: {source_type}")
            
    except Exception as e:
        logger.error(f"Failed to sync resource {resource_id}: {str(e)}")
        if 'session' in locals():
            session.rollback()
            session.close()
        raise