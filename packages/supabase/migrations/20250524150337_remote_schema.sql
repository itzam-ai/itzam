

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "drizzle";


ALTER SCHEMA "drizzle" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pgsodium";








ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "pgmq";
CREATE EXTENSION IF NOT EXISTS "pgmq" WITH SCHEMA "pgmq";




CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE TYPE "public"."OcrTestStatus" AS ENUM (
    'IDLE',
    'RUNNING',
    'DONE'
);


ALTER TYPE "public"."OcrTestStatus" OWNER TO "postgres";


CREATE TYPE "public"."TransactionType" AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'OCR_TEST'
);


ALTER TYPE "public"."TransactionType" OWNER TO "postgres";


CREATE TYPE "public"."chat_message_role" AS ENUM (
    'user',
    'assistant',
    'system',
    'data'
);


ALTER TYPE "public"."chat_message_role" OWNER TO "postgres";


CREATE TYPE "public"."context_item_type" AS ENUM (
    'TEXT',
    'IMAGE',
    'FILE',
    'URL'
);


ALTER TYPE "public"."context_item_type" OWNER TO "postgres";


CREATE TYPE "public"."max_tokens_preset" AS ENUM (
    'SHORT',
    'MEDIUM',
    'LONG',
    'CUSTOM'
);


ALTER TYPE "public"."max_tokens_preset" OWNER TO "postgres";


CREATE TYPE "public"."resource_status" AS ENUM (
    'PENDING',
    'PROCESSED',
    'FAILED'
);


ALTER TYPE "public"."resource_status" OWNER TO "postgres";


CREATE TYPE "public"."resource_type" AS ENUM (
    'FILE',
    'LINK'
);


ALTER TYPE "public"."resource_type" OWNER TO "postgres";


CREATE TYPE "public"."run_origin" AS ENUM (
    'SDK',
    'WEB'
);


ALTER TYPE "public"."run_origin" OWNER TO "postgres";


CREATE TYPE "public"."run_status" AS ENUM (
    'RUNNING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE "public"."run_status" OWNER TO "postgres";


CREATE TYPE "public"."temperature_preset" AS ENUM (
    'STRICT',
    'BALANCED',
    'CREATIVE',
    'CUSTOM'
);


ALTER TYPE "public"."temperature_preset" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'MEMBER',
    'ADMIN'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_secret"("secret_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$declare
  deleted_id uuid;
begin
  if current_setting('role') != 'service_role' then
    raise exception 'authentication required';
  end if;

  delete from vault.decrypted_secrets
  where name = secret_name
  returning id into deleted_id;

  return deleted_id;
end;$$;


ALTER FUNCTION "public"."delete_secret"("secret_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_secret"("secret_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  secret text;
begin
  if current_setting('role') != 'service_role' then
    raise exception 'authentication required';
  end if;
  select decrypted_secret from vault.decrypted_secrets where name =
  secret_name into secret;
  return secret;
end;
$$;


ALTER FUNCTION "public"."get_secret"("secret_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_secret"("secret_name" "text", "secret_value" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$begin
  if current_setting('role') != 'service_role' then
    raise exception 'authentication required';
  end if;

  return vault.create_secret(secret_value, secret_name);
end;$$;


ALTER FUNCTION "public"."insert_secret"("secret_name" "text", "secret_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_secret"("secret_id" "uuid", "secret_value" "text", "secret_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$begin
  if current_setting('role') != 'service_role' then
    raise exception 'authentication required';
  end if;

  return vault.update_secret(
    secret_id,
    secret_value,
    secret_name
  );
end;$$;


ALTER FUNCTION "public"."update_secret"("secret_id" "uuid", "secret_value" "text", "secret_name" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    "id" integer NOT NULL,
    "hash" "text" NOT NULL,
    "created_at" bigint
);


ALTER TABLE "drizzle"."__drizzle_migrations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "drizzle"."__drizzle_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "drizzle"."__drizzle_migrations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNED BY "drizzle"."__drizzle_migrations"."id";



CREATE TABLE IF NOT EXISTS "public"."api_key" (
    "id" character varying(256) NOT NULL,
    "name" character varying(256) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "short_key" character varying(256) NOT NULL,
    "hashed_key" character varying(256) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "last_used_at" timestamp with time zone,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."api_key" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat" (
    "id" character varying(256) NOT NULL,
    "title" character varying(256),
    "last_model_id" character varying(256),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "user_id" "uuid" NOT NULL,
    "last_model_tag" character varying(256)
);


ALTER TABLE "public"."chat" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_message" (
    "id" character varying(256) NOT NULL,
    "model_id" character varying(256),
    "model_tag" character varying(256),
    "model_name" character varying(256),
    "role" "public"."chat_message_role" NOT NULL,
    "content" "text" NOT NULL,
    "cost" numeric(10,6) DEFAULT '0'::numeric NOT NULL,
    "tokens_used" integer DEFAULT 0 NOT NULL,
    "tokens_with_context" integer DEFAULT 0 NOT NULL,
    "reasoning" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "duration_in_ms" integer,
    "chat_id" character varying(256)
);


ALTER TABLE "public"."chat_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chunks" (
    "id" character varying(256) NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "extensions"."vector"(1536) NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "resource_id" character varying(256),
    "workflow_id" character varying(256) NOT NULL
);


ALTER TABLE "public"."chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."context" (
    "id" character varying(256) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."context" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."context_item" (
    "id" character varying(256) NOT NULL,
    "name" character varying(256) NOT NULL,
    "description" "text",
    "content" "text" NOT NULL,
    "type" "public"."context_item_type" NOT NULL,
    "context_id" character varying(256),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."context_item" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge" (
    "id" character varying(256) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."knowledge" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_file" (
    "id" character varying(256) NOT NULL,
    "url" character varying(1024) NOT NULL,
    "name" character varying(256),
    "content_type" character varying(256),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "message_id" character varying(256)
);


ALTER TABLE "public"."message_file" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."model" (
    "id" character varying(256) NOT NULL,
    "tag" character varying(256) NOT NULL,
    "name" character varying(256) NOT NULL,
    "has_vision" boolean DEFAULT false NOT NULL,
    "input_per_million_token_cost" numeric(10,6),
    "output_per_million_token_cost" numeric(10,6),
    "provider_id" character varying(256),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "deprecated" boolean DEFAULT false NOT NULL,
    "has_reasoning_capability" boolean DEFAULT false NOT NULL,
    "is_open_source" boolean DEFAULT false NOT NULL,
    "context_window_size" integer DEFAULT 0 NOT NULL,
    "max_temperature" numeric(3,2) NOT NULL,
    "default_temperature" numeric(3,2) NOT NULL,
    "max_tokens" integer NOT NULL
);


ALTER TABLE "public"."model" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."model_settings" (
    "id" character varying(256) NOT NULL,
    "temperature" numeric(3,2) NOT NULL,
    "temperature_preset" "public"."temperature_preset" NOT NULL,
    "max_tokens" integer NOT NULL,
    "max_tokens_preset" "public"."max_tokens_preset" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."model_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider" (
    "id" character varying(256) NOT NULL,
    "name" character varying(256) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."provider" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_key" (
    "id" character varying(256) NOT NULL,
    "secret_id" character varying(256) NOT NULL,
    "secret_name" character varying(256) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "provider_id" character varying(256),
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."provider_key" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resource" (
    "id" character varying(256) NOT NULL,
    "title" character varying(256),
    "file_name" character varying(256),
    "file_size" integer,
    "active" boolean DEFAULT true NOT NULL,
    "status" "public"."resource_status" DEFAULT 'PENDING'::"public"."resource_status" NOT NULL,
    "url" character varying(1024) NOT NULL,
    "type" "public"."resource_type" NOT NULL,
    "mime_type" character varying(256) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "knowledge_id" character varying(256)
);


ALTER TABLE "public"."resource" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."run" (
    "id" character varying(256) NOT NULL,
    "origin" "public"."run_origin" NOT NULL,
    "status" "public"."run_status" NOT NULL,
    "input" "text" NOT NULL,
    "output" "text",
    "error" "text",
    "prompt" "text" NOT NULL,
    "input_tokens" integer NOT NULL,
    "output_tokens" integer NOT NULL,
    "cost" numeric(10,6) NOT NULL,
    "duration_in_ms" integer NOT NULL,
    "full_response" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "group_id" character varying(256),
    "model_id" character varying(256),
    "workflow_id" character varying(256),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."run" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."run_resource" (
    "id" character varying(256) NOT NULL,
    "run_id" character varying(256) NOT NULL,
    "resource_id" character varying(256) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."run_resource" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow" (
    "id" character varying(256) NOT NULL,
    "name" character varying(256) NOT NULL,
    "description" "text",
    "slug" character varying(256) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "prompt" "text" NOT NULL,
    "context_id" character varying(256) NOT NULL,
    "model_id" character varying(256) NOT NULL,
    "model_settings_id" character varying(256) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "knowledge_id" character varying(256) NOT NULL
);


ALTER TABLE "public"."workflow" OWNER TO "postgres";


ALTER TABLE ONLY "drizzle"."__drizzle_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"drizzle"."__drizzle_migrations_id_seq"'::"regclass");



ALTER TABLE ONLY "drizzle"."__drizzle_migrations"
    ADD CONSTRAINT "__drizzle_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_key"
    ADD CONSTRAINT "api_key_hashed_key_unique" UNIQUE ("hashed_key");



ALTER TABLE ONLY "public"."api_key"
    ADD CONSTRAINT "api_key_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_key"
    ADD CONSTRAINT "api_key_short_key_unique" UNIQUE ("short_key");



ALTER TABLE ONLY "public"."chat_message"
    ADD CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat"
    ADD CONSTRAINT "chat_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chunks"
    ADD CONSTRAINT "chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."context_item"
    ADD CONSTRAINT "context_item_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."context"
    ADD CONSTRAINT "context_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge"
    ADD CONSTRAINT "knowledge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_file"
    ADD CONSTRAINT "message_file_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model"
    ADD CONSTRAINT "model_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model_settings"
    ADD CONSTRAINT "model_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model"
    ADD CONSTRAINT "model_tag_unique" UNIQUE ("tag");



ALTER TABLE ONLY "public"."provider_key"
    ADD CONSTRAINT "provider_key_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_key"
    ADD CONSTRAINT "provider_key_secret_id_unique" UNIQUE ("secret_id");



ALTER TABLE ONLY "public"."provider_key"
    ADD CONSTRAINT "provider_key_secret_name_unique" UNIQUE ("secret_name");



ALTER TABLE ONLY "public"."provider"
    ADD CONSTRAINT "provider_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource"
    ADD CONSTRAINT "resource_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."run"
    ADD CONSTRAINT "run_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."run_resource"
    ADD CONSTRAINT "run_resource_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow"
    ADD CONSTRAINT "workflow_pkey" PRIMARY KEY ("id");



CREATE INDEX "api_key_hashed_key_idx" ON "public"."api_key" USING "btree" ("hashed_key");



CREATE INDEX "api_key_user_id_idx" ON "public"."api_key" USING "btree" ("user_id");



CREATE INDEX "chat_created_at_idx" ON "public"."chat" USING "btree" ("created_at");



CREATE INDEX "chat_message_created_at_idx" ON "public"."chat_message" USING "btree" ("created_at");



CREATE INDEX "chat_updated_at_idx" ON "public"."chat" USING "btree" ("updated_at");



CREATE INDEX "chunks_workflow_id_idx" ON "public"."chunks" USING "btree" ("workflow_id");



CREATE INDEX "context_id_idx" ON "public"."context_item" USING "btree" ("context_id");



CREATE INDEX "provider_id_idx" ON "public"."model" USING "btree" ("provider_id");



CREATE INDEX "provider_key_secret_id_idx" ON "public"."provider_key" USING "btree" ("secret_id");



CREATE INDEX "provider_key_secret_name_idx" ON "public"."provider_key" USING "btree" ("secret_name");



CREATE INDEX "resource_knowledge_id_idx" ON "public"."resource" USING "btree" ("knowledge_id");



CREATE INDEX "run_created_at_idx" ON "public"."run" USING "btree" ("created_at");



CREATE INDEX "run_resource_pk" ON "public"."run_resource" USING "btree" ("run_id", "resource_id");



CREATE INDEX "run_resource_resource_id_idx" ON "public"."run_resource" USING "btree" ("resource_id");



CREATE INDEX "run_resource_run_id_idx" ON "public"."run_resource" USING "btree" ("run_id");



CREATE INDEX "run_status_idx" ON "public"."run" USING "btree" ("status");



CREATE INDEX "run_workflow_id_idx" ON "public"."run" USING "btree" ("workflow_id");



CREATE INDEX "tag_idx" ON "public"."model" USING "btree" ("tag");



CREATE INDEX "workflow_context_id_idx" ON "public"."workflow" USING "btree" ("context_id");



CREATE INDEX "workflow_model_id_idx" ON "public"."workflow" USING "btree" ("model_id");



CREATE INDEX "workflow_model_settings_id_idx" ON "public"."workflow" USING "btree" ("model_settings_id");



CREATE INDEX "workflow_slug_idx" ON "public"."workflow" USING "btree" ("slug");



CREATE INDEX "workflow_user_id_idx" ON "public"."workflow" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."api_key"
    ADD CONSTRAINT "api_key_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."chat"
    ADD CONSTRAINT "chat_last_model_id_model_id_fk" FOREIGN KEY ("last_model_id") REFERENCES "public"."model"("id");



ALTER TABLE ONLY "public"."chat_message"
    ADD CONSTRAINT "chat_message_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id");



ALTER TABLE ONLY "public"."chat_message"
    ADD CONSTRAINT "chat_message_model_id_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."model"("id");



ALTER TABLE ONLY "public"."chat"
    ADD CONSTRAINT "chat_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."chunks"
    ADD CONSTRAINT "chunks_resource_id_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("id");



ALTER TABLE ONLY "public"."chunks"
    ADD CONSTRAINT "chunks_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id");



ALTER TABLE ONLY "public"."context_item"
    ADD CONSTRAINT "context_item_context_id_context_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."context"("id");



ALTER TABLE ONLY "public"."message_file"
    ADD CONSTRAINT "message_file_message_id_chat_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_message"("id");



ALTER TABLE ONLY "public"."model"
    ADD CONSTRAINT "model_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id");



ALTER TABLE ONLY "public"."provider_key"
    ADD CONSTRAINT "provider_key_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id");



ALTER TABLE ONLY "public"."provider_key"
    ADD CONSTRAINT "provider_key_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."resource"
    ADD CONSTRAINT "resource_knowledge_id_knowledge_id_fk" FOREIGN KEY ("knowledge_id") REFERENCES "public"."knowledge"("id");



ALTER TABLE ONLY "public"."run"
    ADD CONSTRAINT "run_model_id_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."model"("id");



ALTER TABLE ONLY "public"."run_resource"
    ADD CONSTRAINT "run_resource_resource_id_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("id");



ALTER TABLE ONLY "public"."run_resource"
    ADD CONSTRAINT "run_resource_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id");



ALTER TABLE ONLY "public"."run"
    ADD CONSTRAINT "run_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id");



ALTER TABLE ONLY "public"."workflow"
    ADD CONSTRAINT "workflow_context_id_context_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."context"("id");



ALTER TABLE ONLY "public"."workflow"
    ADD CONSTRAINT "workflow_knowledge_id_knowledge_id_fk" FOREIGN KEY ("knowledge_id") REFERENCES "public"."knowledge"("id");



ALTER TABLE ONLY "public"."workflow"
    ADD CONSTRAINT "workflow_model_id_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."model"("id");



ALTER TABLE ONLY "public"."workflow"
    ADD CONSTRAINT "workflow_model_settings_id_model_settings_id_fk" FOREIGN KEY ("model_settings_id") REFERENCES "public"."model_settings"("id");



ALTER TABLE ONLY "public"."workflow"
    ADD CONSTRAINT "workflow_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."delete_secret"("secret_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_secret"("secret_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_secret"("secret_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_secret"("secret_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_secret"("secret_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_secret"("secret_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_secret"("secret_name" "text", "secret_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_secret"("secret_name" "text", "secret_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_secret"("secret_name" "text", "secret_value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_secret"("secret_id" "uuid", "secret_value" "text", "secret_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_secret"("secret_id" "uuid", "secret_value" "text", "secret_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_secret"("secret_id" "uuid", "secret_value" "text", "secret_name" "text") TO "service_role";




































GRANT ALL ON TABLE "public"."api_key" TO "anon";
GRANT ALL ON TABLE "public"."api_key" TO "authenticated";
GRANT ALL ON TABLE "public"."api_key" TO "service_role";



GRANT ALL ON TABLE "public"."chat" TO "anon";
GRANT ALL ON TABLE "public"."chat" TO "authenticated";
GRANT ALL ON TABLE "public"."chat" TO "service_role";



GRANT ALL ON TABLE "public"."chat_message" TO "anon";
GRANT ALL ON TABLE "public"."chat_message" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_message" TO "service_role";



GRANT ALL ON TABLE "public"."chunks" TO "anon";
GRANT ALL ON TABLE "public"."chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."chunks" TO "service_role";



GRANT ALL ON TABLE "public"."context" TO "anon";
GRANT ALL ON TABLE "public"."context" TO "authenticated";
GRANT ALL ON TABLE "public"."context" TO "service_role";



GRANT ALL ON TABLE "public"."context_item" TO "anon";
GRANT ALL ON TABLE "public"."context_item" TO "authenticated";
GRANT ALL ON TABLE "public"."context_item" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge" TO "anon";
GRANT ALL ON TABLE "public"."knowledge" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge" TO "service_role";



GRANT ALL ON TABLE "public"."message_file" TO "anon";
GRANT ALL ON TABLE "public"."message_file" TO "authenticated";
GRANT ALL ON TABLE "public"."message_file" TO "service_role";



GRANT ALL ON TABLE "public"."model" TO "anon";
GRANT ALL ON TABLE "public"."model" TO "authenticated";
GRANT ALL ON TABLE "public"."model" TO "service_role";



GRANT ALL ON TABLE "public"."model_settings" TO "anon";
GRANT ALL ON TABLE "public"."model_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."model_settings" TO "service_role";



GRANT ALL ON TABLE "public"."provider" TO "anon";
GRANT ALL ON TABLE "public"."provider" TO "authenticated";
GRANT ALL ON TABLE "public"."provider" TO "service_role";



GRANT ALL ON TABLE "public"."provider_key" TO "anon";
GRANT ALL ON TABLE "public"."provider_key" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_key" TO "service_role";



GRANT ALL ON TABLE "public"."resource" TO "anon";
GRANT ALL ON TABLE "public"."resource" TO "authenticated";
GRANT ALL ON TABLE "public"."resource" TO "service_role";



GRANT ALL ON TABLE "public"."run" TO "anon";
GRANT ALL ON TABLE "public"."run" TO "authenticated";
GRANT ALL ON TABLE "public"."run" TO "service_role";



GRANT ALL ON TABLE "public"."run_resource" TO "anon";
GRANT ALL ON TABLE "public"."run_resource" TO "authenticated";
GRANT ALL ON TABLE "public"."run_resource" TO "service_role";



GRANT ALL ON TABLE "public"."workflow" TO "anon";
GRANT ALL ON TABLE "public"."workflow" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";



























RESET ALL;
