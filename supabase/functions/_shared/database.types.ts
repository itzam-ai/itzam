export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_key: {
        Row: {
          created_at: string
          hashed_key: string
          id: string
          is_active: boolean
          last_used_at: string | null
          name: string
          short_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hashed_key: string
          id: string
          is_active?: boolean
          last_used_at?: string | null
          name: string
          short_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          hashed_key?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          short_key?: string
          user_id?: string
        }
        Relationships: []
      }
      attachment: {
        Row: {
          created_at: string
          id: string
          mime_type: string
          run_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id: string
          mime_type: string
          run_id: string
          updated_at: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string
          run_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachment_run_id_run_id_fk"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "run"
            referencedColumns: ["id"]
          },
        ]
      }
      chat: {
        Row: {
          created_at: string
          id: string
          last_model_id: string | null
          last_model_tag: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          last_model_id?: string | null
          last_model_tag?: string | null
          title?: string | null
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_model_id?: string | null
          last_model_tag?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_last_model_id_model_id_fk"
            columns: ["last_model_id"]
            isOneToOne: false
            referencedRelation: "model"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message: {
        Row: {
          chat_id: string | null
          content: string
          cost: number
          created_at: string
          duration_in_ms: number | null
          id: string
          model_id: string | null
          model_name: string | null
          model_tag: string | null
          reasoning: string | null
          role: Database["public"]["Enums"]["chat_message_role"]
          tokens_used: number
          tokens_with_context: number
          updated_at: string
        }
        Insert: {
          chat_id?: string | null
          content: string
          cost?: number
          created_at?: string
          duration_in_ms?: number | null
          id: string
          model_id?: string | null
          model_name?: string | null
          model_tag?: string | null
          reasoning?: string | null
          role: Database["public"]["Enums"]["chat_message_role"]
          tokens_used?: number
          tokens_with_context?: number
          updated_at: string
        }
        Update: {
          chat_id?: string | null
          content?: string
          cost?: number
          created_at?: string
          duration_in_ms?: number | null
          id?: string
          model_id?: string | null
          model_name?: string | null
          model_tag?: string | null
          reasoning?: string | null
          role?: Database["public"]["Enums"]["chat_message_role"]
          tokens_used?: number
          tokens_with_context?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_chat_id_chat_id_fk"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_model_id_model_id_fk"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "model"
            referencedColumns: ["id"]
          },
        ]
      }
      chunks: {
        Row: {
          active: boolean
          content: string
          created_at: string
          embedding: string
          id: string
          resource_id: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          embedding: string
          id: string
          resource_id: string
          updated_at: string
          workflow_id: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          embedding?: string
          id?: string
          resource_id?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chunks_resource_id_resource_id_fk"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resource"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunks_workflow_id_workflow_id_fk"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow"
            referencedColumns: ["id"]
          },
        ]
      }
      context: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      context_item: {
        Row: {
          content: string
          context_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["context_item_type"]
          updated_at: string
        }
        Insert: {
          content: string
          context_id?: string | null
          created_at?: string
          description?: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["context_item_type"]
          updated_at: string
        }
        Update: {
          content?: string
          context_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["context_item_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_item_context_id_context_id_fk"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_file: {
        Row: {
          content_type: string | null
          created_at: string
          id: string
          message_id: string | null
          name: string | null
          updated_at: string
          url: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          id: string
          message_id?: string | null
          name?: string | null
          updated_at: string
          url: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          name?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_file_message_id_chat_message_id_fk"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_message"
            referencedColumns: ["id"]
          },
        ]
      }
      model: {
        Row: {
          context_window_size: number
          created_at: string
          default_temperature: number
          deprecated: boolean
          has_reasoning_capability: boolean
          has_vision: boolean
          id: string
          input_per_million_token_cost: number | null
          is_open_source: boolean
          max_temperature: number
          max_tokens: number
          name: string
          output_per_million_token_cost: number | null
          provider_id: string | null
          tag: string
          updated_at: string
        }
        Insert: {
          context_window_size?: number
          created_at?: string
          default_temperature: number
          deprecated?: boolean
          has_reasoning_capability?: boolean
          has_vision?: boolean
          id: string
          input_per_million_token_cost?: number | null
          is_open_source?: boolean
          max_temperature: number
          max_tokens: number
          name: string
          output_per_million_token_cost?: number | null
          provider_id?: string | null
          tag: string
          updated_at: string
        }
        Update: {
          context_window_size?: number
          created_at?: string
          default_temperature?: number
          deprecated?: boolean
          has_reasoning_capability?: boolean
          has_vision?: boolean
          id?: string
          input_per_million_token_cost?: number | null
          is_open_source?: boolean
          max_temperature?: number
          max_tokens?: number
          name?: string
          output_per_million_token_cost?: number | null
          provider_id?: string | null
          tag?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_provider_id_provider_id_fk"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider"
            referencedColumns: ["id"]
          },
        ]
      }
      model_settings: {
        Row: {
          created_at: string
          id: string
          max_tokens: number
          max_tokens_preset: Database["public"]["Enums"]["max_tokens_preset"]
          temperature: number
          temperature_preset: Database["public"]["Enums"]["temperature_preset"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          max_tokens: number
          max_tokens_preset: Database["public"]["Enums"]["max_tokens_preset"]
          temperature: number
          temperature_preset: Database["public"]["Enums"]["temperature_preset"]
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          max_tokens?: number
          max_tokens_preset?: Database["public"]["Enums"]["max_tokens_preset"]
          temperature?: number
          temperature_preset?: Database["public"]["Enums"]["temperature_preset"]
          updated_at?: string
        }
        Relationships: []
      }
      provider: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_key: {
        Row: {
          created_at: string
          id: string
          provider_id: string | null
          secret_id: string
          secret_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          provider_id?: string | null
          secret_id: string
          secret_name: string
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string | null
          secret_id?: string
          secret_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_key_provider_id_provider_id_fk"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider"
            referencedColumns: ["id"]
          },
        ]
      }
      resource: {
        Row: {
          active: boolean
          created_at: string
          file_name: string | null
          file_size: number | null
          id: string
          knowledge_id: string | null
          last_scraped_at: string | null
          mime_type: string
          processed_batches: number
          scrape_frequency: Database["public"]["Enums"]["resource_scrape_frequency"]
          status: Database["public"]["Enums"]["resource_status"]
          title: string | null
<<<<<<< HEAD
=======
          total_batches: number
>>>>>>> origin/main
          total_chunks: number
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id: string
          knowledge_id?: string | null
          last_scraped_at?: string | null
          mime_type: string
          processed_batches?: number
          scrape_frequency?: Database["public"]["Enums"]["resource_scrape_frequency"]
          status?: Database["public"]["Enums"]["resource_status"]
          title?: string | null
<<<<<<< HEAD
=======
          total_batches?: number
>>>>>>> origin/main
          total_chunks?: number
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          knowledge_id?: string | null
          last_scraped_at?: string | null
          mime_type?: string
          processed_batches?: number
          scrape_frequency?: Database["public"]["Enums"]["resource_scrape_frequency"]
          status?: Database["public"]["Enums"]["resource_status"]
          title?: string | null
<<<<<<< HEAD
=======
          total_batches?: number
>>>>>>> origin/main
          total_chunks?: number
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_knowledge_id_knowledge_id_fk"
            columns: ["knowledge_id"]
            isOneToOne: false
            referencedRelation: "knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      run: {
        Row: {
          cost: number
          created_at: string
          duration_in_ms: number
          error: string | null
          full_response: Json | null
          id: string
          input: string
          input_tokens: number
          metadata: Json | null
          model_id: string | null
          origin: Database["public"]["Enums"]["run_origin"]
          output: string | null
          output_tokens: number
          prompt: string
          status: Database["public"]["Enums"]["run_status"]
          thread_id: string | null
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          cost: number
          created_at?: string
          duration_in_ms: number
          error?: string | null
          full_response?: Json | null
          id: string
          input: string
          input_tokens: number
          metadata?: Json | null
          model_id?: string | null
          origin: Database["public"]["Enums"]["run_origin"]
          output?: string | null
          output_tokens: number
          prompt: string
          status: Database["public"]["Enums"]["run_status"]
          thread_id?: string | null
          updated_at: string
          workflow_id?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          duration_in_ms?: number
          error?: string | null
          full_response?: Json | null
          id?: string
          input?: string
          input_tokens?: number
          metadata?: Json | null
          model_id?: string | null
          origin?: Database["public"]["Enums"]["run_origin"]
          output?: string | null
          output_tokens?: number
          prompt?: string
          status?: Database["public"]["Enums"]["run_status"]
          thread_id?: string | null
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "run_model_id_model_id_fk"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "model"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_thread_id_thread_id_fk"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "thread"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_workflow_id_workflow_id_fk"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow"
            referencedColumns: ["id"]
          },
        ]
      }
      run_resource: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          run_id: string
        }
        Insert: {
          created_at?: string
          id: string
          resource_id: string
          run_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_resource_resource_id_resource_id_fk"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resource"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_resource_run_id_run_id_fk"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "run"
            referencedColumns: ["id"]
          },
        ]
      }
      thread: {
        Row: {
          created_at: string
          id: string
          lookup_key: string | null
          name: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          id: string
          lookup_key?: string | null
          name: string
          updated_at: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lookup_key?: string | null
          name?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_workflow_id_workflow_id_fk"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow: {
        Row: {
          context_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          knowledge_id: string
          model_id: string
          model_settings_id: string
          name: string
          prompt: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_id: string
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          knowledge_id: string
          model_id: string
          model_settings_id: string
          name: string
          prompt: string
          slug: string
          updated_at: string
          user_id: string
        }
        Update: {
          context_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          knowledge_id?: string
          model_id?: string
          model_settings_id?: string
          name?: string
          prompt?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_context_id_context_id_fk"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_knowledge_id_knowledge_id_fk"
            columns: ["knowledge_id"]
            isOneToOne: false
            referencedRelation: "knowledge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_model_id_model_id_fk"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "model"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_model_settings_id_model_settings_id_fk"
            columns: ["model_settings_id"]
            isOneToOne: false
            referencedRelation: "model_settings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_secret: {
        Args: { secret_name: string }
        Returns: string
      }
      get_secret: {
        Args: { secret_name: string }
        Returns: string
      }
      insert_secret: {
        Args: { secret_name: string; secret_value: string }
        Returns: string
      }
      update_secret: {
        Args: { secret_id: string; secret_value: string; secret_name: string }
        Returns: string
      }
    }
    Enums: {
      chat_message_role: "user" | "assistant" | "system" | "data"
      context_item_type: "TEXT" | "IMAGE" | "FILE" | "URL"
      max_tokens_preset: "SHORT" | "MEDIUM" | "LONG" | "CUSTOM"
      OcrTestStatus: "IDLE" | "RUNNING" | "DONE"
      resource_scrape_frequency: "NEVER" | "HOURLY" | "DAILY" | "WEEKLY"
      resource_status: "PENDING" | "PROCESSED" | "FAILED"
      resource_type: "FILE" | "LINK"
      run_origin: "SDK" | "WEB"
      run_status: "RUNNING" | "COMPLETED" | "FAILED"
      temperature_preset: "STRICT" | "BALANCED" | "CREATIVE" | "CUSTOM"
      TransactionType: "DEPOSIT" | "WITHDRAWAL" | "OCR_TEST"
      user_role: "MEMBER" | "ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chat_message_role: ["user", "assistant", "system", "data"],
      context_item_type: ["TEXT", "IMAGE", "FILE", "URL"],
      max_tokens_preset: ["SHORT", "MEDIUM", "LONG", "CUSTOM"],
      OcrTestStatus: ["IDLE", "RUNNING", "DONE"],
      resource_scrape_frequency: ["NEVER", "HOURLY", "DAILY", "WEEKLY"],
      resource_status: ["PENDING", "PROCESSED", "FAILED"],
      resource_type: ["FILE", "LINK"],
      run_origin: ["SDK", "WEB"],
      run_status: ["RUNNING", "COMPLETED", "FAILED"],
      temperature_preset: ["STRICT", "BALANCED", "CREATIVE", "CUSTOM"],
      TransactionType: ["DEPOSIT", "WITHDRAWAL", "OCR_TEST"],
      user_role: ["MEMBER", "ADMIN"],
    },
  },
} as const
