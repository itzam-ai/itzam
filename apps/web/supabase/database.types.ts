export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
        Relationships: [
          {
            foreignKeyName: "api_key_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
          {
            foreignKeyName: "chat_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
          }
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
          }
        ]
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
          }
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
          }
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
      run: {
        Row: {
          cost: number
          created_at: string
          duration_in_ms: number
          error: string | null
          full_response: Json | null
          group_id: string | null
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
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          cost: number
          created_at?: string
          duration_in_ms: number
          error?: string | null
          full_response?: Json | null
          group_id?: string | null
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
          updated_at: string
          workflow_id?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          duration_in_ms?: number
          error?: string | null
          full_response?: Json | null
          group_id?: string | null
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
            foreignKeyName: "run_workflow_id_workflow_id_fk"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow: {
        Row: {
          context_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
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
          {
            foreignKeyName: "workflow_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      InsertSecret: {
        Args: {
          name: string
          secret: string
        }
        Returns: string
      }
    }
    Enums: {
      chat_message_role:
        | "USER"
        | "AI"
        | "user"
        | "assistant"
        | "system"
        | "data"
      context_item_type: "TEXT" | "IMAGE" | "FILE" | "URL"
      max_tokens_preset: "SHORT" | "MEDIUM" | "LONG" | "CUSTOM"
      run_origin: "SDK" | "WEB"
      run_status: "RUNNING" | "COMPLETED" | "FAILED"
      temperature_preset: "STRICT" | "BALANCED" | "CREATIVE" | "CUSTOM"
      user_role: "MEMBER" | "ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

