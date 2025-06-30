import json
import logging
from typing import Any, Dict, List, Optional

import aiohttp
import tiktoken
import xxhash
from chonkie import Chunk, OpenAIEmbeddings, TokenChunker  # type: ignore
from fastapi import BackgroundTasks, HTTPException, status
from docling.document_converter import DocumentConverter, PdfFormatOption  # type: ignore
from docling.datamodel.base_models import InputFormat  # type: ignore
from docling.datamodel.pipeline_options import PdfPipelineOptions, VlmPipelineOptions  # type: ignore
from docling_core.types.doc import ImageRefMode  # type: ignore

from .config import settings
from .database import (
    delete_chunks_for_resource,
    get_resource_by_id,
    increment_processed_batches,
    save_chunks_to_db,
    update_resource_status,
    update_resource_total_batches,
)
from .discord import send_discord_notification
from .models import Resource
from .schemas import ResourceBase
from .supabase import send_update, send_usage_update

logger = logging.getLogger(__name__)


async def get_text_from_tika(
    url: str, tika_url: Optional[str] = None
) -> tuple[str, int]:
    """Extract text from a file URL using Tika asynchronously."""
    if tika_url is None:
        tika_url = settings.TIKA_URL

    # Headers to mimic a real browser request
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": (
            "text/html,application/xhtml+xml,application/xml;q=0.9,"
            "image/webp,image/apng,*/*;q=0.8"
        ),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }

    # Try docling first with VLM for image description instead of base64
    try:
        # Configure VLM pipeline for image analysis and description
        # SmolDocling will analyze images and generate text descriptions instead of base64 data
        # Examples: "A bar chart showing quarterly sales", "Diagram of system architecture"
        vlm_options = VlmPipelineOptions(
            do_vlm=True,
            vlm_model="ds4sd/SmolDocling-256M-preview",
        )
        
        # Configure PDF pipeline options for proper document handling
        pdf_pipeline_options = PdfPipelineOptions()
        pdf_pipeline_options.do_ocr = False  # Keep OCR disabled to avoid EasyOCR dependency issues
        # Note: Set to True if you need to extract text from images, but requires EasyOCR dependencies
        pdf_pipeline_options.do_table_structure = True  # Keep table structure detection
        pdf_pipeline_options.table_structure_options = {
            "do_cell_matching": True,
        }
        # Enable image processing with VLM descriptions
        pdf_pipeline_options.generate_picture_images = True  # Generate images for picture elements
        pdf_pipeline_options.do_picture_classification = True  # Classify picture types
        pdf_pipeline_options.images_scale = 2.0  # Higher resolution images
        
        # Create format options with both pipeline options
        format_options = PdfFormatOption(
            pipeline_options=pdf_pipeline_options,
            vlm_options=vlm_options
        )
        
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: format_options,
            }
        )
        
        result = converter.convert(url)
        doc = result.document
        
        # Export to markdown - VLM will provide image descriptions instead of base64
        try:
            # Export with VLM-generated image descriptions
            text_content = doc.export_to_markdown()
        except Exception as e:
            logger.warning(f"Failed to export with VLM descriptions: {str(e)}")
            # This shouldn't fail, but just in case
            text_content = doc.export_to_markdown()

        print("--------------------------------")   
        print(text_content)
        print("--------------------------------")
        
        # Calculate file size from the extracted text
        file_size = len(text_content.encode('utf-8'))
        
        logger.info(f"Successfully extracted text using docling with VLM image descriptions: {len(text_content)} characters")
        return text_content, file_size
        
    except Exception as e:
        logger.error(f"Docling conversion failed: {str(e)}")
        logger.info("Falling back to Tika approach")
        # Fall back to the original Tika approach below

    try:
        async with aiohttp.ClientSession() as session:
            # Download the file from the URL with browser-like headers
            async with session.get(str(url), headers=headers) as file_response:
                # Handle specific error cases
                if file_response.status == 999:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=(
                            "Access denied by the website. This URL may not allow "
                            "automated access (common with LinkedIn, social media "
                            "sites, etc.)"
                        ),
                    )
                elif file_response.status == 403:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access forbidden. The website blocked the request.",
                    )
                elif file_response.status == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="The requested URL was not found.",
                    )

                file_response.raise_for_status()
                file_content = await file_response.read()
                file_size = len(file_content)

            # Send the file to Tika for text extraction
            async with session.put(
                tika_url,
                headers={"Accept": "text/plain"},
                data=file_content,
            ) as tika_response:
                tika_response.raise_for_status()
                text_content = await tika_response.text()
                return text_content, file_size
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except aiohttp.ClientError as e:
        # Handle other aiohttp errors
        error_message = str(e)
        if "999" in error_message:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Access denied by the website. This URL may not allow "
                    "automated access (common with LinkedIn, social media "
                    "sites, etc.)"
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from URL: {error_message}",
        )
    except Exception as e:
        # Handle any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error while processing URL: {str(e)}",
        )


async def generate_file_title(text: str, original_filename: str) -> str:
    """Generate a title using Itzam API or fallback to simple generation."""
    if not text.strip():
        return original_filename

    # Try to generate title using Itzam API if available
    if settings.ITZAM_API_KEY:
        try:
            # Limit text to 1000 characters for API efficiency
            limited_text = text[:1000]

            payload = {
                "input": (
                    f"Original file name: {original_filename}\n"
                    f"File content: {limited_text}"
                ),
                "workflowSlug": "file-title-generator",
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{settings.ITZAM_API_URL}/generate/text",
                    headers={
                        "Api-Key": settings.ITZAM_API_KEY,
                        "Content-Type": "application/json",
                    },
                    data=json.dumps(payload),
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        generated_title: str = result.get("text", "").strip()
                        if generated_title:
                            logger.info(
                                f"Generated title using Itzam API: {generated_title}"
                            )
                            return generated_title
                    else:
                        logger.warning(f"Itzam API returned status {response.status}")
        except Exception as e:
            logger.error(f"Error calling Itzam API for title generation: {str(e)}")

    # Fallback to simple title generation
    lines = text.strip().split("\n")
    first_line = lines[0].strip() if lines else ""

    if first_line and len(first_line) <= 100:
        return first_line
    elif len(text) > 100:
        return text[:100].strip() + "..."
    else:
        return text.strip() or original_filename


async def generate_chunks(
    resource: ResourceBase,
    chunk_size: int,
    tokenizer: tiktoken.Encoding,
    knowledge_id: Optional[str],
    workflow_id: str,
    context_id: Optional[str],
):
    """Extract text from resource and generate chunks."""
    try:
        logger.info(f"Starting chunk generation for resource {resource.id}")

        # Extract text content
        text_content, file_size = await get_text_from_tika(str(resource.url))

        logger.info(f"Text content: {text_content}")

        if not text_content.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text content extracted from the provided URL",
            )

        # Compute content hash using xxhash
        content_hash = xxhash.xxh64(text_content.encode("utf-8")).hexdigest()

        # Send initial update with file size
        await send_update(
            resource.dict(),
            {
                "status": "PENDING",
                "title": "",
                "fileSize": file_size,
                "totalChunks": 0,
                "resourceId": resource.id,
                "knowledgeId": knowledge_id,
                "contextId": context_id,
            },
        )

        # Send usage update
        await send_usage_update(workflow_id, file_size)

        if hasattr(resource, "title") and resource.title:
            title = resource.title
            logger.info(f"Using existing title for resource {resource.id}: {title}")
        else:
            original_filename = str(resource.url)
            title = await generate_file_title(text_content, original_filename)
            logger.info(f"Generated new title for resource {resource.id}: {title}")

        # Send update with title
        await send_update(
            resource.dict(),
            {
                "status": "PENDING",
                "title": title,
                "fileSize": file_size,
                "totalChunks": 0,
                "resourceId": resource.id,
                "knowledgeId": knowledge_id,
                "contextId": context_id,
            },
        )

        # Update resource with title, file size and content hash
        if resource.id:
            update_resource_status(
                resource.id, "PENDING", title, file_size, content_hash=content_hash
            )

        # Initialize tokenizer and chunker
        chunker = TokenChunker(tokenizer, chunk_size=chunk_size)

        # Chunk the text
        chunks = chunker(text_content)
        chunk_length = len(chunks)

        # Update resource with total chunks
        if resource.id:
            update_resource_status(
                resource.id, "PENDING", title, file_size, chunk_length, content_hash
            )

        # Send update with total chunks
        await send_update(
            resource.dict(),
            {
                "status": "PENDING",
                "title": title,
                "fileSize": file_size,
                "totalChunks": chunk_length,
                "resourceId": resource.id,
                "knowledgeId": knowledge_id,
                "contextId": context_id,
            },
        )

        logger.info(f"Generated {chunk_length} chunks for resource {resource.id}")

        return {
            "chunks": chunks,
            "title": title,
            "file_size": file_size,
            "text_content": text_content,
            "content_hash": content_hash,
        }

    except Exception as e:
        logger.error(f"Error generating chunks for resource {resource.id}: {str(e)}")

        # Update resource status to failed
        if resource.id:
            update_resource_status(resource.id, "FAILED")

        # Send failure update
        fallback_title = str(resource.url)

        await send_update(
            resource.dict(),
            {
                "status": "FAILED",
                "title": fallback_title,
                "totalChunks": 0,
                "fileSize": 0,
                "resourceId": resource.id,
                "knowledgeId": knowledge_id,
                "contextId": context_id,
            },
        )

        raise


async def generate_embeddings(
    chunks: List[Chunk],
    resource: ResourceBase,
    workflow_id: str,
    knowledge_id: str,
    context_id: str,
    file_size: int,
    title: Optional[str] = None,
    save_to_db: bool = False,
) -> Dict[str, Any]:
    """Generate embeddings for chunks and optionally save to database."""
    try:
        # Use provided title or generate a fallback
        if not title:
            original_filename = str(resource.url)
            title = original_filename

        # Generate embeddings if OpenAI API key is available
        embeddings_data = None
        if settings.OPENAI_API_KEY:
            try:
                client = OpenAIEmbeddings(
                    api_key=settings.OPENAI_API_KEY, model="text-embedding-3-small"
                )

                # Generate embeddings for all chunks asynchronously
                embeddings = client.embed_batch([chunk.text for chunk in chunks])

                embeddings_data = [
                    {"content": chunk.text, "embedding": embeddings[idx].tolist()}
                    for idx, chunk in enumerate(chunks)
                ]

            except Exception:
                raise
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key not configured",
            )

        result = {
            "chunks": chunks,
            "title": title,
            "file_size": file_size,
            "embeddings_count": len(embeddings_data) if embeddings_data else 0,
        }

        # Save to database if requested
        if save_to_db and embeddings_data and resource.id:
            save_result = save_chunks_to_db(embeddings_data, resource.id, workflow_id)
            result["save_result"] = save_result

            if save_result["success"]:
                result["chunks_saved"] = save_result["chunks_saved"]
                result["chunk_ids"] = save_result["chunk_ids"]
                status_to_set = "PROCESSED"
            else:
                result["save_error"] = save_result["error"]
                status_to_set = "FAILED"
        else:
            result["embeddings"] = embeddings_data
            status_to_set = "PROCESSED"

        # Increment processed batches and check if all batches are completed
        all_batches_completed = False
        if resource.id:
            all_batches_completed = increment_processed_batches(resource.id, 1)

        if all_batches_completed:
            logger.info(
                f"All embedding batches completed for resource {resource.id}. "
                "Resource fully processed."
            )
            # The last_scraped_at was already updated in increment_processed_batches

        # Update resource status
        if resource.id:
            update_resource_status(resource.id, status_to_set)

        logger.warn(
            {
                "status": status_to_set,
                "title": title,
                "processedChunks": len(chunks),
                "fileSize": file_size,
                "resourceId": resource.id,
                "knowledgeId": knowledge_id,
                "allBatchesCompleted": all_batches_completed,
            }
        )

        # Send real-time update
        await send_update(
            resource.dict(),
            {
                "status": status_to_set,
                "title": title,
                "processedChunks": len(chunks),
                "fileSize": file_size,
                "resourceId": resource.id,
                "knowledgeId": knowledge_id,
                "contextId": context_id,
            },
        )

        return result

    except Exception as e:
        logger.error(
            "Error generating embeddings for resource %s: %s", resource.id, str(e)
        )

        # Update resource status to failed
        if resource.id:
            update_resource_status(resource.id, "FAILED")

        # Send failure update
        await send_update(
            resource.dict(),
            {
                "status": "FAILED",
                "title": title,
                "fileSize": 0,
                "resourceId": resource.id,
                "knowledgeId": knowledge_id,
                "contextId": context_id,
            },
        )

        raise


async def process_resource_embeddings(
    background_tasks: BackgroundTasks,
    resource: ResourceBase,
    workflow_id: str,
    knowledge_id: str,
    context_id: str,
    save_to_db: bool = False,
) -> Dict[str, Any]:
    """Complete pipeline: generate chunks and embeddings for a resource,
    batching by embedding token limits.
    """
    try:
        chunk_size = 512
        embeddings_limit_per_request = 300000

        tokenizer = tiktoken.get_encoding("cl100k_base")
        # First generate chunks
        chunks_data = await generate_chunks(
            resource, chunk_size, tokenizer, knowledge_id, workflow_id, context_id
        )

        chunks: List[Chunk] = chunks_data["chunks"]
        file_size = chunks_data["file_size"]

        # Batch chunks so that each batch does not exceed embeddings_limit_per_request
        batches = []
        current_batch: List[Chunk] = []
        current_tokens = 0

        for chunk in chunks:
            if chunk.token_count > embeddings_limit_per_request:
                # If a single chunk exceeds the limit, process it alone
                if current_batch:
                    batches.append(current_batch)
                    current_batch = []
                    current_tokens = 0
                batches.append([chunk])
                continue

            if current_tokens + chunk.token_count > embeddings_limit_per_request:
                if current_batch:
                    batches.append(current_batch)
                current_batch = [chunk]
                current_tokens = chunk.token_count
            else:
                current_batch.append(chunk)
                current_tokens += chunk.token_count

        if current_batch:
            batches.append(current_batch)

        # Update total_batches in the database
        if resource.id:
            update_resource_total_batches(resource.id, len(batches))
            logger.info(
                f"Set total_batches to {len(batches)} for resource {resource.id}"
            )

        # Add a background task for each batch
        for batch in batches:
            logger.info("Generating embeddings for %s chunk batches", len(batch))
            background_tasks.add_task(
                generate_embeddings,
                chunks=batch,
                resource=resource,
                workflow_id=workflow_id,
                knowledge_id=knowledge_id,
                file_size=file_size,
                title=chunks_data["title"],
                save_to_db=save_to_db,
                context_id=context_id,
            )

        return {"success": True, "batches": len(batches)}

    except Exception as e:
        logger.error(
            f"Error processing resource embeddings for {resource.id}: {str(e)}"
        )
        raise


async def rescrape_resource_embeddings(
    background_tasks: BackgroundTasks,
    resource: ResourceBase,
    workflow_id: str,
    knowledge_id: Optional[str],
    context_id: Optional[str],
    save_to_db: bool = False,
) -> Dict[str, Any]:
    """Rescrape pipeline: check if content has changed before processing."""
    existing_resource: Optional[Resource] = None
    try:
        if not resource.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resource ID is required",
            )

        # Get existing resource from database
        existing_resource = get_resource_by_id(resource.id)
        if not existing_resource:
            logger.error(f"Resource {resource.id} not found in database")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resource {resource.id} not found",
            )

        # Keep status as PENDING during processing
        logger.info(f"Starting rescrape process for resource {resource.id}")

        # Send real-time update that processing has started
        await send_update(
            resource.dict(),
            {
                "status": "PENDING",
                "title": existing_resource.title or "",
                "fileSize": existing_resource.file_size or 0,
                "totalChunks": existing_resource.total_chunks,
                "resourceId": resource.id,
                "knowledgeId": knowledge_id,
                "contextId": context_id,
                "message": "Starting rescrape process",
            },
        )

        # Extract text content to check hash
        text_content, file_size = await get_text_from_tika(str(resource.url))

        # Compute new content hash
        new_content_hash = xxhash.xxh64(text_content.encode("utf-8")).hexdigest()

        # Check if content has changed
        if existing_resource.content_hash == new_content_hash:
            logger.info(
                f"Content hash unchanged for resource {resource.id}, skipping rescrape"
            )

            # Update status back to PROCESSED
            # (lastScrapedAt already updated by TypeScript)
            if resource.id:
                update_resource_status(resource.id, "PROCESSED")

            # Send update that rescrape was skipped
            await send_update(
                resource.dict(),
                {
                    "status": "SKIPPED",
                    "title": existing_resource.title or "",
                    "fileSize": existing_resource.file_size or 0,
                    "totalChunks": existing_resource.total_chunks,
                    "resourceId": resource.id,
                    "knowledgeId": knowledge_id,
                    "contextId": context_id,
                    "message": "Content unchanged, skipping rescrape",
                },
            )

            # Send Discord notification for cache hit
            await send_discord_notification(
                content=(
                f"🎯 - cache hit for {resource.id}, with rescrape set to "
                f"{existing_resource.scrape_frequency}"
            ),
                username="Itzam Rescrape Bot",
            )

            return {
                "status": "skipped",
                "reason": "content_unchanged",
                "content_hash": new_content_hash,
            }

        logger.info(
            f"Content hash changed for resource {resource.id}, processing rescrape"
        )

        delete_chunks_for_resource(resource.id)
        logger.info(f"Deleted old chunks for resource {resource.id}")

        # If content has changed, process normally
        result = await process_resource_embeddings(
            background_tasks,
            resource,
            workflow_id,
            knowledge_id or "",
            context_id or "",
            save_to_db,
        )

        # Send Discord notification for content refresh
        await send_discord_notification(
            content=(
                f"🔄 - refreshed for {resource.id}, with rescrape set to "
                f"{existing_resource.scrape_frequency}"
            ),
            username="Itzam Rescrape Bot",
        )

        return result

    except Exception as e:
        logger.error(f"Error rescraping resource {resource.id}: {str(e)}")

        # Send Discord notification for failure
        scrape_freq = (
            existing_resource.scrape_frequency if existing_resource else "UNKNOWN"
        )
        await send_discord_notification(
            content=(
                f"❌ - failed for {resource.id}, with rescrape set to {scrape_freq}"
            ),
            username="Itzam Rescrape Bot",
        )

        raise
