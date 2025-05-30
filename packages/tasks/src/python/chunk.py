import sys
import json
import requests
import os
import uuid
from datetime import datetime
from chonkie import TokenChunker
from chonkie.embeddings import OpenAIEmbeddings
from supabase import create_client, Client
import tiktoken
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Initialize Supabase client with environment variables."""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
    
    return create_client(url, key)

def save_chunks_to_supabase(chunks_data: list, resource_id: str, workflow_id: str) -> dict:
    """Save chunks and embeddings directly to Supabase."""
    try:
        supabase = get_supabase_client()
        
        # Prepare chunk records for insertion
        chunk_records = []
        for chunk_data in chunks_data:
            chunk_id = str(uuid.uuid4())
            record = {
                "id": chunk_id,
                "content": chunk_data["content"],
                "embedding": chunk_data["embedding"].tolist(),
                "resource_id": resource_id,
                "workflow_id": workflow_id,
                "active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            chunk_records.append(record)
        
        # Insert chunks in batch
        result = supabase.table("chunks").insert(chunk_records).execute()
        
        return {
            "success": True,
            "chunks_saved": len(chunk_records),
            "chunk_ids": [record["id"] for record in chunk_records]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "chunks_saved": 0
        }

def get_text_from_tika(url, tika_url="http://localhost:9998/tika"):
    # Download the file from the URL
    file_response = requests.get(url)
    file_response.raise_for_status()
    file_content = file_response.content

    # Send the file to Tika for text extraction
    tika_response = requests.put(
        tika_url,
        headers={"Accept": "text/plain"},
        data=file_content,
    )
    tika_response.raise_for_status()
    return tika_response.text

def main():
    url = sys.argv[1]
    mimeType = sys.argv[2] if len(sys.argv) > 2 else None
    tika_url = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:9998/tika"
    
    # Check if we should generate embeddings (optional fourth argument)
    generate_embeddings = len(sys.argv) > 4 and sys.argv[4].lower() == "true"
    
    # Get additional parameters for saving to Supabase
    resource_id = sys.argv[5] if len(sys.argv) > 5 else None
    workflow_id = sys.argv[6] if len(sys.argv) > 6 else None
    save_to_db = len(sys.argv) > 7 and sys.argv[7].lower() == "true"

    # Get text content from Tika
    content = get_text_from_tika(url, tika_url)

    tokenizer = tiktoken.get_encoding("cl100k_base")

    # Initialize the chunker
    chunker = TokenChunker(tokenizer)

    # Chunk the text
    chunks = chunker(content)
    chunk_texts = [chunk.text for chunk in chunks]

    result = {"chunks": chunk_texts, "count": len(chunk_texts)}

    # Generate embeddings if requested and OpenAI API key is available
    if generate_embeddings and os.getenv("OPENAI_API_KEY"):
        try:
            # Initialize OpenAI embeddings
            embeddings_model = OpenAIEmbeddings(
                model="text-embedding-3-small",
                api_key=os.getenv("OPENAI_API_KEY")
            )
            
            # Generate embeddings for all chunks
            embeddings = embeddings_model.embed_batch(chunk_texts)
            
            # If we should save to database and have required parameters
            if save_to_db and resource_id and workflow_id:
                # Prepare chunks data for saving
                chunks_data = [
                    {
                        "content": chunk_texts[i],
                        "embedding": embeddings[i]
                    }
                    for i in range(len(chunk_texts))
                ]
                
                # Save directly to Supabase
                save_result = save_chunks_to_supabase(chunks_data, resource_id, workflow_id)
                result["save_result"] = save_result
                
                if save_result["success"]:
                    result["chunks_saved"] = save_result["chunks_saved"]
                    result["chunk_ids"] = save_result["chunk_ids"]
                else:
                    result["save_error"] = save_result["error"]
            else:
                # Return embeddings for TypeScript to handle
                result["embeddings"] = embeddings
            
        except Exception as e:
            # If embeddings fail, continue without them
            result["embeddings_error"] = str(e)

    print(json.dumps(result))

if __name__ == "__main__":
    main()