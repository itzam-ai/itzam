import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import create_engine, select, update
from sqlalchemy.orm import Session, sessionmaker

from .config import settings
from .models import Chunks, Resource

logger = logging.getLogger(__name__)

# Create SQLAlchemy engine and session
engine = create_engine(settings.POSTGRES_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db_session() -> Session:
    """Get database session."""
    return SessionLocal()


def save_chunks_to_db(
    chunks_data: List[Dict[str, Any]], resource_id: str, workflow_id: str
) -> Dict[str, Any]:
    """Save chunks and embeddings to database using SQLAlchemy."""
    session: Optional[Session] = None
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
                updated_at=datetime.utcnow(),
            )
            chunk_records.append(chunk_record)

        # Insert chunks in batch
        session.add_all(chunk_records)
        session.commit()
        session.close()

        return {
            "success": True,
            "chunks_saved": len(chunk_records),
            "chunk_ids": chunk_ids,
        }

    except Exception as e:
        logger.error(f"Failed to save chunks to database: {str(e)}")
        if session:
            session.rollback()
            session.close()
        return {"success": False, "error": str(e), "chunks_saved": 0}


def update_resource_status(
    resource_id: str,
    status: str,
    title: Optional[str] = None,
    file_size: Optional[int] = None,
    total_chunks: Optional[int] = None,
    content_hash: Optional[str] = None,
):
    """Update resource status in the database using SQLAlchemy."""
    session: Optional[Session] = None
    try:
        session = get_db_session()

        # Prepare update data
        update_data: Dict[str, Any] = {
            "status": status,
        }

        if title:
            update_data["title"] = title
        if file_size is not None:
            update_data["file_size"] = file_size
        if total_chunks is not None:
            update_data["total_chunks"] = total_chunks
        if content_hash is not None:
            update_data["content_hash"] = content_hash

        # Update resource
        stmt = update(Resource).where(Resource.id == resource_id).values(**update_data)
        session.execute(stmt)
        session.commit()
        session.close()

    except Exception as e:
        logger.error(f"Failed to update resource status: {str(e)}")
        if session:
            session.rollback()
            session.close()


def get_resource_by_id(resource_id: str) -> Optional[Resource]:
    """Get resource by ID using SQLAlchemy."""
    session: Optional[Session] = None
    try:
        session = get_db_session()

        stmt = select(Resource).where(Resource.id == resource_id)
        result = session.execute(stmt).scalar_one_or_none()
        session.close()

        return result

    except Exception as e:
        logger.error(f"Failed to get resource {resource_id}: {str(e)}")
        if session:
            session.close()
        return None


def update_resource_total_batches(resource_id: str, total_batches: int):
    """Update the total_batches field for a resource."""
    session: Optional[Session] = None
    try:
        session = get_db_session()

        stmt = (
            update(Resource)
            .where(Resource.id == resource_id)
            .values(total_batches=total_batches, updated_at=datetime.utcnow())
        )
        session.execute(stmt)
        session.commit()
        session.close()

        logger.info(
            f"Updated total_batches to {total_batches} for resource {resource_id}"
        )

    except Exception as e:
        logger.error(
            f"Failed to update total_batches for resource {resource_id}: {str(e)}"
        )
        if session:
            session.rollback()
            session.close()


def delete_chunks_for_resource(resource_id: str) -> bool:
    """Delete all chunks for a resource."""
    session: Optional[Session] = None
    try:
        session = get_db_session()

        # Delete all chunks for this resource
        session.query(Chunks).filter(Chunks.resource_id == resource_id).delete()
        session.commit()
        session.close()

        logger.info(f"Deleted all chunks for resource {resource_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to delete chunks for resource {resource_id}: {str(e)}")
        if session:
            session.rollback()
            session.close()
        return False


def increment_processed_batches(resource_id: str, batch_count: int = 1) -> bool:
    """
    Atomically increment processed_batches and check if all batches are completed.
    Returns True if all batches are now processed, False otherwise.
    """
    session: Optional[Session] = None
    try:
        session = get_db_session()

        # Get current resource state
        select_stmt = select(Resource).where(Resource.id == resource_id)
        resource = session.execute(select_stmt).scalar_one_or_none()

        if not resource:
            logger.error(f"Resource {resource_id} not found")
            session.close()
            return False

        new_processed_batches = resource.processed_batches + batch_count

        # Check if all batches are completed
        all_batches_completed = new_processed_batches >= resource.total_batches

        if all_batches_completed:
            # Update both processed_batches and last_scraped_at
            update_stmt = (
                update(Resource)
                .where(Resource.id == resource_id)
                .values(
                    processed_batches=min(
                        new_processed_batches, resource.total_batches
                    ),
                    last_scraped_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
            )
            logger.info(
                f"All {resource.total_batches} batches completed for resource "
                f"{resource_id}. Updated last_scraped_at."
            )
        else:
            # Update only processed_batches
            update_stmt = (
                update(Resource)
                .where(Resource.id == resource_id)
                .values(
                    processed_batches=new_processed_batches,
                    updated_at=datetime.utcnow(),
                )
            )
            logger.info(
                f"Processed batch for resource {resource_id}. Progress: "
                f"{new_processed_batches}/{resource.total_batches}"
            )

        session.execute(update_stmt)
        session.commit()
        session.close()

        return all_batches_completed

    except Exception as e:
        logger.error(
            f"Failed to increment processed_batches for resource "
            f"{resource_id}: {str(e)}"
        )
        if session:
            session.rollback()
            session.close()
        return False
