// Generated via `mcp__Supabase__generate_typescript_types` against the
// AmueAI project (vwacvviffixddrxbxnkc). Regenerate after every migration —
// do not hand-edit.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      agents: {
        Row: {
          allowed_origins: string[];
          brand: Json | null;
          created_at: string;
          fallback_message: string;
          id: string;
          model: string;
          name: string;
          org_id: string;
          remove_branding: boolean;
          system_prompt: string;
          temperature: number;
          welcome_message: string;
        };
        Insert: {
          allowed_origins?: string[];
          brand?: Json | null;
          created_at?: string;
          fallback_message?: string;
          id?: string;
          model?: string;
          name: string;
          org_id: string;
          remove_branding?: boolean;
          system_prompt?: string;
          temperature?: number;
          welcome_message?: string;
        };
        Update: {
          allowed_origins?: string[];
          brand?: Json | null;
          created_at?: string;
          fallback_message?: string;
          id?: string;
          model?: string;
          name?: string;
          org_id?: string;
          remove_branding?: boolean;
          system_prompt?: string;
          temperature?: number;
          welcome_message?: string;
        };
        Relationships: [];
      };
      chunks: {
        Row: {
          content: string;
          embedding: string | null;
          id: string;
          org_id: string;
          source_id: string;
        };
        Insert: {
          content: string;
          embedding?: string | null;
          id?: string;
          org_id: string;
          source_id: string;
        };
        Update: {
          content?: string;
          embedding?: string | null;
          id?: string;
          org_id?: string;
          source_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chunks_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          agent_id: string;
          created_at: string;
          id: string;
          org_id: string;
          visitor_id: string;
        };
        Insert: {
          agent_id: string;
          created_at?: string;
          id?: string;
          org_id: string;
          visitor_id: string;
        };
        Update: {
          agent_id?: string;
          created_at?: string;
          id?: string;
          org_id?: string;
          visitor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          agent_id: string;
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          org_id: string;
          role: string;
        };
        Insert: {
          agent_id: string;
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          org_id: string;
          role: string;
        };
        Update: {
          agent_id?: string;
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          org_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          agent_id: string;
          created_at: string;
          error_message: string | null;
          id: string;
          label: string;
          last_crawled_at: string | null;
          markdown_path: string | null;
          org_id: string;
          parent_source_id: string | null;
          raw_content: string | null;
          status: string;
          storage_path: string | null;
          type: string;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          agent_id: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          label: string;
          last_crawled_at?: string | null;
          markdown_path?: string | null;
          org_id: string;
          parent_source_id?: string | null;
          raw_content?: string | null;
          status?: string;
          storage_path?: string | null;
          type: string;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          agent_id?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          label?: string;
          last_crawled_at?: string | null;
          markdown_path?: string | null;
          org_id?: string;
          parent_source_id?: string | null;
          raw_content?: string | null;
          status?: string;
          storage_path?: string | null;
          type?: string;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sources_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sources_parent_source_id_fkey";
            columns: ["parent_source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      clerk_org_id: { Args: never; Returns: string };
      match_chunks: {
        Args: {
          match_agent_id: string;
          match_count?: number;
          query_embedding: string;
        };
        Returns: {
          content: string;
          similarity: number;
          source_id: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
