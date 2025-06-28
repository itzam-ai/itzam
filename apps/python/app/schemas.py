from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, HttpUrl


# Request/Response Models
class ResourceBase(BaseModel):
    url: HttpUrl
    type: str = Field(..., pattern="^(LINK|FILE)$")
    id: Optional[str] = None
    title: Optional[str] = None


class FileResource(ResourceBase):
    type: str = Field("FILE", pattern="^FILE$")
    mime_type: str = Field(..., alias="mimeType")
    file_name: str = Field(..., alias="fileName")
    file_size: int = Field(..., alias="fileSize")


class LinkResource(ResourceBase):
    type: str = Field("LINK", pattern="^LINK$")
    file_size: int = Field(0, alias="fileSize")


class CreateResourceRequest(BaseModel):
    resources: List[ResourceBase]
    knowledge_id: Optional[str] = Field(None, alias="knowledgeId")
    workflow_id: str = Field(..., alias="workflowId")
    user_id: str = Field(..., alias="userId")
    context_id: Optional[str] = Field(None, alias="contextId")


class RescrapeRequest(BaseModel):
    resources: List[ResourceBase]
    knowledge_id: str = Field(..., alias="knowledgeId")
    workflow_id: str = Field(..., alias="workflowId")
    user_id: str = Field(..., alias="userId")
    rescrape_secret: str = Field(..., alias="rescrapeSecret")
    context_id: Optional[str] = Field(None, alias="contextId")


class ChunkRequest(BaseModel):
    resource: Union[FileResource, LinkResource]
    generate_embeddings: bool = Field(False, alias="generateEmbeddings")
    save_to_supabase: bool = Field(False, alias="saveToSupabase")
    workflow_id: Optional[str] = Field(None, alias="workflowId")


class ProcessingResult(BaseModel):
    resource_id: str
    title: str
    chunks_count: int
    status: str
    saved_to_supabase: bool = False
    error: Optional[str] = None


class CreateResourceResponse(BaseModel):
    success: bool
    resources: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    status: str
    message: str


class UpdatePayload(BaseModel):
    status: str
    title: str
    chunks: int
    file_size: int
    resource_id: str


class ChunkResponse(BaseModel):
    chunks: List[str]
    count: int
    title: str
    file_size: int
    embeddings: Optional[List[Dict[str, Any]]] = None
    embeddings_error: Optional[str] = None
    saved_to_supabase: Optional[bool] = None
    chunks_saved: Optional[int] = None
    chunk_ids: Optional[List[str]] = None
    save_error: Optional[str] = None
