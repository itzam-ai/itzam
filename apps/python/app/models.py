# Using pgvector 0.4.1
from typing import Any, List, Optional

from pgvector.sqlalchemy.vector import VECTOR  # type: ignore
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    Computed,
    DateTime,
    Double,
    Enum,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    PrimaryKeyConstraint,
    SmallInteger,
    String,
    Table,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, OID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import datetime
import decimal
import uuid


class Base(DeclarativeBase):
    pass


class Users(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "email_change_confirm_status >= 0 AND email_change_confirm_status <= 2",
            name="users_email_change_confirm_status_check",
        ),
        PrimaryKeyConstraint("id", name="users_pkey"),
        UniqueConstraint("phone", name="users_phone_key"),
        Index("confirmation_token_idx", "confirmation_token", unique=True),
        Index(
            "email_change_token_current_idx", "email_change_token_current", unique=True
        ),
        Index("email_change_token_new_idx", "email_change_token_new", unique=True),
        Index("reauthentication_token_idx", "reauthentication_token", unique=True),
        Index("recovery_token_idx", "recovery_token", unique=True),
        Index("users_email_partial_key", "email", unique=True),
        Index("users_instance_id_email_idx", "instance_id"),
        Index("users_instance_id_idx", "instance_id"),
        Index("users_is_anonymous_idx", "is_anonymous"),
        {
            "comment": "Auth: Stores user login data within a secure schema.",
            "schema": "auth",
        },
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    is_sso_user: Mapped[bool] = mapped_column(
        Boolean,
        server_default=text("false"),
        comment="Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.",
    )
    is_anonymous: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    instance_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    aud: Mapped[Optional[str]] = mapped_column(String(255))
    role: Mapped[Optional[str]] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    encrypted_password: Mapped[Optional[str]] = mapped_column(String(255))
    email_confirmed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(True)
    )
    invited_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    confirmation_token: Mapped[Optional[str]] = mapped_column(String(255))
    confirmation_sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(True)
    )
    recovery_token: Mapped[Optional[str]] = mapped_column(String(255))
    recovery_sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(True)
    )
    email_change_token_new: Mapped[Optional[str]] = mapped_column(String(255))
    email_change: Mapped[Optional[str]] = mapped_column(String(255))
    email_change_sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(True)
    )
    last_sign_in_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    raw_app_meta_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    raw_user_meta_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    is_super_admin: Mapped[Optional[bool]] = mapped_column(Boolean)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    phone: Mapped[Optional[str]] = mapped_column(
        Text, server_default=text("NULL::character varying")
    )
    phone_confirmed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(True)
    )
    phone_change: Mapped[Optional[str]] = mapped_column(
        Text, server_default=text("''::character varying")
    )
    phone_change_token: Mapped[Optional[str]] = mapped_column(
        String(255), server_default=text("''::character varying")
    )
    phone_change_sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(True)
    )
    confirmed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(True),
        Computed("LEAST(email_confirmed_at, phone_confirmed_at)", persisted=True),
    )
    email_change_token_current: Mapped[Optional[str]] = mapped_column(
        String(255), server_default=text("''::character varying")
    )
    email_change_confirm_status: Mapped[Optional[int]] = mapped_column(
        SmallInteger, server_default=text("0")
    )
    banned_until: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    reauthentication_token: Mapped[Optional[str]] = mapped_column(
        String(255), server_default=text("''::character varying")
    )
    reauthentication_sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(True)
    )
    deleted_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))

    api_key: Mapped[List["ApiKey"]] = relationship("ApiKey", back_populates="user")
    provider_key: Mapped[List["ProviderKey"]] = relationship(
        "ProviderKey", back_populates="user"
    )
    chat: Mapped[List["Chat"]] = relationship("Chat", back_populates="user")
    workflow: Mapped[List["Workflow"]] = relationship("Workflow", back_populates="user")


class Context(Base):
    __tablename__ = "context"
    __table_args__ = (PrimaryKeyConstraint("id", name="context_pkey"),)

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))

    context_item: Mapped[List["ContextItem"]] = relationship(
        "ContextItem", back_populates="context"
    )
    workflow: Mapped[List["Workflow"]] = relationship(
        "Workflow", back_populates="context"
    )


t_hypopg_hidden_indexes = Table(
    "hypopg_hidden_indexes",
    Base.metadata,
    Column("indexrelid", OID),
    Column("index_name", String),
    Column("schema_name", String),
    Column("table_name", String),
    Column("am_name", String),
    Column("is_hypo", Boolean),
)


t_hypopg_list_indexes = Table(
    "hypopg_list_indexes",
    Base.metadata,
    Column("indexrelid", OID),
    Column("index_name", Text),
    Column("schema_name", String),
    Column("table_name", String),
    Column("am_name", String),
)


class Knowledge(Base):
    __tablename__ = "knowledge"
    __table_args__ = (PrimaryKeyConstraint("id", name="knowledge_pkey"),)

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))

    resource: Mapped[List["Resource"]] = relationship(
        "Resource", back_populates="knowledge"
    )
    workflow: Mapped[List["Workflow"]] = relationship(
        "Workflow", back_populates="knowledge"
    )


class ModelSettings(Base):
    __tablename__ = "model_settings"
    __table_args__ = (PrimaryKeyConstraint("id", name="model_settings_pkey"),)

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    temperature: Mapped[decimal.Decimal] = mapped_column(Numeric(3, 2))
    temperature_preset: Mapped[str] = mapped_column(
        Enum("STRICT", "BALANCED", "CREATIVE", "CUSTOM", name="temperature_preset")
    )
    max_tokens: Mapped[int] = mapped_column(Integer)
    max_tokens_preset: Mapped[str] = mapped_column(
        Enum("SHORT", "MEDIUM", "LONG", "CUSTOM", name="max_tokens_preset")
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))

    workflow: Mapped[List["Workflow"]] = relationship(
        "Workflow", back_populates="model_settings"
    )


t_pg_stat_statements = Table(
    "pg_stat_statements",
    Base.metadata,
    Column("userid", OID),
    Column("dbid", OID),
    Column("toplevel", Boolean),
    Column("queryid", BigInteger),
    Column("query", Text),
    Column("plans", BigInteger),
    Column("total_plan_time", Double(53)),
    Column("min_plan_time", Double(53)),
    Column("max_plan_time", Double(53)),
    Column("mean_plan_time", Double(53)),
    Column("stddev_plan_time", Double(53)),
    Column("calls", BigInteger),
    Column("total_exec_time", Double(53)),
    Column("min_exec_time", Double(53)),
    Column("max_exec_time", Double(53)),
    Column("mean_exec_time", Double(53)),
    Column("stddev_exec_time", Double(53)),
    Column("rows", BigInteger),
    Column("shared_blks_hit", BigInteger),
    Column("shared_blks_read", BigInteger),
    Column("shared_blks_dirtied", BigInteger),
    Column("shared_blks_written", BigInteger),
    Column("local_blks_hit", BigInteger),
    Column("local_blks_read", BigInteger),
    Column("local_blks_dirtied", BigInteger),
    Column("local_blks_written", BigInteger),
    Column("temp_blks_read", BigInteger),
    Column("temp_blks_written", BigInteger),
    Column("blk_read_time", Double(53)),
    Column("blk_write_time", Double(53)),
    Column("temp_blk_read_time", Double(53)),
    Column("temp_blk_write_time", Double(53)),
    Column("wal_records", BigInteger),
    Column("wal_fpi", BigInteger),
    Column("wal_bytes", Numeric),
    Column("jit_functions", BigInteger),
    Column("jit_generation_time", Double(53)),
    Column("jit_inlining_count", BigInteger),
    Column("jit_inlining_time", Double(53)),
    Column("jit_optimization_count", BigInteger),
    Column("jit_optimization_time", Double(53)),
    Column("jit_emission_count", BigInteger),
    Column("jit_emission_time", Double(53)),
)


t_pg_stat_statements_info = Table(
    "pg_stat_statements_info",
    Base.metadata,
    Column("dealloc", BigInteger),
    Column("stats_reset", DateTime(True)),
)


class Provider(Base):
    __tablename__ = "provider"
    __table_args__ = (PrimaryKeyConstraint("id", name="provider_pkey"),)

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))

    model: Mapped[List["Model"]] = relationship("Model", back_populates="provider")
    provider_key: Mapped[List["ProviderKey"]] = relationship(
        "ProviderKey", back_populates="provider"
    )


class ApiKey(Base):
    __tablename__ = "api_key"
    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], name="api_key_user_id_users_id_fk"
        ),
        PrimaryKeyConstraint("id", name="api_key_pkey"),
        UniqueConstraint("hashed_key", name="api_key_hashed_key_unique"),
        UniqueConstraint("short_key", name="api_key_short_key_unique"),
        Index("api_key_hashed_key_idx", "hashed_key"),
        Index("api_key_user_id_idx", "user_id"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    short_key: Mapped[str] = mapped_column(String(256))
    hashed_key: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    last_used_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))

    user: Mapped["Users"] = relationship("Users", back_populates="api_key")


class ContextItem(Base):
    __tablename__ = "context_item"
    __table_args__ = (
        ForeignKeyConstraint(
            ["context_id"], ["context.id"], name="context_item_context_id_context_id_fk"
        ),
        PrimaryKeyConstraint("id", name="context_item_pkey"),
        Index("context_id_idx", "context_id"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    content: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(
        Enum("TEXT", "IMAGE", "FILE", "URL", name="context_item_type")
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    description: Mapped[Optional[str]] = mapped_column(Text)
    context_id: Mapped[Optional[str]] = mapped_column(String(256))

    context: Mapped[Optional["Context"]] = relationship(
        "Context", back_populates="context_item"
    )


class Model(Base):
    __tablename__ = "model"
    __table_args__ = (
        ForeignKeyConstraint(
            ["provider_id"], ["provider.id"], name="model_provider_id_provider_id_fk"
        ),
        PrimaryKeyConstraint("id", name="model_pkey"),
        UniqueConstraint("tag", name="model_tag_unique"),
        Index("provider_id_idx", "provider_id"),
        Index("tag_idx", "tag"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    tag: Mapped[str] = mapped_column(String(256))
    name: Mapped[str] = mapped_column(String(256))
    has_vision: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    deprecated: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    has_reasoning_capability: Mapped[bool] = mapped_column(
        Boolean, server_default=text("false")
    )
    is_open_source: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    context_window_size: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    max_temperature: Mapped[decimal.Decimal] = mapped_column(Numeric(3, 2))
    default_temperature: Mapped[decimal.Decimal] = mapped_column(Numeric(3, 2))
    max_tokens: Mapped[int] = mapped_column(Integer)
    input_per_million_token_cost: Mapped[Optional[decimal.Decimal]] = mapped_column(
        Numeric(10, 6)
    )
    output_per_million_token_cost: Mapped[Optional[decimal.Decimal]] = mapped_column(
        Numeric(10, 6)
    )
    provider_id: Mapped[Optional[str]] = mapped_column(String(256))

    provider: Mapped[Optional["Provider"]] = relationship(
        "Provider", back_populates="model"
    )
    chat: Mapped[List["Chat"]] = relationship("Chat", back_populates="last_model")
    workflow: Mapped[List["Workflow"]] = relationship(
        "Workflow", back_populates="model"
    )
    chat_message: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="model"
    )
    run: Mapped[List["Run"]] = relationship("Run", back_populates="model")


class ProviderKey(Base):
    __tablename__ = "provider_key"
    __table_args__ = (
        ForeignKeyConstraint(
            ["provider_id"],
            ["provider.id"],
            name="provider_key_provider_id_provider_id_fk",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], name="provider_key_user_id_users_id_fk"
        ),
        PrimaryKeyConstraint("id", name="provider_key_pkey"),
        UniqueConstraint("secret_id", name="provider_key_secret_id_unique"),
        UniqueConstraint("secret_name", name="provider_key_secret_name_unique"),
        Index("provider_key_secret_id_idx", "secret_id"),
        Index("provider_key_secret_name_idx", "secret_name"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    secret_id: Mapped[str] = mapped_column(String(256))
    secret_name: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    provider_id: Mapped[Optional[str]] = mapped_column(String(256))

    provider: Mapped[Optional["Provider"]] = relationship(
        "Provider", back_populates="provider_key"
    )
    user: Mapped["Users"] = relationship("Users", back_populates="provider_key")


class Resource(Base):
    __tablename__ = "resource"
    __table_args__ = (
        ForeignKeyConstraint(
            ["knowledge_id"],
            ["knowledge.id"],
            name="resource_knowledge_id_knowledge_id_fk",
        ),
        PrimaryKeyConstraint("id", name="resource_pkey"),
        Index("resource_knowledge_id_idx", "knowledge_id"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    status: Mapped[str] = mapped_column(
        Enum("PENDING", "PROCESSED", "FAILED", name="resource_status"),
        server_default=text("'PENDING'::resource_status"),
    )
    url: Mapped[str] = mapped_column(String(1024))
    type: Mapped[str] = mapped_column(Enum("FILE", "LINK", name="resource_type"))
    mime_type: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    scrape_frequency: Mapped[str] = mapped_column(
        Enum("NEVER", "HOURLY", "DAILY", "WEEKLY", name="resource_scrape_frequency"),
        server_default=text("'NEVER'::resource_scrape_frequency"),
    )
    total_chunks: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    total_batches: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    processed_batches: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    title: Mapped[Optional[str]] = mapped_column(String(256))
    file_name: Mapped[Optional[str]] = mapped_column(String(256))
    file_size: Mapped[Optional[int]] = mapped_column(Integer)
    knowledge_id: Mapped[Optional[str]] = mapped_column(String(256))
    last_scraped_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    content_hash: Mapped[Optional[str]] = mapped_column(String(256))

    knowledge: Mapped[Optional["Knowledge"]] = relationship(
        "Knowledge", back_populates="resource"
    )
    chunks: Mapped[List["Chunks"]] = relationship("Chunks", back_populates="resource")
    run_resource: Mapped[List["RunResource"]] = relationship(
        "RunResource", back_populates="resource"
    )


class Chat(Base):
    __tablename__ = "chat"
    __table_args__ = (
        ForeignKeyConstraint(
            ["last_model_id"], ["model.id"], name="chat_last_model_id_model_id_fk"
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], name="chat_user_id_users_id_fk"
        ),
        PrimaryKeyConstraint("id", name="chat_pkey"),
        Index("chat_created_at_idx", "created_at"),
        Index("chat_updated_at_idx", "updated_at"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    title: Mapped[Optional[str]] = mapped_column(String(256))
    last_model_id: Mapped[Optional[str]] = mapped_column(String(256))
    last_model_tag: Mapped[Optional[str]] = mapped_column(String(256))

    last_model: Mapped[Optional["Model"]] = relationship("Model", back_populates="chat")
    user: Mapped["Users"] = relationship("Users", back_populates="chat")
    chat_message: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="chat"
    )


class Workflow(Base):
    __tablename__ = "workflow"
    __table_args__ = (
        ForeignKeyConstraint(
            ["context_id"], ["context.id"], name="workflow_context_id_context_id_fk"
        ),
        ForeignKeyConstraint(
            ["knowledge_id"],
            ["knowledge.id"],
            name="workflow_knowledge_id_knowledge_id_fk",
        ),
        ForeignKeyConstraint(
            ["model_id"], ["model.id"], name="workflow_model_id_model_id_fk"
        ),
        ForeignKeyConstraint(
            ["model_settings_id"],
            ["model_settings.id"],
            name="workflow_model_settings_id_model_settings_id_fk",
        ),
        ForeignKeyConstraint(
            ["user_id"], ["auth.users.id"], name="workflow_user_id_users_id_fk"
        ),
        PrimaryKeyConstraint("id", name="workflow_pkey"),
        Index("workflow_context_id_idx", "context_id"),
        Index("workflow_model_id_idx", "model_id"),
        Index("workflow_model_settings_id_idx", "model_settings_id"),
        Index("workflow_slug_idx", "slug"),
        Index("workflow_user_id_idx", "user_id"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    slug: Mapped[str] = mapped_column(String(256))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    prompt: Mapped[str] = mapped_column(Text)
    context_id: Mapped[str] = mapped_column(String(256))
    model_id: Mapped[str] = mapped_column(String(256))
    model_settings_id: Mapped[str] = mapped_column(String(256))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    knowledge_id: Mapped[str] = mapped_column(String(256))
    description: Mapped[Optional[str]] = mapped_column(Text)

    context: Mapped["Context"] = relationship("Context", back_populates="workflow")
    knowledge: Mapped["Knowledge"] = relationship(
        "Knowledge", back_populates="workflow"
    )
    model: Mapped["Model"] = relationship("Model", back_populates="workflow")
    model_settings: Mapped["ModelSettings"] = relationship(
        "ModelSettings", back_populates="workflow"
    )
    user: Mapped["Users"] = relationship("Users", back_populates="workflow")
    chunks: Mapped[List["Chunks"]] = relationship("Chunks", back_populates="workflow")
    thread: Mapped[List["Thread"]] = relationship("Thread", back_populates="workflow")
    run: Mapped[List["Run"]] = relationship("Run", back_populates="workflow")


class ChatMessage(Base):
    __tablename__ = "chat_message"
    __table_args__ = (
        ForeignKeyConstraint(
            ["chat_id"], ["chat.id"], name="chat_message_chat_id_chat_id_fk"
        ),
        ForeignKeyConstraint(
            ["model_id"], ["model.id"], name="chat_message_model_id_model_id_fk"
        ),
        PrimaryKeyConstraint("id", name="chat_message_pkey"),
        Index("chat_message_created_at_idx", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    role: Mapped[str] = mapped_column(
        Enum("user", "assistant", "system", "data", name="chat_message_role")
    )
    content: Mapped[str] = mapped_column(Text)
    cost: Mapped[decimal.Decimal] = mapped_column(
        Numeric(10, 6), server_default=text("'0'::numeric")
    )
    tokens_used: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    tokens_with_context: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    model_id: Mapped[Optional[str]] = mapped_column(String(256))
    model_tag: Mapped[Optional[str]] = mapped_column(String(256))
    model_name: Mapped[Optional[str]] = mapped_column(String(256))
    reasoning: Mapped[Optional[str]] = mapped_column(Text)
    duration_in_ms: Mapped[Optional[int]] = mapped_column(Integer)
    chat_id: Mapped[Optional[str]] = mapped_column(String(256))

    chat: Mapped[Optional["Chat"]] = relationship("Chat", back_populates="chat_message")
    model: Mapped[Optional["Model"]] = relationship(
        "Model", back_populates="chat_message"
    )
    message_file: Mapped[List["MessageFile"]] = relationship(
        "MessageFile", back_populates="message"
    )


class Chunks(Base):
    __tablename__ = "chunks"
    __table_args__ = (
        ForeignKeyConstraint(
            ["resource_id"], ["resource.id"], name="chunks_resource_id_resource_id_fk"
        ),
        ForeignKeyConstraint(
            ["workflow_id"], ["workflow.id"], name="chunks_workflow_id_workflow_id_fk"
        ),
        PrimaryKeyConstraint("id", name="chunks_pkey"),
        Index("chunks_resource_id_idx", "resource_id"),
        Index("chunks_workflow_id_idx", "workflow_id"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[Any] = mapped_column(VECTOR(1536))
    active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    resource_id: Mapped[str] = mapped_column(String(256))
    workflow_id: Mapped[str] = mapped_column(String(256))

    resource: Mapped["Resource"] = relationship("Resource", back_populates="chunks")
    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="chunks")


class Thread(Base):
    __tablename__ = "thread"
    __table_args__ = (
        ForeignKeyConstraint(
            ["workflow_id"], ["workflow.id"], name="thread_workflow_id_workflow_id_fk"
        ),
        PrimaryKeyConstraint("id", name="thread_pkey"),
        Index("thread_created_at_idx", "created_at"),
        Index("thread_workflow_id_idx", "workflow_id"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    workflow_id: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="thread")
    run: Mapped[List["Run"]] = relationship("Run", back_populates="thread")
    thread_lookup_key: Mapped[List["ThreadLookupKey"]] = relationship(
        "ThreadLookupKey", back_populates="thread"
    )


class MessageFile(Base):
    __tablename__ = "message_file"
    __table_args__ = (
        ForeignKeyConstraint(
            ["message_id"],
            ["chat_message.id"],
            name="message_file_message_id_chat_message_id_fk",
        ),
        PrimaryKeyConstraint("id", name="message_file_pkey"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    url: Mapped[str] = mapped_column(String(1024))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    name: Mapped[Optional[str]] = mapped_column(String(256))
    content_type: Mapped[Optional[str]] = mapped_column(String(256))
    message_id: Mapped[Optional[str]] = mapped_column(String(256))

    message: Mapped[Optional["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="message_file"
    )


class Run(Base):
    __tablename__ = "run"
    __table_args__ = (
        ForeignKeyConstraint(
            ["model_id"], ["model.id"], name="run_model_id_model_id_fk"
        ),
        ForeignKeyConstraint(
            ["thread_id"], ["thread.id"], name="run_thread_id_thread_id_fk"
        ),
        ForeignKeyConstraint(
            ["workflow_id"], ["workflow.id"], name="run_workflow_id_workflow_id_fk"
        ),
        PrimaryKeyConstraint("id", name="run_pkey"),
        Index("run_created_at_idx", "created_at"),
        Index("run_status_idx", "status"),
        Index("run_thread_id_idx", "thread_id"),
        Index("run_workflow_id_idx", "workflow_id"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    origin: Mapped[str] = mapped_column(Enum("SDK", "WEB", name="run_origin"))
    status: Mapped[str] = mapped_column(
        Enum("RUNNING", "COMPLETED", "FAILED", name="run_status")
    )
    input: Mapped[str] = mapped_column(Text)
    prompt: Mapped[str] = mapped_column(Text)
    input_tokens: Mapped[int] = mapped_column(Integer)
    output_tokens: Mapped[int] = mapped_column(Integer)
    cost: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 6))
    duration_in_ms: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))
    output: Mapped[Optional[str]] = mapped_column(Text)
    error: Mapped[Optional[str]] = mapped_column(Text)
    full_response: Mapped[Optional[dict]] = mapped_column(JSONB)
    metadata_: Mapped[Optional[dict]] = mapped_column(
        "metadata", JSONB, server_default=text("'{}'::jsonb")
    )
    model_id: Mapped[Optional[str]] = mapped_column(String(256))
    workflow_id: Mapped[Optional[str]] = mapped_column(String(256))
    thread_id: Mapped[Optional[str]] = mapped_column(String(256))

    model: Mapped[Optional["Model"]] = relationship("Model", back_populates="run")
    thread: Mapped[Optional["Thread"]] = relationship("Thread", back_populates="run")
    workflow: Mapped[Optional["Workflow"]] = relationship(
        "Workflow", back_populates="run"
    )
    attachment: Mapped[List["Attachment"]] = relationship(
        "Attachment", back_populates="run"
    )
    run_resource: Mapped[List["RunResource"]] = relationship(
        "RunResource", back_populates="run"
    )


class ThreadLookupKey(Base):
    __tablename__ = "thread_lookup_key"
    __table_args__ = (
        ForeignKeyConstraint(
            ["thread_id"],
            ["thread.id"],
            name="thread_lookup_key_thread_id_thread_id_fk",
        ),
        PrimaryKeyConstraint("id", name="thread_lookup_key_pkey"),
        Index("thread_lookup_key_lookup_key_idx", "lookup_key"),
        Index("thread_lookup_key_thread_id_idx", "thread_id"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    lookup_key: Mapped[str] = mapped_column(String(256))
    thread_id: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )

    thread: Mapped["Thread"] = relationship(
        "Thread", back_populates="thread_lookup_key"
    )


class Attachment(Base):
    __tablename__ = "attachment"
    __table_args__ = (
        ForeignKeyConstraint(
            ["run_id"], ["run.id"], name="attachment_run_id_run_id_fk"
        ),
        PrimaryKeyConstraint("id", name="attachment_pkey"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    url: Mapped[str] = mapped_column(String(1024))
    mime_type: Mapped[str] = mapped_column(String(256))
    run_id: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True))

    run: Mapped["Run"] = relationship("Run", back_populates="attachment")


class RunResource(Base):
    __tablename__ = "run_resource"
    __table_args__ = (
        ForeignKeyConstraint(
            ["resource_id"],
            ["resource.id"],
            name="run_resource_resource_id_resource_id_fk",
        ),
        ForeignKeyConstraint(
            ["run_id"], ["run.id"], name="run_resource_run_id_run_id_fk"
        ),
        PrimaryKeyConstraint("id", name="run_resource_pkey"),
        Index("run_resource_pk", "run_id", "resource_id"),
        Index("run_resource_resource_id_idx", "resource_id"),
        Index("run_resource_run_id_idx", "run_id"),
    )

    id: Mapped[str] = mapped_column(String(256), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(256))
    resource_id: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(True), server_default=text("CURRENT_TIMESTAMP")
    )

    resource: Mapped["Resource"] = relationship(
        "Resource", back_populates="run_resource"
    )
    run: Mapped["Run"] = relationship("Run", back_populates="run_resource")
